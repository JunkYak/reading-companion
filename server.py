from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os

from processing.document_processor import load_book, create_chunks
from retrieval.vector_store import load_embedding_model, load_or_create_vector_store
from retrieval.bm25_search import build_bm25_index
from retrieval.hybrid_search import hybrid_search
from llm.answer_generator import initialize_llm, build_context, generate_answer


BOOK_PATH = "data/books/Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf"
UPLOAD_DIR = "data/books"
PAGE_WINDOW = 5

os.makedirs(UPLOAD_DIR, exist_ok=True)


app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global backend state
app_state = {
    "documents": None,
    "chunks": None,
    "bm25": None,
    "embedding": None,
    "vector_store": None,
    "llm": None,
    "current_page": 1
}


# ---------- STARTUP INITIALIZATION ----------

@app.on_event("startup")
def startup_event():

    print("\nLoading default book...")
    documents = load_book(BOOK_PATH)
    app_state["documents"] = documents

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

    app_state["chunks"] = chunks
    app_state["bm25"] = bm25
    app_state["embedding"] = embedding
    app_state["vector_store"] = vector_store
    app_state["llm"] = llm

    print("Reading Companion Backend Ready\n")


# ---------- REQUEST MODELS ----------

class AskRequest(BaseModel):
    question: str
    selected_text: str | None = None
    page_number: int | None = None


class PageRequest(BaseModel):
    page: int


# ---------- ENDPOINTS ----------

@app.post("/set_page")
def set_page(req: PageRequest):

    print("Current page:", req.page)

    app_state["current_page"] = req.page
    return {"status": "ok"}


@app.post("/ask")
def ask_question(req: AskRequest):

    if app_state["chunks"] is None:
        raise HTTPException(status_code=500, detail="Backend not initialized yet.")

    query = req.question
    current_page = req.page_number or app_state["current_page"]

    chunks = app_state["chunks"]
    bm25 = app_state["bm25"]
    embedding = app_state["embedding"]
    llm = app_state["llm"]

    context_chunks, _, _, _ = hybrid_search(
        query,
        current_page,
        chunks,
        embedding,
        bm25
    )

    context = build_context(context_chunks)

    response = generate_answer(llm, query, context)

    if not response:
        return {"answer": "No relevant content found."}

    return {"answer": response.content}


# ---------- UPLOAD ENDPOINT ----------

@app.post("/upload")
async def upload_book(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    print(f"\nUploading book: {file.filename}")

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print("Processing uploaded book...")

    documents = load_book(file_path)
    app_state["documents"] = documents

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

    app_state["chunks"] = chunks
    app_state["bm25"] = bm25
    app_state["embedding"] = embedding
    app_state["vector_store"] = vector_store
    app_state["llm"] = llm
    app_state["current_page"] = 1

    print("Book uploaded and processed successfully\n")

    return {"status": "uploaded", "filename": file.filename}



#CLEANER HELPER
import re

def clean_text(text: str) -> str:

    # Fix line breaks inside paragraphs
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)

    # Normalize multiple spaces
    text = re.sub(r'\s+', ' ', text)

    # Restore paragraph breaks
    text = re.sub(r'\. ', '.\n\n', text)

    return text.strip()


#GET PAGES ENDPOINT
@app.get("/pages")
def get_pages():

    documents = app_state["documents"]

    if documents is None:
        return {"pages": []}

    pages = []

    for i, doc in enumerate(documents):
        pages.append({
            "pageNumber": i + 1,
            "content": doc.page_content
        })

    return {"pages": pages}