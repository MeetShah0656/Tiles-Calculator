import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { deleteFromCloud } from '@/lib/storage/storageManager';

const RequestSchema = z.object({
  fileId: z.string().optional(),
  provider: z.enum(['supabase', 'cloudinary', 'local']).optional(),
  image: z.string().optional(),
  mimeType: z.string().optional()
});

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  let fileIdToDelete: string | null = null;
  let providerToDelete: 'supabase' | 'cloudinary' | 'local' | null = null;

  try {
    let imageBuffer: Buffer | null = null;
    let detectedMimeType = 'image/jpeg';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const fileEntry = formData.get('file');
      const imageStr = formData.get('image') as string | null;

      if (fileEntry && typeof fileEntry === 'object' && 'arrayBuffer' in fileEntry) {
        const arrayBuffer = await (fileEntry as Blob).arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        detectedMimeType = (fileEntry as Blob).type || 'image/jpeg';
      } else if (imageStr) {
        let base64Data = imageStr;
        if (imageStr.includes(';base64,')) {
          const parts = imageStr.split(';base64,');
          base64Data = parts[1];
          const mimeParts = parts[0].split(':');
          if (mimeParts.length > 1) detectedMimeType = mimeParts[1];
        }
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      const parsed = RequestSchema.safeParse(body);
      if (parsed.success) {
        const { fileId, provider, image, mimeType } = parsed.data;
        if (mimeType) detectedMimeType = mimeType;

        if (fileId) {
          fileIdToDelete = fileId;
          providerToDelete = provider || null;
          tempFilePath = path.join(os.tmpdir(), fileId);
        }

        if (!imageBuffer && tempFilePath && fs.existsSync(tempFilePath)) {
          imageBuffer = fs.readFileSync(tempFilePath);
        }

        if (!imageBuffer && image) {
          let base64Data = image;
          if (image.includes(';base64,')) {
            const parts = image.split(';base64,');
            base64Data = parts[1];
            const mimeParts = parts[0].split(':');
            if (mimeParts.length > 1) detectedMimeType = mimeParts[1];
          }
          imageBuffer = Buffer.from(base64Data, 'base64');
        }
      }
    }

    if (!imageBuffer) {
      return NextResponse.json(
        { error: "No image file provided for scanning." },
        { status: 400 }
      );
    }

    const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
    if (imageBuffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image is too large (max 10MB)." },
        { status: 413 }
      );
    }

    // Try Python FastAPI backend first
    try {
      const pythonBackendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer.buffer as ArrayBuffer, imageBuffer.byteOffset, imageBuffer.byteLength)], { type: detectedMimeType });
      formData.append('file', blob, 'scanned_sheet.jpg');

      const pythonRes = await fetch(`${pythonBackendUrl}/api/scan-measurements`, {
        method: 'POST',
        body: formData,
      });

      if (pythonRes.ok) {
        const pythonData = await pythonRes.json();
        return NextResponse.json(pythonData);
      }
    } catch (pythonErr) {
      console.warn("Python backend unavailable, falling back to direct Node Gemini REST API call:", pythonErr);
    }

    // Direct Node Google Gemini REST API call using GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "GEMINI_API_KEY environment variable is missing. Please check your environment configuration."
      }, { status: 500 });
    }

    const base64Data = imageBuffer.toString('base64');
    const promptText = `You are an expert natural stone and marble measurement sheet OCR parser.
Analyze this handwritten or printed measurement sheet image (which may be a tall vertical paper list).
Read every single row from top to bottom with absolute precision.

Rules:
1. Identify location / room / space name if written (e.g., "Living Room", "Passage", "Border", "Kitchen", "Pooja Room"). If missing, use "Line 1", "Line 2", etc.
2. Extract Length and Width dimensions in INCHES. Examples: "72 x 24" -> length: 72, width: 24. If fractional like "72 1/2", convert to 72.5. If feet like "6'", convert to 72 inches.
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
}`;

    const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastErrorText = '';
    let parsedRooms: any[] = [];

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: detectedMimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ]
          })
        });

        if (!geminiRes.ok) {
          lastErrorText = await geminiRes.text();
          console.warn(`Gemini model ${model} failed: ${lastErrorText}`);
          continue;
        }

        const geminiData = await geminiRes.json();
        const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        let cleanText = candidateText.trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanText = jsonMatch[0];
        }

        const parsedData = JSON.parse(cleanText);
        parsedRooms = Array.isArray(parsedData) ? parsedData : (parsedData.rooms || []);
        if (parsedRooms && parsedRooms.length > 0) {
          break;
        }
      } catch (err) {
        console.warn(`Model ${model} execution error:`, err);
      }
    }

    if (!parsedRooms || parsedRooms.length === 0) {
      return NextResponse.json({
        error: `Could not parse measurements note. ${lastErrorText ? 'Gemini API Error: ' + lastErrorText : 'Please make sure handwriting/printing is legible.'}`
      }, { status: 500 });
    }

    return NextResponse.json({ rooms: parsedRooms });

  } catch (err: any) {
    console.error("Scan measurements API error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while parsing the measurements note." },
      { status: 500 }
    );
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    if (fileIdToDelete && providerToDelete && providerToDelete !== 'local') {
      try { await deleteFromCloud(fileIdToDelete, providerToDelete); } catch (e) {}
    }
  }
}
