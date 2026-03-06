from processing.document_processor import load_book, create_chunks
from retrieval.vector_store import load_embedding_model, load_or_create_vector_store
from retrieval.bm25_search import build_bm25_index
from retrieval.hybrid_search import hybrid_search
from llm.answer_generator import initialize_llm, build_context, generate_answer


BOOK_PATH = "data/books/Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf"
page_window = 5


print("\nLoading book...")
documents = load_book(BOOK_PATH)

print("Creating chunks...")
chunks = create_chunks(documents)

print("Building BM25 index...")
bm25 = build_bm25_index(chunks)

print("Loading embedding model...")
embedding = load_embedding_model()

print("Loading vector store...")
vector_store = load_or_create_vector_store(chunks, embedding)

print("Initializing LLM...")
llm = initialize_llm()

print("\nReading Companion Ready!")
print("---------------------------------")


# default starting page
current_page = 1


while True:

    print(f"\nCurrent Page: {current_page}")
    start_page = max(1, current_page - page_window)
    end_page = current_page + page_window
    print(f"Context window: {start_page}–{end_page}")
     

    user_input = input(
        "\nAsk a question | type 'page <number>' | type 'exit'\n> "
    )

    if user_input.lower() == "exit":
        print("\nGoodbye 👋")
        break

    # change page
    if user_input.startswith("page "):
        try:
            current_page = int(user_input.split()[1])
            print(f"Page updated to {current_page}")
        except:
            print("Invalid page number")
        continue

    query = user_input

    context_chunks, vector_results, bm25_results, top_bm25_indices = hybrid_search(
        query,
        current_page,
        chunks,
        embedding,
        bm25
    )
    #Extarct and print page numbers the context was taken from 
    pages =set()
    for doc in context_chunks:
        page = doc.metadata.get("page")
        if page is not None:
            pages.add(page)
    
    pages = sorted(pages)

    print("\nRelevant pages:", ", ".join(map(str, pages)))


    context = build_context(context_chunks)

    response = generate_answer(llm, query, context)

    if not response:
        print("No relevant content found.")
        continue

    print("\n" + "=" * 60)
    print("ANSWER")
    print("=" * 60 + "\n")

    print(response.content)