from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_book(pdf_path):
    """
    Loads the PDF book and returns document pages.
    """

    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    return documents


def create_chunks(documents, chunk_size=1000, chunk_overlap=200):
    """
    Splits documents into overlapping chunks for retrieval.
    """

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )

    chunks = text_splitter.split_documents(documents)

    return chunks