import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

interface UploadResult {
  url: string;
  publicId: string;
  provider: 'supabase' | 'cloudinary' | 'local';
}

/**
 * Uploads a file buffer to either Cloudinary or Supabase Storage, depending on configured keys.
 * Automatically handles bucket creation for Supabase if missing.
 */
export async function uploadToCloud(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult | null> {
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

  // 1. Try Cloudinary if keys are present
  if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret) {
    try {
      console.log("Attempting Cloudinary upload...");
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = 'tiles_calculator_uploads';
      
      const signatureString = `folder=${folder}&timestamp=${timestamp}${cloudinaryApiSecret}`;
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
      formData.append('file', blob, fileName);
      formData.append('api_key', cloudinaryApiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        url: data.secure_url,
        publicId: data.public_id,
        provider: 'cloudinary'
      };
    } catch (err) {
      console.error("Cloudinary upload failed, falling back:", err);
    }
  }

  // 2. Try Supabase Storage if keys are present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      console.log("Attempting Supabase Storage upload...");
      const supabase = createClient(supabaseUrl, supabaseKey);
      const bucketName = 'scans';

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn(`Supabase upload failed: ${error.message}. Attempting to create bucket '${bucketName}'...`);
        try {
          const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          });
          if (bucketError) throw bucketError;

          // Retry upload
          const retry = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
              contentType: mimeType,
              cacheControl: '3600',
              upsert: true
            });

          if (retry.error) throw retry.error;
        } catch (bucketCreateErr: any) {
          console.error("Failed to create bucket scans dynamically:", bucketCreateErr.message || bucketCreateErr);
          throw error;
        }
      }

      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      return {
        url: urlData.publicUrl,
        publicId: fileName,
        provider: 'supabase'
      };
    } catch (err) {
      console.error("Supabase Storage upload failed:", err);
    }
  }

  console.warn("No cloud storage providers successfully uploaded the image. Falling back to local/tmp storage only.");
  return null;
}

/**
 * Deletes a file from either Cloudinary or Supabase Storage, based on the provider.
 */
export async function deleteFromCloud(
  publicId: string,
  provider: 'supabase' | 'cloudinary' | 'local'
): Promise<boolean> {
  if (provider === 'cloudinary') {
    const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
    const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret) {
      try {
        console.log(`Deleting from Cloudinary: ${publicId}`);
        const timestamp = Math.round(new Date().getTime() / 1000);
        const signatureString = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryApiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', cloudinaryApiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/destroy`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        return data.result === 'ok';
      } catch (err) {
        console.error("Failed to delete asset from Cloudinary:", err);
        return false;
      }
    }
  }

  if (provider === 'supabase') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        console.log(`Deleting from Supabase Storage scans: ${publicId}`);
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.storage.from('scans').remove([publicId]);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Failed to delete asset from Supabase Storage:", err);
        return false;
      }
    }
  }

  return false;
}
