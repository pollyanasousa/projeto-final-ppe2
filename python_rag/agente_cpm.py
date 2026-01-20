"""
============================================================
 AGENTE CPM - ASSISTENTE PROCESSO SELETIVO 2026.1
============================================================
"""
import os
import sys
import pickle
import re
from pathlib import Path
from dotenv import load_dotenv

# Importacoes LangChain atualizadas para 0.3+
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Carregar variaveis de ambiente
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("Erro: GROQ_API_KEY nao configurada.")
    sys.exit(1)

CACHE_FAISS = Path(__file__).parent / "cache_faiss.index"
CACHE_STORE = Path(__file__).parent / "cache_store.pkl"

def salvar_cache(base):
    base.save_local(str(CACHE_FAISS))
    with open(CACHE_STORE, "wb") as f:
        pickle.dump(base.docstore, f)

def carregar_cache():
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
            print("Cache invalido, reconstruindo...", file=sys.stderr)
            print(e, file=sys.stderr)
            return None
    return None

def limpar_texto_pdf(texto):
    try:
        texto = texto.encode("latin-1", "ignore").decode("utf-8", "ignore")
    except:
        pass
    texto = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", texto)
    texto = re.sub(r'\s+', ' ', texto)
    texto = re.sub(r'(\w)\s*\n\s*(\w)', r'\1 \2', texto)
    texto = re.sub(r'\n\s*\n\s*\n+', '\n\n', texto)
    texto = re.sub(r'Pagina\s+\d+\s+de\s+\d+', '', texto, flags=re.I)
    texto = re.sub(r'CPM\s+-\s+Conservatorio.*?\n', '', texto, flags=re.I)
    return texto.strip()

def carregar_pdfs_cpm():
    cache = carregar_cache()
    if cache:
        return cache

    pasta_dados = Path(__file__).parent / "dados"
    if not pasta_dados.exists():
        raise Exception(f"Pasta de dados nao encontrada: {pasta_dados}")

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

prompt_principal = ChatPromptTemplate.from_messages([
    ("system", """
Voce e o Assistente CPM. Responda com base apenas nos documentos fornecidos.
Responda de forma direta e objetiva, cite datas e documentos exatamente.
Nunca invente respostas.
"""),
    ("user", """
DOCUMENTOS DISPONIVEIS:
{contexto}

PERGUNTA DO CANDIDATO:
{input}
""")
])

def extrair_termos_chave(pergunta):
    stopwords = {
        'o','a','os','as','de','da','do','das','dos','um','uma','uns','umas',
        'para','com','em','no','na','nos','nas','qual','quais','quando','onde',
        'como','que','e','sao','sobre','pelo','pela'
    }
    return [p for p in pergunta.lower().split() if p not in stopwords and len(p) > 2]

def consultar_agente(base, pergunta, modelo):
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
        return "Nao encontrei informacoes relevantes nos editais."
    contexto_final = "\n---\n".join(contexto)
    chain = prompt_principal | modelo
    resposta = chain.invoke({"contexto": contexto_final, "input": pergunta})
    return resposta.content.strip()

def main():
    if len(sys.argv) < 2:
        print("Erro: Pergunta nao fornecida.")
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