import os
import asyncio
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv
from .openfda_service import search_medicine

load_dotenv()

# Determine provider based on key prefix
api_key = os.getenv("OPENAI_API_KEY", "")
is_nvidia = api_key.startswith("nvapi-")

client = AsyncOpenAI(
    base_url="https://integrate.api.nvidia.com/v1" if is_nvidia else "https://api.openai.com/v1",
    api_key=api_key
)

async def interpret_prescription(image_content: bytes, language: str = "English") -> str:
    """
    Use Vision AI to extract and structure prescription data in one rapid pass.
    """
    import base64
    base64_image = base64.b64encode(image_content).decode('utf-8')

    prompt = f"""
    You are an API that extracts medical prescription data. 
    You MUST respond with ONLY a valid JSON object. Do not add any conversational text before or after the JSON.
    
    Extract the text and identify medicines, dosages, timings, and duration.
    
    CRITICAL RULES:
    1. Identify medicine names, exact dosages, timings, and duration.
    2. Try to extract doctor_name, patient_name, hospital_name, date, and diagnosis if available on the prescription.
    3. Output 'extracted_text' with the raw text you see.
    4. Keep the summary concise (max 3 lines) in {language}.
    5. The disclaimer MUST be: "Contact the doctor or hospital for prescription information."
    
    JSON Schema:
    {{
        "doctor_name": "string or null",
        "patient_name": "string or null",
        "hospital_name": "string or null",
        "date": "string or null",
        "diagnosis": "string or null",
        "medicines": [
            {{
                "name": "string",
                "dosage": "string",
                "timing": "string",
                "duration": "string",
                "instructions": "string or null"
            }}
        ],
        "summary": "string",
        "disclaimer": "string",
        "extracted_text": "string"
    }}
    """
    
    try:
        model = "meta/llama-3.2-11b-vision-instruct" if is_nvidia else "gpt-4o-mini"
        
        # ... (rest of vision/Nvidia processing code remains unchanged)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            temperature=0.1,
            max_tokens=1000,
            response_format={"type": "json_object"} if not is_nvidia else None
        )
        
        raw_result = response.choices[0].message.content.strip()
        print(f"DEBUG raw_result: {raw_result}")
        
        # Robustly extract JSON
        if "```json" in raw_result:
            raw_result = raw_result.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_result:
            raw_result = raw_result.split("```")[1].split("```")[0].strip()
        else:
            # If no backticks, try to find the first { and last }
            start = raw_result.find("{")
            end = raw_result.rfind("}")
            if start != -1 and end != -1:
                raw_result = raw_result[start:end+1]
            
        try:
            data = json.loads(raw_result)
        except json.JSONDecodeError:
            print("Failed to decode JSON, using fallback parsing...")
            chat_model = "meta/llama-3.3-70b-instruct" if is_nvidia else "gpt-4o-mini"
            fix_prompt = f"Convert the following text into the requested JSON format. Respond with ONLY valid JSON.\nText:\n{raw_result}\n\nSchema:\n{{\"doctor_name\": \"string or null\", \"patient_name\": \"string or null\", \"hospital_name\": \"string or null\", \"date\": \"string or null\", \"diagnosis\": \"string or null\", \"medicines\": [{{\"name\": \"string\", \"dosage\": \"string\", \"timing\": \"string\", \"duration\": \"string\", \"instructions\": \"string\"}}], \"summary\": \"string\", \"disclaimer\": \"string\", \"extracted_text\": \"string\"}}"
            fix_response = await client.chat.completions.create(
                model=chat_model,
                messages=[{"role": "user", "content": fix_prompt}],
                temperature=0.1,
                response_format={"type": "json_object"} if not is_nvidia else None
            )
            fixed_result = fix_response.choices[0].message.content.strip()
            print(f"DEBUG fixed_result: {fixed_result}")
            if "```json" in fixed_result:
                fixed_result = fixed_result.split("```json")[1].split("```")[0].strip()
            elif "```" in fixed_result:
                fixed_result = fixed_result.split("```")[1].split("```")[0].strip()
            else:
                start = fixed_result.find("{")
                end = fixed_result.rfind("}")
                if start != -1 and end != -1:
                    fixed_result = fixed_result[start:end+1]
            data = json.loads(fixed_result)

        
        # VERIFICATION STEP: Parallel cross-reference with OpenFDA
        medicines = data.get("medicines", [])
        
        # Define a helper for concurrent execution
        async def verify_med(med):
            fda_info = await search_medicine(med["name"])
            if fda_info.get("found"):
                med["verified"] = True
                med["generic_name"] = fda_info["generic_name"]
                med["official_purpose"] = fda_info["purpose"]
                med["warnings"] = fda_info["warnings"]
            else:
                med["verified"] = False
                med["generic_name"] = "Unknown"
            return med

        # Run all verifications in parallel
        verified_medicines = await asyncio.gather(*(verify_med(m) for m in medicines))
            
        data["medicines"] = verified_medicines
        # Enforce exact disclaimer
        data["disclaimer"] = "Contact the doctor or hospital for prescription information."
        return json.dumps(data)

    except Exception as e:
        print(f"AI Error: {e}")
        return json.dumps({
            "medicines": [], 
            "summary": "Error analyzing prescription accurately.", 
            "disclaimer": "Contact the doctor or hospital for prescription information."
        })

async def get_chat_response(message: str, language: str = "English", history: list[dict] = []) -> str:
    """
    Handle conversational queries from the user using OpenAI.
    """
    system_prompt = f"""
    You are Prescripto AI, a highly intelligent, empathetic, and professional medical assistant acting as a virtual doctor.
    Your goal is to provide medically helpful, realistic, confident, and supportive suggestions in a natural conversational manner.
    
    STRICT RESPONSE RULES:
    1. You MUST respond in: {language}.
    2. Maintain a professional, reassuring, and human-like clinical tone.
    3. Keep your answers extremely concise and short. Provide only the correct and essential information without long paragraphs or extra fluff.
    4. If the user asks about dangerous symptoms (e.g., chest pain, severe bleeding, sudden numbness), urge them to seek immediate emergency medical care.
    """
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Append history (limited to last 10 messages)
    for msg in history[-10:]:
        role = "assistant" if msg.get("sender") == "ai" else "user"
        messages.append({"role": role, "content": msg.get("text", "")})
        
    messages.append({"role": "user", "content": message})
    
    try:
        response = await client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct" if is_nvidia else "gpt-4o",
            messages=messages,
            temperature=0.5
        )
        return response.choices[0].message.content or "I'm sorry, I couldn't process that."
    except Exception as e:
        print(f"OpenAI Chat Error: {e}")
        return f"I apologize, but I am currently experiencing connection issues. Please consult a doctor for immediate medical concerns. (Error: {str(e)})"