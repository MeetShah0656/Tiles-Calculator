import os
import json
import base64
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from project root .env.local
load_dotenv(dotenv_path="../.env.local")
load_dotenv(dotenv_path=".env")

app = FastAPI(
    title="TIVERA Natural Stone API",
    description="FastAPI Backend for TIVERA Measurement & Calculation System",
    version="1.0.0"
)

# Enable CORS for the Next.js frontend only. allow_origins=["*"] combined with
# allow_credentials=True is a known-bad combination (browsers/Starlette will
# reflect any Origin back with credentials allowed), so origins are restricted
# and credentials are disabled since this API doesn't use cookie-based auth.
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()] or [
    "http://localhost:3000",
    os.getenv("NEXT_PUBLIC_APP_URL", ""),
]
allowed_origins = [o for o in allowed_origins if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

class RoomMeasurement(BaseModel):
    name: str
    length: float
    width: float
    unit: str = "in"
    quantity: int = 1
    confidence: float = 100.0

class ScanResponse(BaseModel):
    rooms: List[RoomMeasurement]

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Tiles Calculator Python Backend"}

@app.post("/api/scan-measurements", response_model=ScanResponse)
async def scan_measurements(
    file: Optional[UploadFile] = File(None),
    image: Optional[str] = Form(None)
):
    """
    Analyzes paper measurement notes (handwritten or printed) using Gemini 2.0 Flash Vision API.
    Returns extracted room names, dimensions (in inches), quantities, and legibility confidence scores.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Process image bytes and mime type
    image_bytes = None
    mime_type = "image/jpeg"

    if file:
        image_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"
    elif image:
        data_str = image
        if ";base64," in data_str:
            header, base64_data = data_str.split(";base64,")
            mime_type = header.replace("data:", "")
            image_bytes = base64.b64decode(base64_data)
        else:
            image_bytes = base64.b64decode(data_str)

    if not image_bytes:
        raise HTTPException(status_code=400, detail="No image file or base64 data provided.")

    if not api_key:
        print("GEMINI_API_KEY not found in environment. Returning mock fallback scan result.")
        return ScanResponse(
            rooms=[
                RoomMeasurement(name="Kitchen Floor", length=120, width=96, unit="in", quantity=1, confidence=96.0),
                RoomMeasurement(name="Living Room Main", length=168, width=144, unit="in", quantity=1, confidence=98.0),
                RoomMeasurement(name="Master Bedroom", length=144, width=132, unit="in", quantity=1, confidence=88.0)
            ]
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = """You are an expert natural stone and marble measurement sheet OCR parser.
Analyze this handwritten or printed measurement sheet image.
Extract every line item measurement with absolute precision.

Rules:
1. Identify location / room / space name if present (e.g., "Living Room", "Passage", "Border", "Kitchen", "Pooja Room"). If missing, use "Item 1", "Item 2", etc.
2. Extract Length and Width in INCHES (e.g. 72.5, 24, 18.5). If feet are written (like 6'), convert to inches (6 * 12 = 72).
3. Extract Quantity (number of pieces). Default to 1 if not specified.
4. Output ONLY valid JSON matching this schema:
{
  "rooms": [
    {
      "name": "Location Name",
      "length": 72.0,
      "width": 48.0,
      "quantity": 1,
      "confidence": 95.0
    }
  ]
}"""

        model_name = 'gemini-3.6-flash'
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                ]
            )
        except Exception as e:
            print(f"gemini-3.6-flash failed ({e}), retrying with gemini-2.5-flash...")
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                ]
            )

        response_text = response.text or ""
        clean_text = response_text.strip()

        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_text = "\n".join(lines).strip()

        parsed = json.loads(clean_text)
        rooms_data = parsed.get("rooms", [])

        rooms = [
            RoomMeasurement(
                name=str(r.get("name", "Unnamed Space")),
                length=float(r.get("length", 0)),
                width=float(r.get("width", 0)),
                unit="in",
                quantity=int(r.get("quantity", 1)),
                confidence=float(r.get("confidence", 100.0))
            )
            for r in rooms_data
        ]

        return ScanResponse(rooms=rooms)

    except Exception as err:
        print(f"Gemini API scan error: {err}")
        raise HTTPException(status_code=500, detail=f"Gemini scan failed: {str(err)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
