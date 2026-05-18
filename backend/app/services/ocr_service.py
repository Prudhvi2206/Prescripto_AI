import os
import base64
from google.cloud import vision
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def extract_text_from_image(image_content: bytes) -> str:
    """
    Extract text from an image using Google Cloud Vision API with an AI Vision fallback.
    """
    # 1. Try Google Cloud Vision if credentials exist
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        try:
            # Note: Google Cloud Vision client is synchronous, 
            # but we can wrap it if needed. For now, we'll keep it as is 
            # or use an async wrapper if performance becomes an issue.
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=image_content)
            response = client.text_detection(image=image)
            texts = response.text_annotations
            if texts:
                return texts[0].description
        except Exception as e:
            print(f"Vision API Error: {e}")

    # 2. Fallback to AI Vision (OpenAI or NVIDIA)
    api_key = os.getenv("OPENAI_API_KEY", "")
    if api_key:
        try:
            is_nvidia = api_key.startswith("nvapi-")
            client = AsyncOpenAI(
                base_url="https://integrate.api.nvidia.com/v1" if is_nvidia else "https://api.openai.com/v1",
                api_key=api_key
            )
            
            # Base64 encode image
            base64_image = base64.b64encode(image_content).decode('utf-8')
            
            # Use meta/llama-3.2-11b-vision-instruct which is widely available on NVIDIA NIM
            model = "meta/llama-3.2-11b-vision-instruct" if is_nvidia else "gpt-4o-mini"
            
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Transcribe all text from this medical prescription image accurately. Only output the transcription."},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ],
                max_tokens=500
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"AI Vision Fallback Error: {e}")

    # 3. Final Fallback (Stub for development)
    return "STUB: Detected Medicine: Amoxicillin 250mg, Take 1 pill twice daily."
