import { GoogleGenAI } from '@google/genai';
import { MeasurementScanner, ScanResult } from './types';

export class GeminiMeasurementScanner implements MeasurementScanner {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn("GEMINI_API_KEY is not defined. MeasurementScanner will run in MOCK fallback mode.");
    }
  }

  async scan(imageBase64: string): Promise<ScanResult> {
    if (!this.ai) {
      console.log("Mocking Gemini scan...");
      // Simulate network delay of 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        rooms: [
          { name: "Kitchen Floor", length: 10, width: 8, unit: "ft", confidence: 96 },
          { name: "Living Room (Main Area)", length: 14, width: 12, unit: "ft", confidence: 98 },
          { name: "Master Bedroom", length: 12, width: 11, unit: "ft", confidence: 85 },
          { name: "Bathroom (Low confidence)", length: 6, width: 4, unit: "ft", confidence: 62 },
          { name: "Foyer Passage", length: 5, width: 3.5, unit: "ft", confidence: 45 }
        ]
      };
    }

    try {
      // Split base64 prefix if present (e.g. data:image/jpeg;base64,...)
      let mimeType = 'image/jpeg';
      let data = imageBase64;
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        data = parts[1];
        const mimeParts = parts[0].split(':');
        if (mimeParts.length > 1) {
          mimeType = mimeParts[1];
        }
      }

      const prompt = `You are an expert construction measurement extraction system.
Analyze the handwritten note or printed image.
Extract all room measurements.
For each measurement, identify:
1. The room/location name.
2. The length and width.
3. The measurement units (detect if they are in inches, feet, or meters).
4. Convert all values to numbers.
5. Provide a confidence score (from 0 to 100) representing how legible and certain the extraction is.

Important instructions:
- Return ONLY valid JSON matching the schema.
- Do NOT return markdown formatting or code fences.
- Do NOT return explanations.
- Never invent values. If a value is unreadable, do not include it.

JSON Schema to return:
{
  "rooms": [
    {
      "name": "Room Name (e.g. Hall)",
      "length": 14,
      "width": 12,
      "unit": "in",
      "confidence": 98
    }
  ]
}`;

      // Call Gemini 2.5 Flash
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data,
              mimeType
            }
          }
        ]
      });

      const responseText = response.text || '';
      if (!responseText) {
        throw new Error("No text returned from Gemini Vision API.");
      }

      // Sanitize response by removing markdown blocks if LLM output still includes them
      let cleanText = responseText.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```[a-zA-Z0-9]*\n?/, '');
        cleanText = cleanText.replace(/\n?```$/, '');
      }
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText);
      
      // Basic validation
      if (!parsed || !Array.isArray(parsed.rooms)) {
        throw new Error("Invalid response structure from Gemini Vision API. Missing 'rooms' list.");
      }

      return parsed as ScanResult;
    } catch (err: any) {
      console.error("Gemini Vision API scan failure:", err);
      throw new Error(`Gemini Vision Scan failed: ${err.message || err}`);
    }
  }
}
export const geminiScanner = new GeminiMeasurementScanner();
