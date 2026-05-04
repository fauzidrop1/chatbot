// MFXAI Chat - Admin Providers API
// CRUD operations for API providers

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

// Get all providers
export async function GET(request: NextRequest) {
  const { valid } = await verifyAdmin(request);
  
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const providers = await db.chatApiProvider.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        baseUrl: p.baseUrl,
        isActive: p.isActive,
        hasApiKey: !!p.apiKey,
        // Mask the API key - show only last 4 chars if exists
        apiKeyPreview: p.apiKey ? `...${p.apiKey.slice(-4)}` : null,
        defaultRpm: p.defaultRpm,
        defaultRpd: p.defaultRpd,
        defaultTpm: p.defaultTpm,
        defaultTpd: p.defaultTpd,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json({ error: 'Failed to get providers' }, { status: 500 });
  }
}

// Create provider
export async function POST(request: NextRequest) {
  const { valid, admin } = await verifyAdmin(request);
  
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    const provider = await db.chatApiProvider.create({
      data: {
        name: data.name.toLowerCase().replace(/\s+/g, '-'),
        displayName: data.displayName || data.name,
        apiKey: data.apiKey || null,
        baseUrl: data.baseUrl || null,
        isActive: data.isActive ?? true,
        defaultRpm: data.defaultRpm || 60,
        defaultRpd: data.defaultRpd || 1000,
        defaultTpm: data.defaultTpm || 100000,
        defaultTpd: data.defaultTpd || 500000,
      },
    });

    return NextResponse.json({ success: true, provider });
  } catch (error: any) {
    console.error('Create provider error:', error);
    return NextResponse.json(
      { error: error.code === 'P2002' ? 'Provider name already exists' : 'Failed to create provider' },
      { status: 500 }
    );
  }
}

// Update provider
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
    
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.defaultRpm !== undefined) updateData.defaultRpm = data.defaultRpm;
    if (data.defaultRpd !== undefined) updateData.defaultRpd = data.defaultRpd;
    if (data.defaultTpm !== undefined) updateData.defaultTpm = data.defaultTpm;
    if (data.defaultTpd !== undefined) updateData.defaultTpd = data.defaultTpd;

    const provider = await db.chatApiProvider.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    console.error('Update provider error:', error);
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}

// Delete provider
export async function DELETE(request: NextRequest) {
  const { valid } = await verifyAdmin(request);
  
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Check if provider has models
    const modelsCount = await db.chatModel.count({
      where: { providerId: id },
    });

    if (modelsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete provider with existing models. Delete models first.' },
        { status: 400 }
      );
    }

    await db.chatApiProvider.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Provider deleted' });
  } catch (error) {
    console.error('Delete provider error:', error);
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}
