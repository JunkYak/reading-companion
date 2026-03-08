import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


INDEX_PATH = "vector_store/faiss_index"


def load_embedding_model():
    """
    Loads the embedding model used for semantic search.
    """
    embedding = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-MiniLM-L3-v2"
    )
    return embedding


def load_or_create_vector_store(chunks, embedding):
    """
    Loads an existing FAISS vector store if present.
    Otherwise creates a new one and saves it locally.
    """

    if os.path.exists(INDEX_PATH):
        print("Loading existing vector store...")
        vector_store = FAISS.load_local(
            INDEX_PATH,
            embedding,
            allow_dangerous_deserialization=True
        )

    else:
        print("Creating new vector store...")
        vector_store = FAISS.from_documents(chunks, embedding)
        vector_store.save_local(INDEX_PATH)

    return vector_store


def build_local_vector_store(candidate_chunks, embedding):
    """
    Builds a temporary vector store for page-window retrieval.
    """
    return FAISS.from_documents(candidate_chunks, embedding)