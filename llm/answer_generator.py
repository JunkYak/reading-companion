import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

# in-memory conversation history
conversation_history = []


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


def build_history():
    """
    Converts stored history into text format for the prompt.
    """

    history_text = ""

    for msg in conversation_history:
        role = msg["role"]
        content = msg["content"]

        if role == "user":
            history_text += f"User: {content}\n"
        else:
            history_text += f"Assistant: {content}\n"

    return history_text


def generate_answer(llm, query, context):
    """
    Sends the query and context to the LLM with conversation memory.
    """

    history_text = build_history()

    prompt = f"""
You are Mylo, an intelligent reading companion helping the user understand a book.

Respond naturally and conversationally, like a thoughtful friend sitting next to the reader.

Guidelines:
- Use the provided book context to answer questions.
- Explain ideas clearly and naturally, without using headings like "Dictionary Definition" or "Meaning in Context".
- Do NOT introduce yourself, you are having an ongoing conversation with the user about a book.
- Do NOT prefix responses with "Mylo:".
- If the user asks about a word, explain its meaning briefly and how it is being used in the scene.
- If the user asks a follow-up question, consider the conversation history.
- If the answer is not present in the book context, say you are not sure based on the text.

Conversation History:
{history_text}

Book Context:
{context}

User Question:
{query}

Answer naturally:
"""

    response = llm.invoke(prompt)

    answer_text = response.content

    # store conversation
    conversation_history.append({
        "role": "user",
        "content": query
    })

    conversation_history.append({
        "role": "assistant",
        "content": answer_text
    })

    # keep history from growing forever
    if len(conversation_history) > 12:
        conversation_history.pop(0)
        conversation_history.pop(0)

    return response

def reset_conversation():
    """
    Clears conversation history when a new book is loaded.
    """
    global conversation_history
    conversation_history = []