export async function scanMeasurementsWithBackend(fileOrBase64) {
  const formData = new FormData();
  if (typeof fileOrBase64 === 'string') {
    formData.append('image', fileOrBase64);
  } else if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
    formData.append('file', fileOrBase64);
  } else {
    throw new Error("Invalid image format. Expected File, Blob, or Base64 string.");
  }

  // 1. Try Next.js Server API route (calls Gemini 2.0 Flash with GEMINI_API_KEY)
  try {
    const response = await fetch('/api/scan-measurements', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const roomsList = Array.isArray(data) ? data : (data.rooms || data.data || []);
      if (roomsList && roomsList.length > 0) {
        return roomsList;
      }
    }
  } catch (err) {
    console.warn("Next.js API route scan failed, trying Python backend fallback:", err);
  }

  // 2. Fallback to Python FastAPI backend
  try {
    const pythonBackendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonBackendUrl}/api/scan-measurements`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const roomsList = Array.isArray(data) ? data : (data.rooms || data.data || []);
      if (roomsList && roomsList.length > 0) {
        return roomsList;
      }
    }
  } catch (err) {
    console.warn("Python API scan failed:", err);
  }

  throw new Error("Could not parse image note. Please make sure GEMINI_API_KEY is set and handwriting/printing is clear.");
}
