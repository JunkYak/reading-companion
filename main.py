from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os
INDEX_PATH = "vector_store/faiss_index"

load_dotenv()

#LOADING
loader = PyPDFLoader("data/books/Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf")

documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size = 1000,
    chunk_overlap = 200,
    separators=["\n\n", "\n", " ", ""]

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


query = "what does 'pinging' mean "
current_page = 193

page_window = 5

candidate_chunks = [
    chunk for chunk in chunks
    if abs(chunk.metadata.get("page",0) - current_page) <= page_window
]

local_vector_store = FAISS.from_documents(candidate_chunks, embedding)



results = local_vector_store.similarity_search(query,k=8)



for doc in results:
    print("\nPAGE:", doc.metadata["page"])
    print(doc.page_content[:200])


#VECTOR STORES TEST 

#print("\nQuery:", query)

#for i, doc in enumerate(results):
#    print(f"\nResult {i+1}")   
#    print("Page:", doc.metadata.get("page"))
#    print(doc.page_content[:400])

#CHAT MODEL

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.3
)

context = "\n\n".join([doc.page_content for doc in results])

prompt = f"""
You are a helpful reading companion.

Use the provided context from the book to answer the question.
You may explain terms or references in simple language if needed,
but your explanation must be grounded in the context.

If the answer is not present in the context, say you don't know.

Context:
{context}

Question:
{query}

Answer:
"""

response = llm.invoke(prompt)

if not response:
    print("No relevant content found in the data")
    exit()

print("\n" + "="*60)
print("ANSWER")
print("="*60 + "\n")
print(response.content)
















