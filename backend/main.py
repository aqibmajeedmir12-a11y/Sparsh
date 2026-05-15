import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client

load_dotenv(override=True)  # Force reload .env file even if vars are set

app = FastAPI(
    title="Sparsh AI Backend",
    description="AI Services for Sparsh Inclusive Education Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Supabase Client ──────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jxqazpfuzxkctfntxtzi.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_KEY else None

# ─── Request Models ───────────────────────────────────────────────────────────

class WhisperJob(BaseModel):
    lesson_id: str
    video_url: str

class ISLJob(BaseModel):
    lesson_id: str
    text: str

class GenerateJob(BaseModel):
    text: str
    lesson_id: Optional[str] = None

class ISLGrammarJob(BaseModel):
    text: str
    lang: Optional[str] = "en-IN"

class DeafBlindAIJob(BaseModel):
    topic: str
    context: Optional[str] = ""

class ProgressUpdate(BaseModel):
    student_id: str
    lesson_id: str
    completion_percent: int
    last_position_sec: Optional[int] = 0
    time_spent_seconds: Optional[int] = 0

class PredictSignJob(BaseModel):
    image: str # Base64 image data

try:
    from services.sign_detector import detector
except Exception as e:
    print(f"Error loading sign detector: {e}")
    detector = None

# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "Sparsh AI Backend",
        "version": "2.0.0",
        "supabase_connected": supabase is not None
    }

# ─── Lessons API ──────────────────────────────────────────────────────────────

@app.get("/api/lessons")
def get_lessons(grade: Optional[str] = None, subject: Optional[str] = None, board: Optional[str] = None):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    query = supabase.table("lessons").select("*")
    if grade:
        query = query.eq("grade", grade)
    if subject:
        query = query.eq("subject", subject)
    if board:
        query = query.eq("board", board)
    result = query.order("grade").execute()
    return {"lessons": result.data, "count": len(result.data)}

@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: str):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    result = supabase.table("lessons").select("*").eq("id", lesson_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    # Increment view count
    supabase.table("lessons").update({"view_count": (result.data.get("view_count") or 0) + 1}).eq("id", lesson_id).execute()
    return result.data

# ─── Whisper Transcription ────────────────────────────────────────────────────

@app.post("/api/whisper")
def process_whisper(job: WhisperJob):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    # Log job to ai_jobs table
    supabase.table("ai_jobs").insert({
        "lesson_id": job.lesson_id,
        "job_type": "whisper_transcription",
        "status": "queued",
        "input_data": {"video_url": job.video_url}
    }).execute()
    # Update lesson status to processing
    supabase.table("lessons").update({"processing_status": "processing"}).eq("id", job.lesson_id).execute()
    return {"status": "queued", "lesson_id": job.lesson_id, "message": "Transcription job queued."}

# ─── ISL Generation ───────────────────────────────────────────────────────────

@app.post("/api/isl")
def generate_isl(job: ISLJob):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    supabase.table("ai_jobs").insert({
        "lesson_id": job.lesson_id,
        "job_type": "isl_generation",
        "status": "queued",
        "input_data": {"text": job.text[:500]}
    }).execute()
    return {"status": "queued", "lesson_id": job.lesson_id, "message": "ISL avatar generation queued."}

@app.post("/api/isl-grammar")
def simplify_isl_grammar(job: ISLGrammarJob):
    """Convert spoken English/Indian languages to simplified ISL structure (e.g. 'how are you' -> 'how you')."""
    text = (job.text or "").strip().lower()
    lang = job.lang or "en-IN"
    
    if not text:
        return {"isl_text": []}
        
    # Basic Multi-Language Translation Dictionary (Mock for Demo)
    # Translates common words from Hindi/Tamil/Bengali/Telugu/Marathi to our ISL English tokens
    translation_dict = {
        # Hindi
        "नमस्ते": "hello", "धन्यवाद": "thank", "कृपया": "please", "हाँ": "yes", "नहीं": "no",
        "आप": "you", "किताब": "book", "शिक्षक": "teacher", "विद्यार्थी": "student", "कक्षा": "class",
        "सवाल": "question", "जवाब": "answer", "स्वागत": "welcome",
        # English equivalents for when STT uses english letters for hindi
        "namaste": "hello", "dhanyavad": "thank", "kripya": "please", "haan": "yes", "nahi": "no",
        "aap": "you", "kitab": "book", "shikshak": "teacher", "vidyarthi": "student", "kaksha": "class",
        # Tamil
        "வணக்கம்": "hello", "நன்றி": "thank", "தயவுசெய்து": "please", "ஆம்": "yes", "இல்லை": "no",
        # Bengali
        "নমস্কার": "hello", "ধন্যবাদ": "thank", "দয়া করে": "please", "হ্যাঁ": "yes", "না": "no",
        # Telugu
        "నమస్కారం": "hello", "ధన్యవాదాలు": "thank", "దయచేసి": "please", "అవును": "yes", "కాదు": "no",
        # Marathi
        "नमस्कार": "hello", "धन्यवाद": "thank", "कृपया": "please", "होय": "yes", "नाही": "no",
    }
    
    # Fast ISL simplification heuristic for English
    stop_words = {'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                  'have', 'has', 'had', 'do', 'does', 'did', 'a', 'an', 'the',
                  'will', 'shall', 'to'}
    
    words = ''.join(c for c in text if c.isalnum() or c.isspace() or ord(c) > 127).split()
    
    simplified = []
    for w in words:
        if w in stop_words:
            continue
        # Translate to english token if it exists in our multi-lingual dict
        mapped = translation_dict.get(w, w)
        simplified.append(mapped)
    
    return {"isl_text": simplified}

@app.post("/api/predict-sign")
def predict_sign(job: PredictSignJob):
    if not detector or not detector.ready:
        raise HTTPException(status_code=503, detail="Sign detector not loaded")
    
    result = detector.predict_base64(job.image)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

# ─── AI Content Generation ────────────────────────────────────────────────────

@app.post("/api/generate")
def generate_content(job: GenerateJob):
    """Generate AI summary, key points and quiz from lesson text."""
    text = (job.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    if GEMINI_API_KEY:
        try:
            import urllib.request
            import json
            prompt = f"Analyze this lesson text: '{text[:2000]}'.\nProvide a JSON response with strictly these 3 keys: 'summary' (1 sentence), 'key_points' (array of 3 short bullet points), 'quiz' (array of 2 objects, each with 'question' and 'answer'). Output ONLY valid JSON."
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3}
            }
            
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
            
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    
                    # Extract JSON from markdown block if present
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0].strip()
                        
                    parsed = json.loads(content)
                    result = {
                        "summary": parsed.get("summary", text[:200]),
                        "key_points": parsed.get("key_points", [text[:100]]),
                        "quiz": parsed.get("quiz", [{"question": "What did you learn?", "answer": text[:50]}])
                    }
                else:
                    raise Exception("Gemini API Error")
        except Exception as e:
            print(f"Gemini AI failed for /api/generate, falling back. Error: {e}")
            # Fallback to extraction
            sentences = [s.strip() for s in text.replace('\n', ' ').split('.') if len(s.strip()) > 20]
            result = {
                "summary": '. '.join(sentences[:2]) + '.' if sentences else text[:200],
                "key_points": [s + '.' for s in sentences[2:5]] if len(sentences) > 2 else ["Review the lesson."],
                "quiz": [{"question": "What is the main topic?", "answer": sentences[0][:80] if sentences else "See text"}]
            }
    else:
        # Fallback to simple extraction
        sentences = [s.strip() for s in text.replace('\n', ' ').split('.') if len(s.strip()) > 20]
        result = {
            "summary": '. '.join(sentences[:2]) + '.' if sentences else text[:200],
            "key_points": [s + '.' for s in sentences[2:5]] if len(sentences) > 2 else ["Review the lesson."],
            "quiz": [{"question": "What is the main topic?", "answer": sentences[0][:80] if sentences else "See text"}]
        }

    # If lesson_id provided, update the lesson's accessible_summary in Supabase
    if job.lesson_id and supabase:
        supabase.table("lessons").update({
            "accessible_summary": result["summary"],
            "processing_status": "completed"
        }).eq("id", job.lesson_id).execute()

    return result

# ─── DeafBlind AI Endpoints ───────────────────────────────────────────────────

@app.post("/api/deafblind/caregiver")
def ai_caregiver_instructions(job: DeafBlindAIJob):
    """Generates real-time Tadoma (physical guidance) instructions for caregivers based on lesson topic."""
    topic = job.topic.lower()
    # Simulated AI logic (In production, replace with Claude/OpenAI API call)
    if "water" in topic or "liquid" in topic:
        instruction = f"The phone is now vibrating to teach the concept of '{job.topic.upper()}'. Take the student's hand and dip it in a bowl of water while the vibration plays so they associate the physical sensation with the haptic rhythm."
        vibrations = [100, 50, 100, 50, 500]
    elif "fire" in topic or "heat" in topic or "sun" in topic:
        instruction = f"The phone is vibrating to teach '{job.topic.upper()}'. Guide the student's hands near a warm cup or a sunny window so they can feel the temperature change alongside the vibration."
        vibrations = [500, 100, 500, 100, 500]
    elif "gravity" in topic or "fall" in topic:
        instruction = f"The phone is vibrating to teach '{job.topic.upper()}'. Have the student hold a soft object (like a ball) and drop it into their other hand while the vibration accelerates."
        vibrations = [50, 50, 40, 40, 30, 30, 20, 20, 10, 10, 200]
    else:
        instruction = f"The phone is vibrating to teach '{job.topic.upper()}'. Guide the student's hands to a relevant physical object or use hand-under-hand guidance to trace the shape of the concept."
        vibrations = [200, 100, 200, 100, 200]
        
    return {"instruction": instruction, "vibrations": vibrations, "topic": job.topic}

@app.post("/api/deafblind/lorm")
def ai_lorm_translate(job: DeafBlindAIJob):
    """Translates text into Lorm alphabet physical coordinates (1-9 grid)."""
    text = job.topic.upper()
    sequence = []
    # Mock mapping for demo (A: diagonal, B: vertical, C: horizontal)
    for char in text:
        if char == 'A': sequence.extend([7, 5, 3])
        elif char == 'B': sequence.extend([1, 4, 7])
        elif char == 'C': sequence.extend([1, 2, 3])
        elif char == 'D': sequence.extend([3, 6, 9])
        elif char == 'E': sequence.extend([7, 8, 9])
        elif char == ' ': sequence.extend([-1]) # long pause for space
        else: sequence.extend([5]) # fallback center tap
        sequence.append(0) # short pause between letters
    
    return {"text": text, "sequence": sequence}

# ─── Progress Tracking ────────────────────────────────────────────────────────

@app.post("/api/progress")
def update_progress(update: ProgressUpdate):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    # Upsert student progress
    supabase.table("student_progress").upsert({
        "student_id": update.student_id,
        "lesson_id": update.lesson_id,
        "completion_percent": update.completion_percent,
        "last_position_sec": update.last_position_sec,
        "time_spent_seconds": update.time_spent_seconds,
        "completed_at": "now()" if update.completion_percent >= 100 else None
    }, on_conflict="student_id,lesson_id").execute()
    # Update profile total lessons done if 100%
    if update.completion_percent >= 100:
        profile = supabase.table("profiles").select("total_lessons_done").eq("id", update.student_id).single().execute()
        if profile.data:
            supabase.table("profiles").update({
                "total_lessons_done": (profile.data.get("total_lessons_done") or 0) + 1,
                "last_active": "now()"
            }).eq("id", update.student_id).execute()
    return {"status": "updated", "completion_percent": update.completion_percent}

@app.get("/api/progress/{student_id}")
def get_progress(student_id: str):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    result = supabase.table("student_progress").select("*, lessons(title, subject, grade)").eq("student_id", student_id).execute()
    return {"progress": result.data}

# ─── Live Sessions ────────────────────────────────────────────────────────────

@app.get("/api/live-sessions")
def get_live_sessions(status: Optional[str] = "live"):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    result = supabase.table("live_sessions").select("*").eq("status", status).execute()
    return {"sessions": result.data}

@app.post("/api/live-sessions")
def create_live_session(session: dict):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    result = supabase.table("live_sessions").insert(session).execute()
    return {"session": result.data}

# ─── AI Tutor Chat ──────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    language: str = "en-US"

@app.post("/api/ai-tutor/chat")
def ai_tutor_chat(job: ChatMessage):
    lang = job.language or "en-US"
    user_msg = job.message
    
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    if not GEMINI_API_KEY:
        print("No Gemini API key, falling back to mock.")
        fallback_replies = [
            {"reply": "I understand! Let's explore that.", "isl": "understand let explore"},
            {"reply": "That is an excellent point.", "isl": "good question"}
        ]
        import random
        choice = random.choice(fallback_replies)
        return {"reply": choice["reply"], "language": lang, "isl_translation": choice["isl"]}
        
    try:
        import urllib.request
        import json
        
        prompt = f"You are a helpful, brief AI tutor for a deaf student. The student says: '{user_msg}'. Respond with exactly two lines.\nLine 1: Your short, encouraging reply translated into {lang}.\nLine 2: The exact English Sign Language (ISL) gloss of your reply (only core concepts, drop words like is/am/the/a/are)."
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7}
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    lines = [line.strip() for line in content.strip().split('\n') if line.strip()]
                    reply = lines[0] if len(lines) > 0 else "I understand."
                    isl = lines[1] if len(lines) > 1 else "understand"
                    
                    # Clean up ISL line
                    isl = isl.replace("Line 2:", "").replace("ISL:", "").replace("ISL gloss:", "").replace("*", "").strip().lower()
                    reply = reply.replace("Line 1:", "").replace("*", "").strip()
                    
                    return {"reply": reply, "language": lang, "isl_translation": isl}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            print(f"Gemini API HTTP Error: {e.code} - {err_body}")
            
    except Exception as e:
        print(f"Gemini AI failed, falling back to mock. Error: {e}")
        
    # Fallback to mock responses if AI is offline
    fallback_replies = [
        {"reply": "I understand! Let's explore that.", "isl": "understand let explore"},
        {"reply": "That is an excellent point.", "isl": "good question"}
    ]
    import random
    choice = random.choice(fallback_replies)
    return {"reply": choice["reply"], "language": lang, "isl_translation": choice["isl"]}

# ─── Analytics ────────────────────────────────────────────────────────────────

@app.get("/api/analytics/summary")
def analytics_summary():
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    students = supabase.table("profiles").select("id", count="exact").eq("role", "student").execute()
    teachers = supabase.table("profiles").select("id", count="exact").eq("role", "teacher").execute()
    lessons  = supabase.table("lessons").select("id", count="exact").execute()
    sessions = supabase.table("live_sessions").select("id", count="exact").execute()
    return {
        "total_students": students.count,
        "total_teachers": teachers.count,
        "total_lessons": lessons.count,
        "total_live_sessions": sessions.count,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
