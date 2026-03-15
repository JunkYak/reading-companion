from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import shutil
import os
import re

from langchain_community.vectorstores import FAISS

from processing.document_processor import load_book, create_chunks
from retrieval.vector_store import load_embedding_model, load_or_create_vector_store
from retrieval.bm25_search import build_bm25_index
from retrieval.hybrid_search import hybrid_search

from llm.answer_generator import (
    initialize_llm,
    build_context,
    generate_answer,
    reset_conversation
)

# ---------- CONFIG ----------

BOOK_PATH = "data/books/demo_book.pdf"
UPLOAD_DIR = "data/books"
PAGE_WINDOW = 5

os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

# ---------- CORS ----------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- GLOBAL STATE ----------

app_state = {
    "current_book_path": None,
    "documents": None,
    "chunks": None,
    "bm25": None,
    "embedding": None,
    "vector_store": None,
    "llm": None,
    "current_page": 1
}

# ---------- STARTUP ----------

print("\nInitializing backend...")

print("Loading embedding model...")
embedding = load_embedding_model()

print("Initializing LLM...")
llm = initialize_llm()

reset_conversation()

app_state["embedding"] = embedding
app_state["llm"] = llm

print("Backend ready. Awaiting book selection.\n")

# ---------- REQUEST MODELS ----------

class AskRequest(BaseModel):
    question: str
    selected_text: str | None = None
    page_number: int | None = None


class PageRequest(BaseModel):
    page: int


# ---------- PAGE TRACKING ----------

@app.post("/set_page")
def set_page(req: PageRequest):

    app_state["current_page"] = req.page
    return {"status": "ok"}


# ---------- ASK QUESTION ----------

@app.post("/ask")
def ask_question(req: AskRequest):

    if app_state["chunks"] is None:
        raise HTTPException(status_code=500, detail="No book loaded.")

    query = req.question
    current_page = req.page_number or app_state["current_page"]

    chunks = app_state["chunks"]
    bm25 = app_state["bm25"]
    llm = app_state["llm"]
    vector_store = app_state["vector_store"]

    context_chunks, _, _, _ = hybrid_search(
        query,
        current_page,
        chunks,
        vector_store,
        bm25
    )

    context = build_context(context_chunks)

    response = generate_answer(llm, query, context)

    if not response:
        return {"answer": "No relevant content found."}

    return {"answer": response.content}


# ---------- UPLOAD BOOK ----------

@app.post("/upload")
async def upload_book(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    print(f"\nUploading book: {file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print("Processing uploaded book...")

    documents = load_book(file_path)
    chunks = create_chunks(documents)

    bm25 = build_bm25_index(chunks)

    embedding = app_state["embedding"]
    vector_store = load_or_create_vector_store(chunks, embedding)

    app_state["current_book_path"] = file_path
    app_state["documents"] = documents
    app_state["chunks"] = chunks
    app_state["bm25"] = bm25
    app_state["vector_store"] = vector_store
    app_state["current_page"] = 1

    reset_conversation()

    print("Book uploaded and processed successfully\n")

    return {"status": "uploaded", "filename": file.filename}


# ---------- LOAD DEMO BOOK ----------

@app.post("/load_demo")
def load_demo_book():

    print("\nLoading demo book...")

    documents = load_book(BOOK_PATH)
    chunks = create_chunks(documents)

    bm25 = build_bm25_index(chunks)

    embedding = app_state["embedding"]

    # Load precomputed FAISS index (no embeddings run)
    vector_store = FAISS.load_local(
        "vector_store/faiss_index",
        embedding,
        allow_dangerous_deserialization=True
    )

    app_state["current_book_path"] = BOOK_PATH
    app_state["documents"] = documents
    app_state["chunks"] = chunks
    app_state["bm25"] = bm25
    app_state["vector_store"] = vector_store
    app_state["current_page"] = 1

    reset_conversation()

    print("Demo book loaded\n")

    return {"status": "demo_loaded"}


# ---------- SERVE PDF ----------

@app.get("/pdf")
def get_pdf():

    path = app_state["current_book_path"]

    if path is None or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(path, media_type="application/pdf")


# ---------- CLEAN TEXT HELPER ----------

def clean_text(text: str) -> str:

    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\. ', '.\n\n', text)

    return text.strip()


# ---------- DEBUG: GET PAGES ----------

@app.get("/pages")
def get_pages():

    documents = app_state["documents"]

    if documents is None:
        return {"pages": []}

    pages = []

    for i, doc in enumerate(documents):
        pages.append({
            "pageNumber": i + 1,
            "content": clean_text(doc.page_content)
        })

    return {"pages": pages}