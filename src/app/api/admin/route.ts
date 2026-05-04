// MFXAI Chat - Admin Auth API
// Admin authentication and stats

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: true,
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Get admin stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminToken = searchParams.get('token');

    // Simple token verification
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (adminToken !== adminPassword) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalSessions,
        totalMessages,
        activeCodes,
        totalRequests: totalRequests._sum.usedRequests || 0,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
