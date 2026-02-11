// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  // ✅ Video uploader (512MB max for large lecture videos)
  videoUploader: f({ 
    video: { maxFileSize: "512MB", maxFileCount: 1 } 
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'TEACHER') {
        throw new Error("Unauthorized - Teachers only");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Video uploaded:", file.url);
      return { url: file.url };
    }),

  // Thumbnail uploader for folders
  folderThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'TEACHER') {
        throw new Error("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Folder thumbnail uploaded:", file.url);
      return { url: file.url };
    }),

  assignmentFile: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "TEACHER") {
        throw new Error("Unauthorized - Teachers only");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Assignment file uploaded:", file.url);
      return { url: file.url };
    }),

  // ✅ FIXED: Student submission PDF upload - NOW ALLOWS BOTH STUDENT AND TEACHER
  submissionFile: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new Error("Unauthorized - Please sign in");
      }
      
      // ✅ Allow both STUDENT and TEACHER (for testing)
      if (session.user.role !== "STUDENT" && session.user.role !== "TEACHER") {
        throw new Error("Unauthorized - Students and Teachers only");
      }
      
      return { userId: session.user.id, role: session.user.role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Submission uploaded:", file.url);
      return { url: file.url };
    }),

  // Comment attachment (Students helping others)
  commentAttachment: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        throw new Error("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Comment attachment uploaded:", file.url);
      return { url: file.url };
    }),
    
  // Thumbnail uploader for videos
  videoThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'TEACHER') {
        throw new Error("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Video thumbnail uploaded:", file.url);
      return { url: file.url };
    }),
    // Doubt image upload
doubtImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
  .middleware(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    return { userId: session.user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Doubt image uploaded:", file.url);
    return { url: file.url };
  }),

// Doubt PDF upload
doubtPdf: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
  .middleware(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    return { userId: session.user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Doubt PDF uploaded:", file.url);
    return { url: file.url };
  }),


  // Notes file upload (PDF, images, docs)
notesFile: f({ 
  pdf: { maxFileSize: "32MB", maxFileCount: 1 },
  image: { maxFileSize: "8MB", maxFileCount: 1 },
})
  .middleware(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      throw new Error("Unauthorized - Teachers only");
    }
    return { userId: session.user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Notes file uploaded:", file.url);
    return { url: file.url };
  }),

// Notes thumbnail upload
notesThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
  .middleware(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      throw new Error("Unauthorized - Teachers only");
    }
    return { userId: session.user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Notes thumbnail uploaded:", file.url);
    return { url: file.url };
  }),
  
  // Profile avatar uploader
  profileAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session) {
        throw new Error("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar uploaded:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;