// Simple in-memory rate limiting
// Note: This resets on server restart. For production, use Redis with proper permissions.

interface RateLimitStore {
  [key: string]: number[];
}

const store: RateLimitStore = {};

interface RateLimitConfig {
  limit: number;      // Maximum requests
  window: number;     // Time window in seconds
  identifier: string; // Unique identifier (IP, email, etc.)
}

/**
 * Rate limiter using in-memory sliding window
 * @returns { success: boolean, remaining: number, reset: number, limit: number }
 */
export async function rateLimit(config: RateLimitConfig) {
  const { limit, window, identifier } = config;
  const now = Date.now();
  const windowStart = now - window * 1000;

  try {
    // Initialize if doesn't exist
    if (!store[identifier]) {
      store[identifier] = [];
    }

    // Remove old timestamps outside the window
    store[identifier] = store[identifier].filter(timestamp => timestamp > windowStart);

    // Add current timestamp
    store[identifier].push(now);

    // Check if limit exceeded
    const count = store[identifier].length;
    const success = count <= limit;
    const remaining = Math.max(0, limit - count);
    const reset = Math.ceil((now + window * 1000) / 1000);

    return {
      success,
      remaining,
      reset,
      limit,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request but log it
    return {
      success: true,
      remaining: limit,
      reset: Math.ceil((now + window * 1000) / 1000),
      limit,
    };
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cfConnecting = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  if (cfConnecting) {
    return cfConnecting;
  }

  return 'unknown';
}

/**
 * Contact form rate limit - 5 requests per hour per IP
 */
export async function contactFormRateLimit(identifier: string) {
  return rateLimit({
    identifier: `contact:${identifier}`,
    limit: 5,
    window: 3600, // 1 hour
  });
}

/**
 * Chatbot rate limit - 30 requests per minute per IP
 */
export async function chatbotRateLimit(identifier: string) {
  return rateLimit({
    identifier: `chat:${identifier}`,
    limit: 30,
    window: 60, // 1 minute
  });
}

/**
 * Store contact form submission for analytics
 * Using in-memory storage - logs to console for now
 */
export async function trackContactSubmission(data: {
  email: string;
  category: string;
  timestamp: number;
}) {
  try {
    // For development - just log
    console.log('📧 Contact submission:', {
      email: data.email,
      category: data.category,
      time: new Date(data.timestamp).toISOString()
    });
    
    // TODO: In production, store in your database or use Redis with proper permissions
  } catch (error) {
    console.error('Failed to track submission:', error);
  }
}

/**
 * Track chatbot conversation
 * Using in-memory storage - logs to console for now
 */
export async function trackChatMessage(data: {
  sessionId: string;
  message: string;
  response: string;
  timestamp: number;
}) {
  try {
    // For development - just log
    console.log('💬 Chat message:', {
      sessionId: data.sessionId.substring(0, 8),
      messageLength: data.message.length,
      responseLength: data.response.length,
      time: new Date(data.timestamp).toISOString()
    });
    
    // TODO: In production, store in your database or use Redis with proper permissions
  } catch (error) {
    console.error('Failed to track chat:', error);
  }
}

/**
 * Get analytics for contact form submissions
 * Placeholder - returns empty object for now
 */
export async function getContactAnalytics(days: number = 7) {
  try {
    console.log(`📊 Analytics requested for last ${days} days`);
    // TODO: Implement proper analytics storage
    return {};
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return {};
  }
}