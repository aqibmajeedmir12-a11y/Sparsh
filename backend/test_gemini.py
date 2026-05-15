import os
import requests

GEMINI_API_KEY="AIzaSyC4176L-noJciiqWdALM7Fyw1Lg9KeVE1s"

prompt = "Hello"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"temperature": 0.7}
}
res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15)

print(res.status_code)
print(res.text)
