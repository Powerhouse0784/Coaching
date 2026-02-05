// lib/uploadthing.ts
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// ✅ Export both hooks AND uploadFiles function
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();