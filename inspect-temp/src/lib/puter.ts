// lib/puter.ts
// ✅ Fixed deprecation warnings

import { uploadFiles } from "@/lib/uploadthing";

export interface PuterUploadResult {
  url: string;
  size: number;
  name: string;
}

/**
 * Upload video via UploadThing (replaces Puter)
 */
export async function uploadVideoToPuter(
  file: File,
  onProgress?: (progress: number) => void
): Promise<PuterUploadResult> {
  try {
    console.log('📤 Uploading video via UploadThing:', file.name, file.size);

    const res = await uploadFiles("videoUploader", {
      files: [file],
      onUploadProgress: ({ progress }) => {
        console.log(`📊 Upload progress: ${progress}%`);
        if (onProgress) {
          onProgress(progress);
        }
      },
    });

    if (!res || res.length === 0) {
      throw new Error('Upload failed - no response from server');
    }

    const uploadedFile = res[0];
    
    // ✅ FIXED: Use ufsUrl instead of url (removes deprecation warning)
    const videoUrl = uploadedFile.ufsUrl || uploadedFile.url;
    
    console.log('✅ Video uploaded successfully:', videoUrl);

    return {
      url: videoUrl,
      size: file.size,
      name: file.name,
    };
  } catch (error: any) {
    console.error('❌ Video upload error:', error);
    throw new Error(`Video upload failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Upload thumbnail via UploadThing (replaces Puter)
 */
export async function uploadThumbnailToPuter(
  file: File
): Promise<PuterUploadResult> {
  try {
    console.log('📸 Uploading thumbnail via UploadThing:', file.name);

    const res = await uploadFiles("videoThumbnail", {
      files: [file],
    });

    if (!res || res.length === 0) {
      throw new Error('Thumbnail upload failed - no response from server');
    }

    const uploadedFile = res[0];
    
    // ✅ FIXED: Use ufsUrl instead of url (removes deprecation warning)
    const thumbnailUrl = uploadedFile.ufsUrl || uploadedFile.url;
    
    console.log('✅ Thumbnail uploaded:', thumbnailUrl);

    return {
      url: thumbnailUrl,
      size: file.size,
      name: file.name,
    };
  } catch (error: any) {
    console.error('❌ Thumbnail upload error:', error);
    throw new Error(`Thumbnail upload failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get video duration from file
 */
export function getVideoDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      
      if (isNaN(duration) || !isFinite(duration)) {
        resolve('0:00');
        return;
      }

      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);

      if (hours > 0) {
        resolve(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    video.onerror = () => {
      console.error('Failed to load video metadata');
      resolve('0:00');
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}