import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()


def initialize_llm(model="gemini-2.5-flash", temperature=0.3):
    """
    Initializes the Gemini LLM.
    """

    llm = ChatGoogleGenerativeAI(
        model=model,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=temperature
    )

    return llm


def build_context(chunks):
    """
    Combines retrieved chunks into a single context string.
    """

    context = "\n\n".join([doc.page_content for doc in chunks])

    return context


def generate_answer(llm, query, context):
    """
    Sends the query and context to the LLM and returns the response.
    """

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

    return response