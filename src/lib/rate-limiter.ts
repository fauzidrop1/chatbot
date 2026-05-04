// MFXAI Chat - Rate Limiting Utility
// Handles RPM, RPD, TPM, TPD, and Image limits

import { db } from './db';

interface RateLimitResult {
  allowed: boolean;
  error?: string;
  retryAfter?: number; // seconds until reset
  remaining?: {
    rpm: number;
    rpd: number;
    tpm: number;
    tpd: number;
    imagesToday: number;
  };
}

interface UserLimits {
  rpm: number;
  rpd: number;
  tpm: number;
  tpd: number;
  imagesPerDay: number;
}

// Get current minute as string (HH:mm)
function getCurrentMinute(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Get start of day
function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get seconds until next minute
function getSecondsUntilNextMinute(): number {
  const now = new Date();
  return 60 - now.getSeconds();
}

// Get seconds until midnight
function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

// Get user's usage for today
async function getUserDailyUsage(userId: string, date: Date) {
  const startOfDay = getStartOfDay(date);
  
  const usage = await db.chatUsageLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
  });
  
  return usage;
}

// Get user's minute-level usage from the log
function getMinuteUsage(minuteLogs: string | null, minute: string): { requests: number; tokens: number } {
  if (!minuteLogs) return { requests: 0, tokens: 0 };
  
  try {
    const logs = JSON.parse(minuteLogs);
    return logs[minute] || { requests: 0, tokens: 0 };
  } catch {
    return { requests: 0, tokens: 0 };
  }
}

// Update user's usage
async function updateUserUsage(
  userId: string,
  type: 'chat' | 'image',
  tokens: number = 0
): Promise<void> {
  const now = new Date();
  const startOfDay = getStartOfDay(now);
  const currentMinute = getCurrentMinute();
  
  // Get or create usage log for today
  let usage = await db.chatUsageLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
  });
  
  if (!usage) {
    // Create new usage log
    const minuteLogs: Record<string, { requests: number; tokens: number }> = {
      [currentMinute]: { requests: 1, tokens },
    };
    
    await db.chatUsageLog.create({
      data: {
        userId,
        date: startOfDay,
        chatRequests: type === 'chat' ? 1 : 0,
        imageRequests: type === 'image' ? 1 : 0,
        inputTokens: tokens,
        outputTokens: 0,
        minuteLogs: JSON.stringify(minuteLogs),
      },
    });
  } else {
    // Update existing usage log
    const minuteLogs = usage.minuteLogs ? JSON.parse(usage.minuteLogs) : {};
    const currentMinuteUsage = minuteLogs[currentMinute] || { requests: 0, tokens: 0 };
    
    minuteLogs[currentMinute] = {
      requests: currentMinuteUsage.requests + 1,
      tokens: currentMinuteUsage.tokens + tokens,
    };
    
    await db.chatUsageLog.update({
      where: { id: usage.id },
      data: {
        chatRequests: type === 'chat' ? { increment: 1 } : undefined,
        imageRequests: type === 'image' ? { increment: 1 } : undefined,
        inputTokens: { increment: tokens },
        minuteLogs: JSON.stringify(minuteLogs),
        updatedAt: now,
      },
    });
  }
}

// Check rate limits for a user
export async function checkRateLimit(
  userId: string,
  limits: UserLimits,
  type: 'chat' | 'image' = 'chat',
  estimatedTokens: number = 1000
): Promise<RateLimitResult> {
  const now = new Date();
  const startOfDay = getStartOfDay(now);
  const currentMinute = getCurrentMinute();
  
  // Get user's usage for today
  const usage = await getUserDailyUsage(userId, now);
  
  // If no usage yet, all limits are available
  if (!usage) {
    return {
      allowed: true,
      remaining: {
        rpm: limits.rpm,
        rpd: limits.rpd,
        tpm: limits.tpm,
        tpd: limits.tpd,
        imagesToday: limits.imagesPerDay,
      },
    };
  }
  
  // Get minute-level usage
  const minuteUsage = getMinuteUsage(usage.minuteLogs, currentMinute);
  
  // Check RPM (Requests Per Minute)
  if (minuteUsage.requests >= limits.rpm) {
    return {
      allowed: false,
      error: 'Rate limit exceeded: Too many requests per minute. Please wait a moment.',
      retryAfter: getSecondsUntilNextMinute(),
    };
  }
  
  // Check TPM (Tokens Per Minute)
  if (minuteUsage.tokens + estimatedTokens > limits.tpm) {
    return {
      allowed: false,
      error: 'Rate limit exceeded: Token limit per minute reached. Please wait a moment.',
      retryAfter: getSecondsUntilNextMinute(),
    };
  }
  
  // Check RPD (Requests Per Day)
  const totalRequests = usage.chatRequests + usage.imageRequests;
  if (totalRequests >= limits.rpd) {
    return {
      allowed: false,
      error: 'Daily request limit exceeded. Please try again tomorrow.',
      retryAfter: getSecondsUntilMidnight(),
    };
  }
  
  // Check TPD (Tokens Per Day)
  if (usage.inputTokens + estimatedTokens > limits.tpd) {
    return {
      allowed: false,
      error: 'Daily token limit exceeded. Please try again tomorrow.',
      retryAfter: getSecondsUntilMidnight(),
    };
  }
  
  // Check Image limit (for image generation)
  if (type === 'image' && usage.imageRequests >= limits.imagesPerDay) {
    return {
      allowed: false,
      error: 'Daily image generation limit exceeded. Please try again tomorrow.',
      retryAfter: getSecondsUntilMidnight(),
    };
  }
  
  // All checks passed
  return {
    allowed: true,
    remaining: {
      rpm: limits.rpm - minuteUsage.requests,
      rpd: limits.rpd - totalRequests,
      tpm: limits.tpm - minuteUsage.tokens,
      tpd: limits.tpd - usage.inputTokens,
      imagesToday: limits.imagesPerDay - usage.imageRequests,
    },
  };
}

// Record usage after a successful request
export async function recordUsage(
  userId: string,
  type: 'chat' | 'image',
  inputTokens: number = 0,
  outputTokens: number = 0
): Promise<void> {
  await updateUserUsage(userId, type, inputTokens + outputTokens);
}

// Get user's current rate limit status
export async function getUserRateLimitStatus(
  userId: string,
  limits: UserLimits
): Promise<{
  current: {
    rpm: number;
    rpd: number;
    tpm: number;
    tpd: number;
    imagesToday: number;
  };
  limits: UserLimits;
}> {
  const now = new Date();
  const usage = await getUserDailyUsage(userId, now);
  const currentMinute = getCurrentMinute();
  
  if (!usage) {
    return {
      current: {
        rpm: 0,
        rpd: 0,
        tpm: 0,
        tpd: 0,
        imagesToday: 0,
      },
      limits,
    };
  }
  
  const minuteUsage = getMinuteUsage(usage.minuteLogs, currentMinute);
  const totalRequests = usage.chatRequests + usage.imageRequests;
  
  return {
    current: {
      rpm: minuteUsage.requests,
      rpd: totalRequests,
      tpm: minuteUsage.tokens,
      tpd: usage.inputTokens,
      imagesToday: usage.imageRequests,
    },
    limits,
  };
}
