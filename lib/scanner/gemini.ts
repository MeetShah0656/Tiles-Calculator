import { GoogleGenAI } from '@google/genai';
import { MeasurementScanner, ScanResult } from './types';

export class GeminiMeasurementScanner implements MeasurementScanner {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      return new GoogleGenAI({ apiKey });
    }
    return null;
  }

  async scan(imageInput: string | Buffer, mimeTypeInput?: string): Promise<ScanResult> {
    const ai = this.getClient();
    if (!ai) {
      console.warn("GEMINI_API_KEY is not defined. MeasurementScanner will run in MOCK fallback mode.");
      // Simulate network delay of 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        rooms: [
          { name: "Kitchen Floor", length: 10, width: 8, unit: "ft", quantity: 1, confidence: 96 },
          { name: "Living Room (Main Area)", length: 14, width: 12, unit: "ft", quantity: 1, confidence: 98 },
          { name: "Master Bedroom", length: 12, width: 11, unit: "ft", quantity: 1, confidence: 85 },
          { name: "Bathroom", length: 6, width: 4, unit: "ft", quantity: 1, confidence: 62 },
          { name: "Foyer Passage", length: 5, width: 3.5, unit: "ft", quantity: 1, confidence: 45 }
        ]
      };
    }

    try {
      let data = '';
      let mimeType = 'image/jpeg';

      if (Buffer.isBuffer(imageInput)) {
        data = imageInput.toString('base64');
        mimeType = mimeTypeInput || 'image/jpeg';
      } else {
        // String input (legacy base64 support)
        data = imageInput;
        if (imageInput.includes(';base64,')) {
          const parts = imageInput.split(';base64,');
          data = parts[1];
          const mimeParts = parts[0].split(':');
          if (mimeParts.length > 1) {
            mimeType = mimeParts[1];
          }
        }
      }

      const prompt = `You are an expert construction measurement extraction system.
Analyze the handwritten note or printed image.
Extract all measurements with absolute precision.

For each measurement, identify:
1. The room/location name. If no explicit room name/label is specified for a set of dimensions (e.g. it is just "25 x 11" or "85 x 4"), do NOT skip the item. Instead, generate a generic name based on its sequence, such as "Item 1", "Item 2", "Item 3", etc.
2. The length and width.
3. The quantity (number of pieces). Look closely to see if there is a quantity multiplier or piece count written on the paper (e.g. "Kitchen Platform : 72 x 60 x 2" or "2 nos 72x60" or "Lobby: 120 x 36.5 (Qty: 3)" or similar). If no quantity is specified, ALWAYS default to 1.
4. Convert all values to numbers.
5. Provide a confidence score (from 0 to 100) representing how legible and certain the extraction is.

CRITICAL INSTRUCTIONS FOR ACCURACY AND HANDWRITTEN EDITS:
- ALWAYS USE INCHES: All numbers on the paper are in inches (e.g. "72x60" means 72 inches by 60 inches). Do NOT convert these to feet and do not round. Keep the dimensions exactly as written in inches.
- HANDLE CROSS-OUTS AND CORRECTIONS:
  * If a whole line/expression is completely crossed out or has a strike-through line drawn through the entire text (e.g., "33.6 x 42" has a horizontal line crossing it out), IGNORE that line entirely.
  * If a specific number or digit within a dimension is crossed out or scratched out, and a new number is written next to or above it (e.g., "6" is crossed out and a small "7" is written above it, to make "7 x 85"), you MUST extract the new/corrected value ("7") instead of the crossed-out one ("6"). Inspect overwritten text, digits, and insertions with extreme care to get the final corrected value.
- EXTRACT QUANTITY: Check if a count or quantity is specified next to the dimension (e.g. "x 2", "qty 2", "2 pcs"). Extract this value into the "quantity" field as a number. If not specified, ALWAYS return 1.
- DECIMALS PRECISION: Pay extreme attention to decimal points (e.g. "14.5", "10.25"). Do NOT round or truncate decimal values to whole integers.
- DOUBLE-CHECK DIGITS: Look closely at numbers to avoid truncating digits (e.g., do not read "72" as "7"). Verify multi-digit numbers carefully.
- NO EXTRA ROWS: Extract ONLY the valid measurements explicitly written on the paper. Do NOT invent or add any extra rows.

JSON Schema to return:
{
  "rooms": [
    {
      "name": "Room Name (e.g. Hall)",
      "length": 14.5,
      "width": 12,
      "quantity": 2,
      "confidence": 98
    }
  ]
}`;

      // Call Gemini 2.5 Flash
      const response = await ai.models.generateContent({
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

      // Standardize response fields
      parsed.rooms = parsed.rooms.map((room: any) => ({
        name: String(room.name || 'Unnamed Space'),
        length: Number(room.length) || 0,
        width: Number(room.width) || 0,
        unit: 'in',
        quantity: typeof room.quantity === 'number' && !isNaN(room.quantity) ? room.quantity : 1,
        confidence: Number(room.confidence) || 100
      }));

      return parsed as ScanResult;
    } catch (err: any) {
      console.error("Gemini Vision API scan failure:", err);
      throw new Error(`Gemini Vision Scan failed: ${err.message || err}`);
    }
  }
}
export const geminiScanner = new GeminiMeasurementScanner();
