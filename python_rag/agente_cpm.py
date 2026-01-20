"""
============================================================
 AGENTE CPM - ASSISTENTE PROCESSO SELETIVO 2026.1
============================================================
Autor: Pollyana Sousa
Data: Janeiro/2026
Descrição: RAG com Groq para consultas sobre editais CPM
Versão: 3.0 - Limpeza de texto aprimorada
"""
import os
import sys
import pickle
import re
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ============================================================
# CARREGAR VARIÁVEIS DE AMBIENTE
# ============================================================
env_path = Path(__file__).parent.parent / "backend" / ".env"
load_dotenv(dotenv_path=env_path)

# ============================================================
# 1. CACHE DO VETOR FAISS
# ============================================================
CACHE_FAISS = Path(__file__).parent / "cache_faiss.index"
CACHE_STORE = Path(__file__).parent / "cache_store.pkl"

def salvar_cache(base):
    """Salva FAISS + metadata no disco"""
    base.save_local(str(CACHE_FAISS))
    with open(CACHE_STORE, "wb") as f:
        pickle.dump(base.docstore, f)

def carregar_cache():
    """Carrega FAISS do disco, se existir"""
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
            print("✓ Cache FAISS carregado", file=sys.stderr)
            return base
        except:
            print("Cache inválido, reconstruindo...", file=sys.stderr)
            return None
    return None

# ============================================================
# 2. LIMPEZA PROFUNDA DE TEXTO
# ============================================================
def limpar_texto_pdf(texto):
    """
    Limpa e normaliza texto extraído de PDF
    PROBLEMA IDENTIFICADO: PDFs têm espaços múltiplos entre palavras
    """
    # 1. Normalizar encoding
    try:
        texto = texto.encode("latin-1", "ignore").decode("utf-8", "ignore")
    except:
        pass
    
    # 2. Remover hifenização de quebra de linha
    texto = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", texto)
    
    # 3. CRÍTICO: Substituir múltiplos espaços por espaço único
    # Isso corrige o problema "de   2025" -> "de 2025"
    texto = re.sub(r'\s+', ' ', texto)
    
    # 4. Juntar palavras separadas por quebra de linha
    texto = re.sub(r'(\w)\s*\n\s*(\w)', r'\1 \2', texto)
    
    # 5. Remover quebras de linha excessivas
    texto = re.sub(r'\n\s*\n\s*\n+', '\n\n', texto)
    
    # 6. Remover cabeçalhos e rodapés comuns
    texto = re.sub(r'Página\s+\d+\s+de\s+\d+', '', texto, flags=re.I)
    texto = re.sub(r'CPM\s+-\s+Conservatório.*?\n', '', texto, flags=re.I)
    
    # 7. Limpar espaços no início e fim
    texto = texto.strip()
    
    return texto

# ============================================================
# 3. CARREGAR PDFs COM LIMPEZA APRIMORADA
# ============================================================
def carregar_pdfs_cpm():
    """Carrega todos os PDFs e cria FAISS se não houver cache."""

    # Tenta usar cache primeiro
    cache = carregar_cache()
    if cache:
        return cache

    pasta_dados = Path(__file__).parent / "dados"
    lista_pdfs = [f.name for f in pasta_dados.glob("*.pdf")]

    documentos = []

    for nome_pdf in lista_pdfs:
        caminho_pdf = pasta_dados / nome_pdf

        if not caminho_pdf.exists():
            print(f"AVISO: PDF não encontrado: {caminho_pdf}", file=sys.stderr)
            continue

        try:
            loader = PyPDFLoader(str(caminho_pdf))
            docs_brutos = loader.load()

            # APLICAR LIMPEZA PROFUNDA
            for d in docs_brutos:
                d.page_content = limpar_texto_pdf(d.page_content)

            # Chunks otimizados
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=600,
                chunk_overlap=150,
                separators=["\n\n", "\n", ". ", " ", ""]
            )

            docs_divididos = text_splitter.split_documents(docs_brutos)
            documentos.extend(docs_divididos)

            print(f"✓ Carregado: {nome_pdf} ({len(docs_divididos)} trechos)",
                  file=sys.stderr)

        except Exception as e:
            print(f"ERRO ao carregar {nome_pdf}: {str(e)}", file=sys.stderr)

    if not documentos:
        raise Exception("Nenhum documento foi carregado.")

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
    )

    base = FAISS.from_documents(documentos, embeddings)

    # Salvar cache
    salvar_cache(base)

    return base


# ============================================================
# 4. PROMPT OTIMIZADO
# ============================================================
prompt_principal = ChatPromptTemplate.from_messages([
    ("system", """
Você é o Assistente CPM do Conservatório de Música de Pernambuco. Você ajuda candidatos com dúvidas sobre o Processo Seletivo 2026.1.

REGRAS FUNDAMENTAIS:
1. Use APENAS informações que estão no contexto fornecido
2. Responda de forma DIRETA e OBJETIVA
3. Cite datas, horários e documentos EXATAMENTE como aparecem
4. NUNCA diga "não encontrei" se a informação estiver no contexto

ENTENDENDO TERMOS DO PROCESSO SELETIVO:
• INSCRIÇÃO = período para se inscrever no processo seletivo
• MATRÍCULA = período para efetivar a vaga após aprovação
• APROVADOS = lista de quem passou no processo
• REMANEJAMENTO = preenchimento de vagas não ocupadas

DIFERENCIAÇÃO REGULAR vs TÉCNICO:
• Se pergunta mencionar "regular" ou "técnico" → responda sobre esse curso
• Se pergunta for genérica sobre matrícula/documentos/vagas/horários SEM especificar:
  → Pergunte: "Você quer saber sobre o curso REGULAR ou TÉCNICO?"

COMO RESPONDER:
• Se encontrar a informação no contexto: responda completamente
• Se a informação estiver PARCIAL: forneça o que houver
• Se realmente NÃO houver a informação: "Não encontrei essa informação específica nos editais."

FORMATAÇÃO:
• Texto direto, sem emojis
• Use parágrafos curtos
• SEMPRE termine com a fonte dos documentos consultados
• Se usar 1 fonte: "Fonte: Nome do Documento"
• Se usar 2+ fontes: "Fontes consultadas:" com cada fonte em uma linha iniciada por hífen (-)
"""),

    ("user", """
DOCUMENTOS DISPONÍVEIS:
{contexto}

PERGUNTA DO CANDIDATO:
{input}

Responda com base nos documentos acima. Se a informação estiver presente, forneça-a completamente.
""")
])

# ============================================================
# 5. BUSCA OTIMIZADA
# ============================================================
def extrair_termos_chave(pergunta):
    """Extrai termos importantes da pergunta"""
    stopwords = {
        'o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos',
        'um', 'uma', 'uns', 'umas', 'para', 'com', 'em', 'no', 
        'na', 'nos', 'nas', 'qual', 'quais', 'quando', 'onde',
        'como', 'que', 'é', 'são', 'sobre', 'pelo', 'pela'
    }
    
    palavras = pergunta.lower().split()
    return [p for p in palavras if p not in stopwords and len(p) > 2]

def consultar_agente(base, pergunta, modelo):
    """Busca otimizada com limpeza de texto"""
    
    # Busca semântica ampla
    docs_score = base.similarity_search_with_score(pergunta, k=50)
    
    # Busca por termos-chave
    termos = extrair_termos_chave(pergunta)
    if termos:
        query_termos = " ".join(termos)
        docs_termos = base.similarity_search_with_score(query_termos, k=30)
    else:
        docs_termos = []
    
    # Debug
    print(f"\n🔍 Buscando: '{pergunta}'", file=sys.stderr)
    print(f"📊 Termos extraídos: {termos}", file=sys.stderr)
    print(f"📄 Top 5 resultados:", file=sys.stderr)
    
    for i, (doc, score) in enumerate(docs_score[:5]):
        fonte = Path(doc.metadata.get('source', 'desconhecido')).name
        preview = doc.page_content[:100].replace('\n', ' ')
        print(f"  {i+1}. [{score:.3f}] {fonte[:40]}...", file=sys.stderr)
        print(f"     {preview}...", file=sys.stderr)
    
    # Combinar resultados
    contexto = []
    docs_vistos = set()
    
    # Ordenar por relevância (score menor = melhor)
    todos_docs = sorted(docs_score + docs_termos, key=lambda x: x[1])
    
    for doc, score in todos_docs:
        # Threshold MUITO permissivo - baseado nos testes (scores vão até 7.0+)
        if score > 8.0:
            continue
        
        # Evitar duplicatas
        doc_hash = hash(doc.page_content[:150])
        if doc_hash in docs_vistos:
            continue
        docs_vistos.add(doc_hash)
        
        fonte = Path(doc.metadata.get("source", "")).name
        contexto.append(f"[{fonte}]\n{doc.page_content}\n")
        
        if len(contexto) >= 20:
            break
    
    print(f"✓ Contexto final: {len(contexto)} documentos selecionados", file=sys.stderr)
    
    if not contexto:
        return "Não encontrei informações relevantes sobre essa pergunta nos editais. Poderia reformular ou ser mais específico?"
    
    contexto_final = "\n---\n".join(contexto)
    
    # Invocar modelo
    chain = prompt_principal | modelo
    
    resposta = chain.invoke({
        "contexto": contexto_final,
        "input": pergunta
    })
    
    return resposta.content.strip()


# ============================================================
# 6. MAIN
# ============================================================
def main():
    if len(sys.argv) < 2:
        print("Erro: Pergunta não fornecida.")
        sys.exit(1)

    pergunta = sys.argv[1]
    chave = os.getenv("GROQ_API_KEY")

    if not chave:
        print("Erro: GROQ_API_KEY não configurada.")
        sys.exit(1)

    try:
        print("🚀 Inicializando Agente CPM...", file=sys.stderr)
        
        modelo = ChatGroq(
            api_key=chave,
            model="llama-3.3-70b-versatile",
            temperature=0.1
        )

        print("📚 Carregando editais...", file=sys.stderr)
        base = carregar_pdfs_cpm()

        print(f"💬 Consultando...", file=sys.stderr)
        resposta = consultar_agente(base, pergunta, modelo)

        print("\n" + resposta)

    except Exception as e:
        print(f"ERRO: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()