import os
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Đi từ chat/ → app/ → backend/ → VisaMadaEasy/
BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Fine_tuning"))

INDEX_PATH = os.path.join(BASE_PATH, "faiss.index")
CHUNKS_PATH = os.path.join(BASE_PATH, "faiss_chunks.npy")

# Load model và dữ liệu
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
faiss_index = faiss.read_index(INDEX_PATH)
chunks = np.load(CHUNKS_PATH, allow_pickle=True)
