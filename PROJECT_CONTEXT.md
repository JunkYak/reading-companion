# PROJECT CONTEXT

## 1. PROJECT OVERVIEW
The Reading Companion is an AI-powered Full-Stack web application designed to allow users to interactively read books (PDFs) while leveraging an LLM (Google's Gemini) as an intelligent tutor. It supports conversational memory, page-aware querying, explanation of selected text, and summarization, all grounded strictly in the context of the book being read.

## 2. SYSTEM ARCHITECTURE & REQUIREMENTS
The system operates as a decoupled client-server architecture:

### Requirements
- **Frontend**: Node.js ecosystem, Next.js (App Router), React, Tailwind CSS, Axios, Lucide React (icons), and Shadcn/UI (Radix UI primitives).
- **Backend**: Python 3.x ecosystem. Key dependencies (from `requirements.txt` / codebase):
  - `fastapi`, `uvicorn`, `python-multipart` (API Server)
  - `langchain`, `langchain-google-genai` (LLM Integration)
  - `sentence-transformers`, `faiss-cpu`, `rank_bm25` (Embeddings & Vector Store)
  - `pypdf` (PDF Parsing)
- **External APIs**: Google Gemini API (`gemini-2.5-flash`).

### Architecture
- **Frontend**: A React/Next.js interface providing a split-pane reader and chat UI.
- **Backend**: A FastAPI server that orchestrates document ingestion, chunking, retrieval, and LLM prompting.
- **Retrieval System**: A robust Hybrid Search approach (BM25 for exact keyword matching + FAISS/HuggingFace for semantic search) with a page-restricted context window.
- **State Management**: The backend is stateful per session, currently holding in-memory references to the active book's chunks, FAISS index, and conversation history.

---

## 3. FOLDER STRUCTURE & SCRIPT ANALYSIS

### Root Directory
- `server.py`: The main REST API server built with FastAPI. It handles CORS, maintains global backend state, and exposes endpoints:
  - `POST /upload`: Ingests a new PDF, chunks it, and builds the retrieval indices.
  - `POST /ask`: Performs hybrid search on the current page context and generates an LLM answer using conversational memory.
  - `POST /set_page`: Updates the active page number in the backend state.
  - `GET /pdf`: Serves the uploaded PDF file.
  - `GET /pages`: Debug endpoint returning parsed text per page.
- `main.py`: The legacy/development local CLI script. It runs the entire ingestion and QA pipeline directly in the terminal without starting an HTTP server.
- `requirements.txt`: Python dependencies.
- `.env`: Environment variables (e.g., `GOOGLE_API_KEY`).
- `Procfile`: Deployment configuration file (e.g., for Heroku/Railway).

### `processing/` (Document Ingestion)
- `document_processor.py`: Contains `load_book` (uses `PyPDFLoader` to extract text) and `create_chunks` (uses `RecursiveCharacterTextSplitter` to divide text into 1000-character overlapping chunks for retrieval).

### `retrieval/` (Search Engine)
- `vector_store.py`: Manages dense semantic retrieval. Loads `sentence-transformers/all-MiniLM-L6-v2` and creates a FAISS index from document chunks.
- `bm25_search.py`: Manages sparse keyword retrieval. Builds an in-memory `BM25Okapi` index.
- `hybrid_search.py`: The core retrieval logic. It filters candidate chunks down to a specified `PAGE_WINDOW` (e.g., +/- 5 pages), runs both Vector and BM25 searches, deduplicates the results, and then expands the context (pulling the original adjacent chunks) to ensure the LLM receives complete sentences.

### `llm/` (Generation & Memory)
- `answer_generator.py`: Interfaces with Google Generative AI. It exposes `initialize_llm`, builds the prompt context, and manages a floating 12-message `conversation_history` to allow the user to ask follow-up questions organically. It also includes specific instructions for Mylo (the assistant's persona) to reference dictionary definitions and contextual meaning.

### `data/`
- Directory storing uploaded books (e.g., `Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf`).

### `frontend/` (Next.js Application)
- `app/page.tsx`: The landing page where users upload a PDF book.
- `app/reader/page.tsx`: The main reader route containing the application workspace.
- `lib/api.ts`: An Axios client defining exactly how the frontend talks to the backend (`/upload`, `/ask`, `/set_page`, `/pages`, `/pdf`). It routes to a production URL or localhost.
- `components/`:
  - `ReaderLayout.tsx`: The main split-pane container using generic resizable panels.
  - `BookViewer.tsx`: The left pane. It renders the book content and monitors the user's scroll position. When a new page crosses the threshold, it fires `api.setPage()` to keep the backend's context window perfectly synced with what the user is currently looking at.
  - `ChatPanel.tsx`: The right pane. Handles the chat thread, optimistic UI updates, and invokes `api.askQuestion()`. Features auto-scroll and loading states.
  - `TextSelectionMenu.tsx`: A floating popover that appears when a user highlights text in the book. It provides quick actions (Explain, Ask AI, Summarize) which patch directly into the chat flow.
  - `UploadBook.tsx`: The drag-and-drop interface for sending the PDF file to `api.uploadBook()`.

---

## 4. HOW THE SYSTEM WORKS (THE PIPELINE)

1. **Upload**: User drops a PDF into `UploadBook.tsx` -> Sent to `server.py` (`/upload`).
2. **Processing**: Backend loads the PDF, splits it into chunks, and builds BM25 and FAISS indices in memory.
3. **Reading**: Frontend redirects to the reader. `BookViewer.tsx` displays pages and constantly tells the backend what page the user is viewing via `/set_page`.
4. **Interaction**: 
   - User highlights text -> `TextSelectionMenu.tsx` allows quick questions.
   - User types in `ChatPanel.tsx` -> Question is sent via `/ask`.
5. **Retrieval & Answer**: `server.py` takes the question and the exact page number. `hybrid_search.py` looks at +/- 5 pages around the user's view, finds the most relevant semantic and keyword matches, expands them into whole paragraphs, and passes them to `answer_generator.py`.
6. **Memory**: The LLM reads the context, past chat history, and the user's question, generates a highly grounded answer, and the response streams back to the frontend chat UI.
