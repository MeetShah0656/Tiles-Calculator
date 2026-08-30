import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { uploadToCloud } from '@/lib/storage/storageManager';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided in the request.' },
        { status: 400 }
      );
    }

    const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: 'File is too large (max 10MB).' },
        { status: 413 }
      );
    }

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileId = `${uniqueId}-${sanitizedOriginalName}`;

    // Read file as Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local /tmp fallback directory (persistent for the duration of the request/session on serverless)
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, fileId);
    
    // Ensure temp directory exists (should exist by default, but safe to check)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempFilePath, buffer);
    console.log(`Saved temporary file to local disk: ${tempFilePath}`);

    // Upload to cloud (Supabase or Cloudinary)
    const uploadResult = await uploadToCloud(buffer, fileId, file.type);

    return NextResponse.json({
      fileId,
      url: uploadResult ? uploadResult.url : '',
      provider: uploadResult ? uploadResult.provider : 'local',
      mimeType: file.type,
      size: file.size,
      success: true
    });
  } catch (err: any) {
    console.error("Ingestion upload API failure:", err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during upload.' },
      { status: 500 }
    );
  }
}
