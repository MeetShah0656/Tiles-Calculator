import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geminiScanner } from '@/lib/scanner/gemini';

// Request schema
const RequestSchema = z.object({
  image: z.string().min(1, "Base64 image string is required")
});

// Response validation schemas
const RoomSchema = z.object({
  name: z.string(),
  length: z.number(),
  width: z.number(),
  unit: z.string(),
  confidence: z.number()
});

const ScanResultSchema = z.object({
  rooms: z.array(RoomSchema)
});

export async function POST(request: NextRequest) {
  try {
    // Check if request is JSON
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: "Invalid content type. Expected application/json." },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request structure
    const parsedRequest = RequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: "Invalid request payload. Image base64 string is required." },
        { status: 400 }
      );
    }

    const { image } = parsedRequest.data;
    
    // Check file size (approximate from base64 length, where 4 chars = 3 bytes)
    const approximateSizeBytes = (image.length * 3) / 4;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (approximateSizeBytes > maxSizeBytes) {
      return NextResponse.json(
        { error: "Image file size exceeds the 10MB limit. Please upload a smaller image." },
        { status: 413 }
      );
    }

    // Call scanner
    const result = await geminiScanner.scan(image);
    
    // Validate output format with Zod schema to ensure legibility and accuracy
    const parsedResult = ScanResultSchema.safeParse(result);
    if (!parsedResult.success) {
      console.error("Gemini output schema validation failure:", parsedResult.error);
      return NextResponse.json(
        { error: "The extraction model returned a malformed response structure. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResult.data);
  } catch (err: any) {
    console.error("Scan measurements API error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while parsing the measurements note." },
      { status: 500 }
    );
  }
}
