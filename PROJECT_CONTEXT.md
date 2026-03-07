# PROJECT_CONTEXT

## 1. PROJECT OVERVIEW
The project is an AI-powered Reading Companion application designed to allow users to upload books (PDF files) and interactively read them while having the ability to ask questions about the text, request explanations, and generate summaries. It aims to create an augmented reading experience where an LLM (driven by Google's Gemini) acts as an always-available tutor or assistant, grounded strictly in the context of the book being read.

## 2. SYSTEM ARCHITECTURE
The system is built as a decoupled Full-Stack application:
- **Frontend**: A Next.js application (App Router) using React and Tailwind CSS for the user interface. It provides a split-pane reader and chat interface.
- **Backend (Current State)**: A set of Python modules orchestrating a local CLI application. It handles text extraction, chunking, and LLM querying.
- **Retrieval System**: A hybrid search system combining sparse (BM25) and dense (FAISS with HuggingFace embeddings) retrieval, specifically optimized for page-aware querying.
- **LLM Context**: Queries and context are fed to Google Generative AI (`gemini-2.5-flash`) via LangChain.
- **Vector Storage**: Local FAISS vector store used for persistent embedding storage.

## 3. BACKEND STRUCTURE
The Python backend contains core logic separated by responsibility:

- `processing/`: Contains `document_processor.py`, responsible for loading PDFs using `PyPDFLoader` and splitting the text into smaller, overlapping chunks using `RecursiveCharacterTextSplitter`.
- `retrieval/`: Contains the retrieval engine:
  - `bm25_search.py`: Handles keyword-based text retrieval using `BM25Okapi`.
  - `vector_store.py`: Manages the FAISS index using `HuggingFaceEmbeddings` (specifically `sentence-transformers/all-MiniLM-L6-v2`).
  - `hybrid_search.py`: Merges the results of Vector and BM25 searches, prioritizing chunks within a specific "page window" of the user's current reading position. It also expands context to include neighboring chunks.
- `llm/`: Contains `answer_generator.py`, which initializes the `ChatGoogleGenerativeAI` model, builds combined context strings, and prompts the LLM to answer user questions strictly based on the provided text.
- `app/`: Currently contains `ingest.py` and `chunking.py`. These files are empty (0 bytes) and appear to be placeholders for moving the local ingest logic into an API layer.
- `data/`: A directory storing the raw books/PDF files (e.g., `Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf`).
- `vector_store/`: Directory where the local FAISS index object (`faiss_index`) is saved.
- `main.py`: A local CLI script that serves as the current integration point. It builds the pipeline (loads book, chunks, builds BM25 and FAISS, initializes LLM) and drops the user into a terminal REPL to change pages or ask questions.

## 4. RETRIEVAL PIPELINE
The question answering system performs hybrid, page-aware retrieval through the following steps:
1. **PDF Loading & Text Extraction**: `PyPDFLoader` reads the book from the `data/` directory and extracts page content and metadata.
2. **Chunking**: `RecursiveCharacterTextSplitter` divides the text into chunks of 1000 characters with 200 characters overlap.
3. **Embedding Generation**: `HuggingFaceEmbeddings` maps chunk text into semantic vectors.
4. **FAISS Indexing**: Chunks are stored in a local FAISS vector store.
5. **BM25 Keyword Search**: An in-memory BM25 index is built for exact keyword matching.
6. **Page Filtering**: When the user queries, `get_candidate_chunks` filters chunks down to a specified `page_window` (e.g., +/- 5 pages) around the user's current reading page.
7. **Hybrid Retrieval**: Both `vector_search` (Semantic) and `bm25_search` (Keyword) are executed against the restricted candidate chunks. The results are interleaved and deduplicated in `merge_results`.
8. **Context Expansion**: For each retrieved chunk, `expand_context` retrieves its immediate neighbors (chunk ID - 1 and + 1) to restore continuous surrounding text.
9. **LLM Answer Generation**: The expanded chunks are concatenated and sent to `gemini-2.5-flash` with a strict prompt defining its role and constraining it to the provided context.

## 5. FRONTEND ARCHITECTURE
The frontend is built using Next.js (App Router), React, and Tailwind CSS.
- `app/`: Contains the main routing structure.
  - `page.tsx`: The landing page, rendering the file upload UI.
  - `reader/page.tsx`: The main reader interface route.
- `components/`: Contains the primary React modules.
- `components/ui/`: Contains reusable, primitive UI components (likely from `shadcn/ui` based on patterns like `Button`, `ResizablePanel`).
- `lib/`: Contains `api.ts`, which sets up the Axios frontend client.

Major components include:
- `ReaderLayout`: Uses `ResizablePanelGroup` to render a split-pane layout consisting of a `BookViewer` on the left (70% width) and a `ChatPanel` on the right (30% width).
- `BookViewer`: A scrolling container that renders pages. It listens to scroll events to track the active page number and triggers an API route to sync state. Currently populates 15 dummy pages using "Lorem ipsum".
- `ChatPanel`: Interactive chat interface. Displays a message history, manages auto-scrolling to the newest message, and simulates a loading state while querying the backend for an AI response.
- `TextSelectionMenu`: A floating utility menu (`MessageSquare`, `HelpCircle`, `AlignLeft`). It watches DOM text selection and pops up over the selected text, allowing users to quickly "Explain", "Ask AI", or "Summarize" snippets.
- `UploadBook`: Renders a drag-and-drop file upload zone. Currently contains mocked loading stages via `setTimeout` to simulate backend processing before transitioning to the reader.

## 6. READER SYSTEM
The `BookViewer` component drives the reading experience:
- **Continuous Scrolling**: Renders pages dynamically in a vertical list, separated by page markers (horizontal rules).
- **Page Markers**: Each block of text carries a `data-page` attribute and visual dividers.
- **Scroll Detection**: An `onScroll` handler manually loops over `[data-page]` DOM elements. It calculates `getBoundingClientRect()` to detect which page element is crossing the vertical middle of the screen.
- **Current Page Tracking**: As the active page crosses the threshold, the local `currentPage` state updates and `api.setPage()` is fired asynchronously to notify the backend of the user's active context window.

## 7. CHAT SYSTEM
The `ChatPanel` handles the conversational UI:
- **Message State**: An array containing objects shaped as `{ role: "user" | "ai", content: string }`.
- **API Calls**: When a user submits text, it is appended to the message array instantly, and `api.askQuestion()` is awaited. The backend response is then pushed to the messages array.
- **Auto-scroll Behavior**: A dummy `<div ref={bottomRef} />` sits at the end of the message list. A `useEffect` hook triggers `scrollIntoView({ behavior: "smooth" })` whenever the messages array changes.
- **User Input Handling**: A `textarea` listens to standard text input as well as the `Enter` key (preventing defaults unless shifted) to submit questions seamlessly.

## 8. FRONTEND ↔ BACKEND API
The frontend explicitly expects a backend API running at `http://localhost:8001`, handled via `axios` in `lib/api.ts`.

Endpoints assumed by the frontend:
- `POST /upload`: Sends the file as `multipart/form-data`. Called by `UploadBook`.
- `POST /ask`: Sends a JSON payload containing `{ question, selected_text, page_number }`. Used by `ChatPanel` and rapid actions in `TextSelectionMenu`.
- `POST /set_page`: Computes `{ page }` and updates the server about the user's scroll position. Triggered continuously by `BookViewer`.

*(Note: These endpoints currently DO NOT EXIST in the Python backend, which only runs as a CLI).*

## 9. CURRENT PROJECT STATE
**Implemented & Working:**
- The Python codebase successfully reads PDFs, indexes text into FAISS and BM25, and retrieves highly relevant chunks tied to page-window logic. LLM generation works efficiently in the CLI (`main.py`).
- The generic Next.js Frontend layout is robust. The resizable dual-pane reader, floating text selection popup, and chat UI are beautifully styled and function smoothly.
- The `lib/api.ts` defines the exact contract needed to bridge the frontend and backend.

**Unfinished / Placeholder:**
- The book rendering in the frontend `BookViewer` is currently populated by a hardcoded Array of 15 "Lorem ipsum" dummy pages. Real PDF streaming or rendering (e.g., using `react-pdf`) is missing.
- The `UploadBook` component mocks the upload sequence utilizing `setTimeout()`.
- The `app/ingest.py` and `app/chunking.py` backend files are completely empty.
- There is NO HTTP Server (e.g., FastAPI, Flask) serving the Python backend. The API routes outlined in `api.ts` haven't been implemented server-side.

## 10. FUTURE DEVELOPMENT AREAS
Based strictly on the current code state, the next logical implementation steps are:
1. **Develop a FastAPI/Flask Server**: Replace the `main.py` CLI script by building an HTTP API with three core endpoints (`/upload`, `/ask`, `/set_page`) matching the frontend's contract.
2. **Dynamic PDF Processing**: Move PDF ingestion into the `/upload` endpoint so the user's uploaded file dynamically triggers `load_book`, chunking, and FAISS indexing, replacing the hardcoded `BOOK_PATH`.
3. **Frontend PDF Rendering**: Update `BookViewer` to render actual content. This either requires sending page text from the backend or integrating a React PDF viewer library that reads from the uploaded blob.
4. **Implement Context Menus**: Connect the actions (`explain`, `ask`, `summarize`) from `TextSelectionMenu` to correctly populate the `ChatPanel` state and trigger targeted API calls.
5. **State Management**: Persist `vector_store` and session history per document rather than overlapping data locally.

## 11. COMPLETE DIRECTORY STRUCTURE

```text
project-root/
│
├── .env
├── .gitignore
├── requirements.txt
├── main.py
├── PROJECT_CONTEXT.md
│
├── app/
│   ├── chunking.py
│   └── ingest.py
│
├── data/
│   └── books/
│       └── Good omens_Terry Pratchett & Neil Gaiman_liber3.pdf
│
├── llm/
│   └── answer_generator.py
│
├── processing/
│   └── document_processor.py
│
├── retrieval/
│   ├── bm25_search.py
│   ├── hybrid_search.py
│   └── vector_store.py
│
├── vector_store/
│   └── faiss_index/
│       ├── index.faiss
│       └── index.pkl
│
└── frontend/
    ├── .gitignore
    ├── components.json
    ├── eslint.config.mjs
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.mjs
    ├── README.md
    ├── tsconfig.json
    │
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── favicon.ico
    │   └── reader/
    │       └── page.tsx
    │
    ├── components/
    │   ├── BookViewer.tsx
    │   ├── ChatPanel.tsx
    │   ├── ReaderLayout.tsx
    │   ├── TextSelectionMenu.tsx
    │   ├── UploadBook.tsx
    │   └── ui/
    │
    ├── lib/
    │   └── api.ts
    │
    └── public/
```
