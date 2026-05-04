// MFXAI Chat - Admin Access Codes API
// CRUD operations for access codes

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Verify admin access
function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return authHeader === `Bearer ${adminPassword}`;
}

// Get all access codes
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const codes = await db.chatAccessCode.findMany({
      include: {
        _count: { select: { users: true } },
        users: {
          select: {
            _count: { select: { sessions: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      codes: codes.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        tier: c.tier,
        maxRequests: c.maxRequests,
        usedRequests: c.usedRequests,
        expiresAt: c.expiresAt,
        isActive: c.isActive,
        userCount: c._count.users,
        totalSessions: c.users.reduce((sum, u) => sum + u._count.sessions, 0),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get codes error:', error);
    return NextResponse.json({ error: 'Failed to get codes' }, { status: 500 });
  }
}

// Create access code
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    const code = await db.chatAccessCode.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        tier: data.tier || 'basic',
        maxRequests: data.maxRequests || 100,
        usedRequests: 0,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error('Create code error:', error);
    return NextResponse.json(
      { error: error.code === 'P2002' ? 'Code already exists' : 'Failed to create code' },
      { status: 500 }
    );
  }
}

// Update access code
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, ...data } = await request.json();

    const code = await db.chatAccessCode.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.tier && { tier: data.tier }),
        ...(data.maxRequests !== undefined && { maxRequests: data.maxRequests }),
        ...(data.usedRequests !== undefined && { usedRequests: data.usedRequests }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error('Update code error:', error);
    return NextResponse.json({ error: 'Failed to update code' }, { status: 500 });
  }
}

// Delete access code
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
    }

    // Check for users using this code
    const usersCount = await db.chatUser.count({ where: { accessCodeId: id } });
    if (usersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete code with active users' },
        { status: 400 }
      );
    }

    await db.chatAccessCode.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Code deleted' });
  } catch (error) {
    console.error('Delete code error:', error);
    return NextResponse.json({ error: 'Failed to delete code' }, { status: 500 });
  }
}
