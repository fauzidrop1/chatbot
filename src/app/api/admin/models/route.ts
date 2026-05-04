// MFXAI Chat - Admin Models API
// CRUD operations for AI models

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Verify admin access
function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return authHeader === `Bearer ${adminPassword}`;
}

// Get all models (including inactive)
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const models = await db.chatModel.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      models: models.map(m => ({
        id: m.id,
        name: m.name,
        displayName: m.displayName,
        provider: m.provider,
        type: m.type,
        capabilities: m.capabilities ? JSON.parse(m.capabilities) : [],
        maxTokens: m.maxTokens,
        isActive: m.isActive,
        sortOrder: m.sortOrder,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json({ error: 'Failed to get models' }, { status: 500 });
  }
}

// Create model
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    const model = await db.chatModel.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        provider: data.provider,
        type: data.type,
        capabilities: data.capabilities ? JSON.stringify(data.capabilities) : null,
        maxTokens: data.maxTokens || 4096,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, model });
  } catch (error: any) {
    console.error('Create model error:', error);
    return NextResponse.json(
      { error: error.code === 'P2002' ? 'Model name already exists' : 'Failed to create model' },
      { status: 500 }
    );
  }
}

// Update model
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, ...data } = await request.json();

    const model = await db.chatModel.update({
      where: { id },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.provider && { provider: data.provider }),
        ...(data.type && { type: data.type }),
        ...(data.capabilities && { capabilities: JSON.stringify(data.capabilities) }),
        ...(data.maxTokens && { maxTokens: data.maxTokens }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, model });
  } catch (error) {
    console.error('Update model error:', error);
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}

// Delete model
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
    }

    await db.chatModel.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Model deleted' });
  } catch (error) {
    console.error('Delete model error:', error);
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 });
  }
}
