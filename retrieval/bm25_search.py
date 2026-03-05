import re
from rank_bm25 import BM25Okapi


def tokenize(text):
    """
    Tokenizes text for BM25 keyword search.
    Removes punctuation and normalizes case.
    """
    return re.findall(r"\w+", text.lower())


def build_bm25_index(chunks):
    """
    Builds BM25 index from chunked documents.
    Also attaches chunk_id metadata for tracking.
    """

    tokenized_chunks = [
        tokenize(chunk.page_content)
        for chunk in chunks
    ]

    bm25 = BM25Okapi(tokenized_chunks)

    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = i

    return bm25


def bm25_search(query, chunks, bm25, candidate_indices, top_k=5):
    """
    Runs BM25 search restricted to candidate chunks.
    """

    search_query = query.split("-")[0]
    tokenized_query = tokenize(search_query)

    bm25_scores = bm25.get_scores(tokenized_query)

    filtered_scores = [
        (i, bm25_scores[i])
        for i in candidate_indices
    ]

    top_bm25_indices = sorted(
        filtered_scores,
        key=lambda x: x[1],
        reverse=True
    )[:top_k]

    bm25_results = [chunks[i] for i, _ in top_bm25_indices]

    return bm25_results, top_bm25_indices