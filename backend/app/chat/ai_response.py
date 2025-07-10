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

# def get_ai_response(user_message: str) -> str:
#     query_embedding = embedding_model.encode([user_message])
#     D, I = faiss_index.search(query_embedding, k=3)
#     top_chunks = [chunks[i] for i in I[0] if i < len(chunks)]

#     if not top_chunks:
#         return "Xin lỗi, tôi chưa tìm thấy thông tin phù hợp để trả lời câu hỏi này."

#     context = "\n---\n".join(top_chunks)
#     prompt = f"""
# Bạn là trợ lý tư vấn du học thân thiện. Dựa vào nội dung sau, hãy trả lời câu hỏi của người dùng bằng tiếng Việt:

# Thông tin:
# {context}

# Câu hỏi:
# {user_message}

# Trả lời:
# """.strip()

#     try:
#         return call_text_generator(prompt)
#     except Exception as e:
#         print(f"⚠️ Lỗi Gemini: {e}")
#         return top_chunks[0]

#change to this function
def get_ai_response_with_title(user_message: str) -> dict:
    """Get both AI response and suggested title in one API call using structured output."""
    query_embedding = embedding_model.encode([user_message])
    D, I = faiss_index.search(query_embedding, k=3)
    top_chunks = [chunks[i] for i in I[0] if i < len(chunks)]

    if not top_chunks:
        return {
            "reply": "Xin lỗi, tôi chưa tìm thấy thông tin phù hợp để trả lời câu hỏi này.",
            "title": "Câu hỏi không có thông tin"
        }

    context = "\n---\n".join(top_chunks)
    
    # First, generate the response
    response_prompt = f"""
Bạn là trợ lý tư vấn du học thân thiện. Dựa vào nội dung sau, hãy trả lời câu hỏi của người dùng bằng tiếng Việt:

Thông tin:
{context}

Câu hỏi:
{user_message}

Trả lời:
""".strip()

    try:
        response_text = call_text_generator(response_prompt)
        
        # Then, use chain-of-thought prompting to generate the title
        title_prompt = f"""
Đọc cuộc hội thoại sau đây. Đầu tiên, xác định chủ đề chính. Thứ hai, dựa trên chủ đề chính, tạo một tiêu đề ngắn gọn (dưới 5 từ).

Người dùng: "{user_message}"

Trợ lý: "{response_text[:500]}..."

Chủ đề chính: 
Tiêu đề: 
""".strip()
        
        title_response = call_text_generator(title_prompt)
        
        # Extract the title from the response
        title = ""
        if "Tiêu đề:" in title_response:
            title = title_response.split("Tiêu đề:")[1].strip()
        else:
            # Fallback if the format isn't followed
            title = title_response.strip().split("\n")[-1]
        
        # Truncate title if needed
        title = title[:50]
        
        return {
            "reply": response_text,
            "title": title
        }
    except Exception as e:
        print(f"⚠️ Lỗi Gemini: {e}")
        return {
            "reply": top_chunks[0] if top_chunks else "Xin lỗi, đã xảy ra lỗi.",
            "title": user_message[:50]
        }
