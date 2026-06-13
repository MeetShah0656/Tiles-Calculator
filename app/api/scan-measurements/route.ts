import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geminiScanner } from '@/lib/scanner/gemini';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { deleteFromCloud } from '@/lib/storage/storageManager';

// Request schema
const RequestSchema = z.object({
  fileId: z.string().optional(),
  url: z.string().optional(),
  provider: z.enum(['supabase', 'cloudinary', 'local']).optional(),
  image: z.string().optional(),
  mimeType: z.string().optional()
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
  let tempFilePath: string | null = null;
  let fileIdToDelete: string | null = null;
  let providerToDelete: 'supabase' | 'cloudinary' | 'local' | null = null;

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
        { error: "Invalid request payload. Provide fileId and url, or base64 image." },
        { status: 400 }
      );
    }

    const { fileId, url, provider, image, mimeType } = parsedRequest.data;
    
    let imageBuffer: Buffer | null = null;
    let detectedMimeType = mimeType || 'image/jpeg';

    if (fileId) {
      fileIdToDelete = fileId;
      providerToDelete = provider || null;
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, fileId);
    }

    // --- Tiered Image Loading ---
    
    // Tier 1: Cloud URL Fetch
    if (url) {
      try {
        console.log(`Tier 1: Fetching image from cloud URL: ${url}`);
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
          console.log("Tier 1 loading successful!");
        } else {
          console.warn(`Tier 1 failed: HTTP ${res.status}`);
        }
      } catch (err) {
        console.warn("Tier 1 failed with error, falling back to local file:", err);
      }
    }

    // Tier 2: Local Disk Fallback
    if (!imageBuffer && tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        console.log(`Tier 2: Reading image from local disk: ${tempFilePath}`);
        imageBuffer = fs.readFileSync(tempFilePath);
        console.log("Tier 2 loading successful!");
      } catch (err) {
        console.warn("Tier 2 failed with error, falling back to legacy base64:", err);
      }
    }

    // Tier 3: Legacy Base64 Fallback
    if (!imageBuffer && image) {
      console.log("Tier 3: Falling back to legacy base64 image data");
      let base64Data = image;
      if (image.includes(';base64,')) {
        const parts = image.split(';base64,');
        base64Data = parts[1];
        const mimeParts = parts[0].split(':');
        if (mimeParts.length > 1) {
          detectedMimeType = mimeParts[1];
        }
      }
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!imageBuffer) {
      return NextResponse.json(
        { error: "Image data could not be retrieved from any storage tier." },
        { status: 400 }
      );
    }

    // Call scanner
    const result = await geminiScanner.scan(imageBuffer, detectedMimeType);
    
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
  } finally {
    // --- Post-Processing Cleanup ---
    
    // 1. Delete local file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`Successfully cleaned up local file: ${tempFilePath}`);
      } catch (err) {
        console.error("Failed to delete local temp file:", err);
      }
    }

    // 2. Delete cloud file
    if (fileIdToDelete && providerToDelete && providerToDelete !== 'local') {
      try {
        await deleteFromCloud(fileIdToDelete, providerToDelete);
        console.log(`Successfully cleaned up cloud file from ${providerToDelete}: ${fileIdToDelete}`);
      } catch (err) {
        console.error("Failed to delete cloud storage file during cleanup:", err);
      }
    }
  }
}

