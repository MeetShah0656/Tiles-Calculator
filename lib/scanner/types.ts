export interface ScannedRoom {
  name: string;
  length: number;
  width: number;
  unit: string;
  confidence: number;
}

export interface ScanResult {
  rooms: ScannedRoom[];
}

export interface MeasurementScanner {
  scan(image: string | Buffer, mimeType?: string): Promise<ScanResult>;
}

