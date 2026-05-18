import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_chat_response_length():
    print("Testing chat response length and conciseness...")
    payload = {
        "message": "What are the common side effects of Amoxicillin?",
        "language": "English"
    }
    try:
        response = requests.post(f"{BASE_URL}/chat/", json=payload)
        if response.status_code == 200:
            reply = response.json().get("reply", "")
            lines = reply.strip().split('\n')
            print(f"Response:\n{reply}")
            print(f"Number of lines: {len(lines)}")
            if 3 <= len(lines) <= 5: # Allowing slight variation for disclaimer
                print("SUCCESS: Response length is concise.")
            else:
                print("WARNING: Response length might exceed or be under the target (3-4 lines).")
        else:
            print(f"FAILED: Status code {response.status_code}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_chat_response_length()
