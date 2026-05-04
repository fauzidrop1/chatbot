// MFXAI Chat - Admin Stats API
// Dashboard statistics and analytics

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Verify admin access
async function verifyAdmin(request: NextRequest): Promise<{ valid: boolean; admin?: any }> {
  const adminId = request.headers.get('x-admin-id');
  
  if (!adminId) {
    return { valid: false };
  }
  
  const admin = await db.adminUser.findUnique({
    where: { id: adminId },
  });
  
  if (!admin || !admin.isActive) {
    return { valid: false };
  }
  
  return { valid: true, admin };
}

// Get admin dashboard statistics
export async function GET(request: NextRequest) {
  const { valid } = await verifyAdmin(request);
  
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get basic stats
    const [
      totalUsers,
      totalSessions,
      totalMessages,
      activeCodes,
      totalRequests,
    ] = await Promise.all([
      db.chatUser.count(),
      db.chatSession.count({ where: { isActive: true } }),
      db.chatMessage.count(),
      db.chatAccessCode.count({ where: { isActive: true } }),
      db.chatAccessCode.aggregate({
        _sum: { usedRequests: true },
      }),
    ]);

    // Get daily activity (last 7 days)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const [users, sessions, messages] = await Promise.all([
        db.chatUser.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        db.chatSession.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        db.chatMessage.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);
      
      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        users,
        sessions,
        messages,
      });
    }

    // Get top models usage
    const modelUsage = await db.chatMessage.groupBy({
      by: ['model'],
      where: {
        model: { not: null },
        role: 'assistant',
      },
      _count: { model: true },
      orderBy: { _count: { model: 'desc' } },
      take: 10,
    });

    // Get top users by requests
    const topUsers = await db.chatUser.findMany({
      include: {
        accessCode: true,
        _count: { select: { sessions: true } },
      },
      orderBy: {
        accessCode: { usedRequests: 'desc' },
      },
      take: 10,
    });

    // Get provider stats
    const providers = await db.chatApiProvider.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        isActive: true,
        hasApiKey: true,
      },
    });

    // Get access codes with user count
    const accessCodesWithUsers = await db.chatAccessCode.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalSessions,
        totalMessages,
        activeCodes,
        totalRequests: totalRequests._sum.usedRequests || 0,
      },
      dailyActivity,
      modelUsage: modelUsage.map(m => ({
        model: m.model,
        count: m._count.model,
      })),
      topUsers: topUsers.map(u => ({
        id: u.id,
        tier: u.accessCode.tier,
        code: u.accessCode.code,
        sessions: u._count.sessions,
        usedRequests: u.accessCode.usedRequests,
      })),
      providers,
      accessCodes: accessCodesWithUsers.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        tier: c.tier,
        userCount: c._count.users,
        isActive: c.isActive,
      })),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
