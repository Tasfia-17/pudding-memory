from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import chromadb
import re
import os

load_dotenv()

app = FastAPI(title="Pudding Memory Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lock to chrome-extension://<id> in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── HydraDB (ChromaDB) client ─────────────────────────────────────────────────

_client = chromadb.PersistentClient(path="./hydradb")
_collection = _client.get_or_create_collection("cognitive_graph")

# Complex-concept keyword list (extend as needed)
COMPLEX_KEYWORDS = {
    "quantum", "entanglement", "algorithm", "entropy", "relativity",
    "photosynthesis", "mitosis", "derivative", "integral", "recursion",
    "blockchain", "neural", "eigenvalue", "topology", "metabolism",
}


def _extract_concepts(text: str) -> list[str]:
    """Return known complex keywords found in text, plus the first capitalised noun."""
    words = set(re.findall(r"\b[a-zA-Z]{4,}\b", text.lower()))
    found = list(words & COMPLEX_KEYWORDS)
    # Always include the first capitalised word as the main topic
    cap = re.search(r"\b([A-Z][a-z]{3,})\b", text)
    if cap and cap.group(1).lower() not in found:
        found.insert(0, cap.group(1))
    return found or [text.strip().split()[0]]


def save_struggle(user_id: str, concept: str, relation: str, difficulty_score: int):
    doc_id = f"{user_id}::{concept}"
    existing = _collection.get(ids=[doc_id])
    meta = {"user_id": user_id, "concept": concept, "relation": relation,
            "difficulty_score": difficulty_score}
    if existing["ids"]:
        prev = existing["metadatas"][0].get("difficulty_score", difficulty_score)
        meta["difficulty_score"] = int((prev + difficulty_score) / 2)
        _collection.update(ids=[doc_id], metadatas=[meta], documents=[concept])
    else:
        _collection.add(ids=[doc_id], metadatas=[meta], documents=[concept])


def get_user_graph(user_id: str) -> list[dict]:
    results = _collection.get(include=["metadatas", "documents"])
    nodes, edges = [], []
    for doc, meta in zip(results["documents"], results["metadatas"]):
        if meta.get("user_id") != user_id:
            continue
        score = meta.get("difficulty_score", 0)
        nodes.append({
            "id": doc,
            "label": doc,
            "difficulty_score": score,
            "relation": meta.get("relation", "STRUGGLED_WITH"),
            "color": "red" if score >= 60 else "green",
        })
        edges.append({"from": user_id, "to": doc, "label": meta.get("relation", "STRUGGLED_WITH")})
    return {"nodes": nodes, "edges": edges}


# ── Models ────────────────────────────────────────────────────────────────────

class LearnPayload(BaseModel):
    text: str
    difficulty: str = "high"          # "high" | "low"
    action: str = "simplify"          # "simplify" | "understood"
    user_id: str = "guest"


class CheckMemoryPayload(BaseModel):
    keywords: list[str]
    user_id: str = "guest"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/learn")
def learn(payload: LearnPayload):
    """Extract concepts from text and save the user's relation to them."""
    concepts = _extract_concepts(payload.text)
    score = 80 if payload.difficulty == "high" else 30
    relation = "STRUGGLED_WITH" if payload.action == "simplify" else "MASTERED"

    for concept in concepts:
        save_struggle(payload.user_id, concept, relation, score)

    return {"status": "saved", "concepts": concepts, "relation": relation}


@app.get("/api/graph")
def graph(user_id: str = "guest"):
    """Return the user's cognitive graph (nodes + edges)."""
    return get_user_graph(user_id)


@app.post("/api/check-memory")
def check_memory(payload: CheckMemoryPayload):
    """
    Given a list of keywords from the current page, return which ones
    the user has previously struggled with (score >= 60).
    """
    if not payload.keywords or _collection.count() == 0:
        return {"struggled_concepts": []}

    results = _collection.query(
        query_texts=payload.keywords,
        n_results=min(10, _collection.count()),
        include=["metadatas", "documents"],
    )

    struggled = []
    for docs, metas in zip(results["documents"], results["metadatas"]):
        for doc, meta in zip(docs, metas):
            if (meta.get("user_id") == payload.user_id
                    and meta.get("difficulty_score", 0) >= 60
                    and doc not in struggled):
                struggled.append(doc)

    return {"struggled_concepts": struggled}


# ── Legacy endpoints (keep backward compat with earlier integration) ──────────

class ConceptPayload(BaseModel):
    concept: str
    difficulty_score: int


@app.post("/memory/track")
def track_concept(payload: ConceptPayload):
    save_struggle("guest", payload.concept, "STRUGGLED_WITH", payload.difficulty_score)
    return {"status": "saved", "concept": payload.concept}


@app.get("/memory/status")
def memory_status(topics: list[str] = Query(default=[])):
    if not topics:
        raw = _collection.get(include=["metadatas", "documents"])
        pairs = zip(raw["documents"], raw["metadatas"])
    else:
        if _collection.count() == 0:
            return {"graph": [], "total": 0}
        raw = _collection.query(query_texts=topics,
                                n_results=min(10, _collection.count()),
                                include=["metadatas", "documents"])
        pairs = zip(
            [d for sub in raw["documents"] for d in sub],
            [m for sub in raw["metadatas"] for m in sub],
        )

    nodes = [{"concept": doc, "difficulty_score": m.get("difficulty_score", 0),
              "node_color": "red" if m.get("difficulty_score", 0) >= 60 else "green"}
             for doc, m in pairs]
    return {"graph": nodes, "total": len(nodes)}
