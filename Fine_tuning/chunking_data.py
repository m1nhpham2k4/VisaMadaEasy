import os
import re
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import unicodedata

def clean_text(text):
    text = unicodedata.normalize("NFC", text)
    text = text.replace('\xa0', ' ').replace('\r', ' ')
    text = re.sub(r'\s+', ' ', text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return ' '.join(lines)

def chunk_qa_steps(text, max_chunk_length=500):
    # Chia theo các "Bước X -"
    parts = re.split(r'(Bước \d+ - )', text)
    chunks = []
    
    # Nếu có định dạng theo "Bước", giữ nguyên mỗi bước làm 1 đoạn
    if len(parts) > 1:
        for i in range(1, len(parts), 2):
            title = parts[i].strip()
            content = parts[i + 1].strip()
            full = f"{title}{content}"

            # Chia đoạn dài thành nhiều đoạn nhỏ hơn
            if len(full) > max_chunk_length:
                sub_chunks = re.findall(r'.{1,' + str(max_chunk_length) + r'}(?:(?<=\n)|(?=\s)|$)', full)
                chunks.extend([sc.strip() for sc in sub_chunks if sc.strip()])
            else:
                chunks.append(full.strip())
    else:
        # fallback nếu không theo "Bước", chia đều mỗi N ký tự
        raw_chunks = re.findall(r'.{1,' + str(max_chunk_length) + r'}(?:(?<=\n)|(?=\s)|$)', text)
        chunks = [c.strip() for c in raw_chunks if c.strip()]

    return chunks


def build_faiss_from_folder(folder_path: str, index_path: str = "faiss.index", chunks_path: str = "faiss_chunks.npy"):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    all_chunks = []
    txt_file_count = 0

    print(f"🔍 Đang duyệt thư mục: {folder_path}")
    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):
            txt_file_count += 1
            file_path = os.path.join(folder_path, filename)
            print(f"📄 Đang xử lý: {filename}")
            try:
                with open(file_path, "r", encoding="utf-8-sig") as f:
                    content = f.read()
            except UnicodeDecodeError:
                print(f"⚠️ Không đọc được file (encoding lỗi): {filename}")
                continue

            cleaned = clean_text(content)
            chunks = chunk_qa_steps(cleaned)
            all_chunks.extend(chunks)

            # Debug: in các đoạn có chứa "pháp"
            for chunk in chunks:
                if "pháp" in chunk.lower():
                    print("📌 Đoạn chứa 'Pháp':")
                    print(chunk[:300])
                    print("------")

    if not all_chunks:
        print("❌ Không tìm thấy đoạn nào để tạo FAISS.")
        return

    print(f"📁 Tổng số file .txt đã xử lý: {txt_file_count}")
    print(f"🔹 Tổng số đoạn chunk: {len(all_chunks)}")
    print("🔹 Đang tạo embedding...")
    embeddings = model.encode(all_chunks, convert_to_numpy=True)

    print("🔹 Đang tạo FAISS index...")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    print("💾 Đang lưu FAISS index và chunk text...")
    faiss.write_index(index, index_path)
    np.save(chunks_path, np.array(all_chunks))

    print(f"✅ Xong! Đã lưu FAISS tại '{index_path}', chunks tại '{chunks_path}'")

# Gọi hàm
if __name__ == "__main__":
    build_faiss_from_folder("./data")
