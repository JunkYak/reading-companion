from retrieval.vector_store import build_local_vector_store
from retrieval.bm25_search import bm25_search


def get_candidate_chunks(chunks, current_page, page_window=5):
    """
    Select chunks within a page window around the user's current page.
    """

    candidate_chunks = [
        chunk for chunk in chunks
        if abs(chunk.metadata.get("page", 0) - current_page) <= page_window
    ]

    candidate_indices = [chunk.metadata["chunk_id"] for chunk in candidate_chunks]

    return candidate_chunks, candidate_indices


def vector_search(query, candidate_chunks, embedding, k=8):
    """
    Runs semantic vector search on candidate chunks.
    """

    local_vector_store = build_local_vector_store(candidate_chunks, embedding)

    vector_results = local_vector_store.similarity_search(query, k=k)

    return vector_results


def merge_results(vector_results, bm25_results, max_results=5):
    """
    Interleaves vector and BM25 results and removes duplicates.
    """

    combined_results = []

    for v, b in zip(vector_results, bm25_results):
        combined_results.append(v)
        combined_results.append(b)

    seen = set()
    unique_results = []

    for doc in combined_results:
        cid = doc.metadata["chunk_id"]

        if cid not in seen:
            seen.add(cid)
            unique_results.append(doc)

    return unique_results[:max_results]


def expand_context(results, chunks):
    """
    Expands retrieved chunks by adding neighboring chunks
    to preserve surrounding context.
    """

    expanded_chunks = []

    for doc in results:

        idx = doc.metadata["chunk_id"]

        neighbor_ids = [idx - 1, idx, idx + 1]

        for nid in neighbor_ids:
            if 0 <= nid < len(chunks):
                expanded_chunks.append(chunks[nid])

    seen = set()
    unique_chunks = []

    for doc in expanded_chunks:
        cid = doc.metadata["chunk_id"]

        if cid not in seen:
            seen.add(cid)
            unique_chunks.append(doc)

    return unique_chunks


def hybrid_search(query, current_page, chunks, embedding, bm25):
    """
    Full hybrid retrieval pipeline.
    """

    # Page filtering
    candidate_chunks, candidate_indices = get_candidate_chunks(
        chunks,
        current_page
    )

    # Vector retrieval
    vector_results = vector_search(
        query,
        candidate_chunks,
        embedding
    )

    # BM25 retrieval
    bm25_results, top_bm25_indices = bm25_search(
        query,
        chunks,
        bm25,
        candidate_indices
    )

    # Hybrid merge
    results = merge_results(
        vector_results,
        bm25_results
    )

    # Context expansion
    context_chunks = expand_context(
        results,
        chunks
    )

    return context_chunks, vector_results, bm25_results, top_bm25_indices