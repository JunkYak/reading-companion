from langchain_community.document_loaders import PyPDFLoader
loader = PyPDFLoader("data/books/Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf")

documents = loader.load()

print("Number of pages :",len(documents))
print("\nSample metadata:")
print(documents[0].metadata)

print("\nSample content:")
print(documents[0].page_content[:500])