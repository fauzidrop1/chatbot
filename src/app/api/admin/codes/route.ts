// MFXAI Chat - Admin Access Codes API
// Full CRUD operations with tier limits

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tierDefaults, getTierDefaults } from '@/lib/seed';

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

// Generate random code
function generateCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get all access codes
export async function GET(request: NextRequest) {
  const { valid } = await verifyAdmin(request);
  
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const codes = await db.chatAccessCode.findMany({
      include: {
        _count: { select: { users: true } },
        users: {
          select: {
            id: true,
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
        // Rate limits
        rpm: c.rpm,
        rpd: c.rpd,
        tpm: c.tpm,
        tpd: c.tpd,
        imagesPerDay: c.imagesPerDay,
        // User limits
        maxUsers: c.maxUsers,
        userCount: c.userCount,
        // Request limits (legacy)
        maxRequests: c.maxRequests,
        usedRequests: c.usedRequests,
        // Status
        expiresAt: c.expiresAt,
        expirationDays: c.expirationDays,
        isActive: c.isActive,
        // Stats
        totalUsers: c._count.users,
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
  const { valid } = await verifyAdmin(request);
  
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // Generate code if not provided
    const code = data.code?.toUpperCase() || generateCode(data.codeLength || 8);
    
    // Get tier defaults
    const tierLimits = getTierDefaults(data.tier || 'basic');
    
    // Calculate expiration date
    let expiresAt = null;
    if (data.expirationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expirationDays);
    }
    
    const accessCode = await db.chatAccessCode.create({
      data: {
        code,
        name: data.name || null,
        tier: data.tier || 'basic',
        // Use provided limits or tier defaults
        rpm: data.rpm ?? tierLimits.rpm,
        rpd: data.rpd ?? tierLimits.rpd,
        tpm: data.tpm ?? tierLimits.tpm,
        tpd: data.tpd ?? tierLimits.tpd,
        imagesPerDay: data.imagesPerDay ?? tierLimits.imagesPerDay,
        // User limits
        maxUsers: data.maxUsers ?? 1,
        userCount: 0,
        // Request limits
        maxRequests: data.maxRequests ?? (data.tier === 'enterprise' ? 10000 : data.tier === 'pro' ? 1000 : 100),
        usedRequests: 0,
        // Expiration
        expiresAt,
        expirationDays: data.expirationDays || null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, code: accessCode });
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
  const { valid } = await verifyAdmin(request);
  
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, ...data } = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // Basic fields
    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.name !== undefined) updateData.name = data.name;
    if (data.tier) updateData.tier = data.tier;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    // Rate limits
    if (data.rpm !== undefined) updateData.rpm = data.rpm;
    if (data.rpd !== undefined) updateData.rpd = data.rpd;
    if (data.tpm !== undefined) updateData.tpm = data.tpm;
    if (data.tpd !== undefined) updateData.tpd = data.tpd;
    if (data.imagesPerDay !== undefined) updateData.imagesPerDay = data.imagesPerDay;
    
    // User limits
    if (data.maxUsers !== undefined) updateData.maxUsers = data.maxUsers;
    
    // Expiration
    if (data.expirationDays !== undefined) {
      updateData.expirationDays = data.expirationDays;
      if (data.expirationDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + data.expirationDays);
        updateData.expiresAt = expiresAt;
      } else {
        updateData.expiresAt = null;
      }
    }
    
    // Request limits
    if (data.maxRequests !== undefined) updateData.maxRequests = data.maxRequests;
    if (data.usedRequests !== undefined) updateData.usedRequests = data.usedRequests;

    const code = await db.chatAccessCode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error('Update code error:', error);
    return NextResponse.json(
      { error: error.code === 'P2002' ? 'Code already exists' : 'Failed to update code' },
      { status: 500 }
    );
  }
}

// Delete access code
export async function DELETE(request: NextRequest) {
  const { valid } = await verifyAdmin(request);
  
  if (!valid) {
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
      // Delete all users and their sessions first
      const users = await db.chatUser.findMany({ where: { accessCodeId: id } });
      
      for (const user of users) {
        // Delete sessions and messages
        const sessions = await db.chatSession.findMany({ where: { userId: user.id } });
        for (const session of sessions) {
          await db.chatMessage.deleteMany({ where: { sessionId: session.id } });
        }
        await db.chatSession.deleteMany({ where: { userId: user.id } });
      }
      
      await db.chatUser.deleteMany({ where: { accessCodeId: id } });
    }

    await db.chatAccessCode.delete({ where: { id } });

    return NextResponse.json({ 
      success: true, 
      message: 'Code and all associated users deleted' 
    });
  } catch (error) {
    console.error('Delete code error:', error);
    return NextResponse.json({ error: 'Failed to delete code' }, { status: 500 });
  }
}

// Get tier defaults
export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: true,
    tierDefaults,
  });
}
