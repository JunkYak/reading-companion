from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

#LOADING
loader = PyPDFLoader("data/books/Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf")

documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size = 1000,
    chunk_overlap = 200

)
#LOADING TEST  
#print("Number of pages :",len(documents))
#print("\nSample metadata:")
#print(documents[0].metadata)
#print("\nSample content:")
#print(documents[0].page_content[:500])

#CHUNKING
chunks  = text_splitter.split_documents(documents)

#CHUNKING TEST
#print("\nTotal chunks:", len(chunks))
#print("\nSample chunk metadata:")
#print(chunks[0].metadata)
#print("\nSample chunk content:")
#print(chunks[0].page_content[:500])

#VECTOR STORES
embedding = HuggingFaceEmbeddings(
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
)

vector_store = FAISS.from_documents(chunks,embedding)

query = "what happens in the begining of the book good omens"
results = vector_store.similarity_search(query,k=3)

#VECTOR STORES TEST 

print("\nQuery:", query)

for i, doc in enumerate(results):
    print(f"\nResult {i+1}")
    print("Page:", doc.metadata["page"])
    print(doc.page_content[:400])

















