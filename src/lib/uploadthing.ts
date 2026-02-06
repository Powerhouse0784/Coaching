// lib/uploadthing.ts
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { UTApi } from "uploadthing/server";

// ✅ Export both hooks AND uploadFiles function
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

/**
 * Delete files from UploadThing storage (SERVER-SIDE ONLY)
 * @param fileUrls - Array of UploadThing file URLs to delete
 */
export async function deleteUploadThingFiles(fileUrls: string[]): Promise<void> {
  if (!fileUrls || fileUrls.length === 0) {
    return;
  }

  try {
    // Extract file keys from URLs
    // UploadThing URLs look like: https://utfs.io/f/[FILE_KEY]
    const fileKeys = fileUrls
      .filter(url => url && url.includes('utfs.io/f/'))
      .map(url => {
        const parts = url.split('/f/');
        return parts[1] || '';
      })
      .filter(key => key.length > 0);

    if (fileKeys.length === 0) {
      console.log('No valid UploadThing files to delete');
      return;
    }

    console.log(`🗑️ Deleting ${fileKeys.length} files from UploadThing:`, fileKeys);

    // ✅ FIXED: Use UTApi directly (server-side)
    const utapi = new UTApi();
    await utapi.deleteFiles(fileKeys);

    console.log('✅ Files deleted successfully from UploadThing');
  } catch (error) {
    console.error('❌ Error deleting files from UploadThing:', error);
    // Don't throw - we don't want deletion to fail just because cleanup failed
  }
}