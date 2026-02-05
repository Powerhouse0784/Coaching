// app/api/teacher/videos/_middleware.js
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

export function middleware(request) {
  // Add CORS headers if needed
  const response = NextResponse.next();
  
  // Increase max content length for video uploads
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}