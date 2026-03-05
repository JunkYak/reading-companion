from processing.document_processor import load_book, create_chunks
from retrieval.vector_store import load_embedding_model, load_or_create_vector_store
from retrieval.bm25_search import build_bm25_index
from retrieval.hybrid_search import hybrid_search
from llm.answer_generator import initialize_llm, build_context, generate_answer


# BOOK PATH
BOOK_PATH = "data/books/Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf"


# USER INPUT (for now hardcoded)
query = "I NEVER LAID A FINGER ON HIM.- who is him here and explain whats going on in the scene "
current_page = 149

print("query:", query)
print("current_page:", current_page)


# LOAD BOOK
documents = load_book(BOOK_PATH)


# CREATE CHUNKS
chunks = create_chunks(documents)


# BUILD BM25 INDEX
bm25 = build_bm25_index(chunks)


# LOAD EMBEDDING MODEL
embedding = load_embedding_model()


# LOAD OR CREATE VECTOR STORE
vector_store = load_or_create_vector_store(chunks, embedding)


# HYBRID SEARCH
context_chunks, vector_results, bm25_results, top_bm25_indices = hybrid_search(
    query,
    current_page,
    chunks,
    embedding,
    bm25
)


# DEBUG PRINTS
print("VECTOR RESULTS:")
for doc in vector_results:
    print(doc.metadata["page"])

print("BM25 RESULTS:")
for doc in bm25_results:
    print(doc.metadata["page"])


# BUILD CONTEXT
context = build_context(context_chunks)


# INITIALIZE LLM
llm = initialize_llm()


# GENERATE ANSWER
response = generate_answer(llm, query, context)


if not response:
    print("No relevant content found in the data")
    exit()


print("\n" + "="*60)
print("ANSWER")
print("="*60 + "\n")
print(response.content)