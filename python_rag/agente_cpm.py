"""
============================================================
 AGENTE CPM - ASSISTENTE PROCESSO SELETIVO 2026.1
============================================================
Autor: Pollyana Sousa
Data: Janeiro/2026
Descrição: RAG com Groq para consultas sobre editais CPM
Versão: 3.2 - Ajustes para deploy no Render sem emojis
"""
import os
import sys
import pickle
import re
from pathlib import Path
from dotenv import load_dotenv

# Importações LangChain
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ============================================================
# 1. CARREGAR VARIÁVEIS DE AMBIENTE
# ============================================================
# Render define variáveis de ambiente automaticamente
# Localmente, usamos .env
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("Erro: GROQ_API_KEY não configurada.")
    sys.exit(1)

# ============================================================
# 2. CACHE DO VETOR FAISS
# ============================================================
CACHE_FAISS = Path(__file__).parent / "cache_faiss.index"
CACHE_STORE = Path(__file__).parent / "cache_store.pkl"

def salvar_cache(base):
    """Salva FAISS e metadata no disco"""
    base.save_local(str(CACHE_FAISS))
    with open(CACHE_STORE, "wb") as f:
        pickle.dump(base.docstore, f)

def carregar_cache():
    """Carrega FAISS do disco se existir"""
    if CACHE_FAISS.exists() and CACHE_STORE.exists():
        try:
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
            )
            base = FAISS.load_local(
                str(CACHE_FAISS),
                embeddings,
                allow_dangerous_deserialization=True
            )
            with open(CACHE_STORE, "rb") as f:
                base.docstore = pickle.load(f)
            print("Cache FAISS carregado", file=sys.stderr)
            return base
        except Exception as e:
            print("Cache inválido, reconstruindo...", file=sys.stderr)
            print(e, file=sys.stderr)
            return None
    return None

# ============================================================
# 3. LIMPEZA PROFUNDA DE TEXTO
# ============================================================
def limpar_texto_pdf(texto):
    """Limpa e normaliza texto extraído de PDF"""
    try:
        texto = texto.encode("latin-1", "ignore").decode("utf-8", "ignore")
    except:
        pass
    # Remover hifenização de quebra de linha
    texto = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", texto)
    # Substituir múltiplos espaços por espaço único
    texto = re.sub(r'\s+', ' ', texto)
    # Juntar palavras separadas por quebra de linha
    texto = re.sub(r'(\w)\s*\n\s*(\w)', r'\1 \2', texto)
    # Remover quebras de linha excessivas
    texto = re.sub(r'\n\s*\n\s*\n+', '\n\n', texto)
    # Remover cabeçalhos e rodapés comuns
    texto = re.sub(r'Página\s+\d+\s+de\s+\d+', '', texto, flags=re.I)
    texto = re.sub(r'CPM\s+-\s+Conservatório.*?\n', '', texto, flags=re.I)
    return texto.strip()

# ============================================================
# 4. CARREGAR PDFs COM LIMPEZA APRIMORADA
# ============================================================
def carregar_pdfs_cpm():
    """Carrega PDFs e cria FAISS se não houver cache"""
    cache = carregar_cache()
    if cache:
        return cache

    pasta_dados = Path(__file__).parent / "dados"
    if not pasta_dados.exists():
        raise Exception(f"Pasta de dados não encontrada: {pasta_dados}")

    lista_pdfs = list(pasta_dados.glob("*.pdf"))
    if not lista_pdfs:
        raise Exception("Nenhum PDF encontrado em 'dados/'.")

    documentos = []

    for pdf_path in lista_pdfs:
        try:
            loader = PyPDFLoader(str(pdf_path))
            docs_brutos = loader.load()
            for d in docs_brutos:
                d.page_content = limpar_texto_pdf(d.page_content)

            # Divisão em chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=600,
                chunk_overlap=150,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            docs_divididos = text_splitter.split_documents(docs_brutos)
            documentos.extend(docs_divididos)
            print(f"Carregado: {pdf_path.name} ({len(docs_divididos)} trechos)", file=sys.stderr)
        except Exception as e:
            print(f"Erro ao carregar {pdf_path.name}: {e}", file=sys.stderr)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
    )
    base = FAISS.from_documents(documentos, embeddings)
    salvar_cache(base)
    return base

# ============================================================
# 5. PROMPT DO AGENTE
# ============================================================
prompt_principal = ChatPromptTemplate.from_messages([
    ("system", """
Você é o Assistente CPM. Responda com base apenas nos documentos fornecidos.
Responda de forma direta e objetiva, cite datas e documentos exatamente.
Nunca invente respostas.
"""),
    ("user", """
DOCUMENTOS DISPONÍVEIS:
{contexto}

PERGUNTA DO CANDIDATO:
{input}
""")
])

# ============================================================
# 6. FUNÇÕES DE BUSCA
# ============================================================
def extrair_termos_chave(pergunta):
    """Extrai palavras relevantes ignorando stopwords"""
    stopwords = {
        'o','a','os','as','de','da','do','das','dos','um','uma','uns','umas',
        'para','com','em','no','na','nos','nas','qual','quais','quando','onde',
        'como','que','é','são','sobre','pelo','pela'
    }
    return [p for p in pergunta.lower().split() if p not in stopwords and len(p) > 2]

def consultar_agente(base, pergunta, modelo):
    """Busca otimizada com limpeza de texto"""
    docs_score = base.similarity_search_with_score(pergunta, k=50)
    termos = extrair_termos_chave(pergunta)
    docs_termos = base.similarity_search_with_score(" ".join(termos), k=30) if termos else []
    todos_docs = sorted(docs_score + docs_termos, key=lambda x: x[1])
    contexto = []
    docs_vistos = set()
    for doc, score in todos_docs:
        if score > 8.0:
            continue
        doc_hash = hash(doc.page_content[:150])
        if doc_hash in docs_vistos:
            continue
        docs_vistos.add(doc_hash)
        fonte = Path(doc.metadata.get("source", "")).name
        contexto.append(f"[{fonte}]\n{doc.page_content}\n")
        if len(contexto) >= 20:
            break
    if not contexto:
        return "Não encontrei informações relevantes nos editais."
    contexto_final = "\n---\n".join(contexto)
    chain = prompt_principal | modelo
    resposta = chain.invoke({"contexto": contexto_final, "input": pergunta})
    return resposta.content.strip()

# ============================================================
# 7. MAIN
# ============================================================
def main():
    if len(sys.argv) < 2:
        print("Erro: Pergunta não fornecida.")
        sys.exit(1)

    pergunta = sys.argv[1]

    try:
        print("Inicializando Agente CPM...", file=sys.stderr)
        modelo = ChatGroq(api_key=GROQ_API_KEY, model="llama-3.3-70b-versatile", temperature=0.1)
        print("Carregando editais...", file=sys.stderr)
        base = carregar_pdfs_cpm()
        print("Consultando...", file=sys.stderr)
        resposta = consultar_agente(base, pergunta, modelo)
        print("\n" + resposta)
    except Exception as e:
        print(f"Erro: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
