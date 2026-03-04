from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
loader = PyPDFLoader("data/books/Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf")

documents = loader.load()
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size = 1000,
    chunk_overlap = 200

)
chunks  = text_splitter.split_documents(documents)

#Loading test 
print("Number of pages :",len(documents))
print("\nSample metadata:")
print(documents[0].metadata)

print("\nSample content:")
print(documents[0].page_content[:500])

#chunking test

print("\nTotal chunks:", len(chunks))

print("\nSample chunk metadata:")
print(chunks[0].metadata)

print("\nSample chunk content:")
print(chunks[0].page_content[:500])