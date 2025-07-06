# ai_response.py

from .embedding_model import embedding_model, faiss_index, chunks
import google.generativeai as genai
import os

# Khởi tạo Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

def call_text_generator(prompt: str) -> str:
    response = model.generate_content(prompt)
    return response.text.strip()

def get_ai_response(user_message: str) -> str:
    query_embedding = embedding_model.encode([user_message])
    D, I = faiss_index.search(query_embedding, k=3)
    top_chunks = [chunks[i] for i in I[0] if i < len(chunks)]

    if not top_chunks:
        return "Xin lỗi, tôi chưa tìm thấy thông tin phù hợp để trả lời câu hỏi này."

    context = "\n---\n".join(top_chunks)
    prompt = f"""
Bạn là trợ lý tư vấn du học thân thiện. Dựa vào nội dung sau, hãy trả lời câu hỏi của người dùng bằng tiếng Việt:

Thông tin:
{context}

Câu hỏi:
{user_message}

Trả lời:
""".strip()

    try:
        return call_text_generator(prompt)
    except Exception as e:
        print(f"⚠️ Lỗi Gemini: {e}")
        return top_chunks[0]
