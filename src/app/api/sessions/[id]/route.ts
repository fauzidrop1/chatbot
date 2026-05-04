// MFXAI Chat - Single Session API
// Get, update, delete individual session

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get session with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const session = await db.chatSession.findFirst({
      where: { id, userId, isActive: true },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        model: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        model: session.model ? {
          id: session.model.id,
          name: session.model.name,
          displayName: session.model.displayName,
          provider: session.model.provider,
        } : null,
        messages: session.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          imageUrls: m.imageUrls ? JSON.parse(m.imageUrls) : null,
          model: m.model,
          metadata: m.metadata ? JSON.parse(m.metadata) : null,
          createdAt: m.createdAt,
        })),
        isActive: session.isActive,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

// Update session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, title, modelId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const session = await db.chatSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const updated = await db.chatSession.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(modelId && { modelId }),
        updatedAt: new Date(),
      },
      include: { model: true },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: updated.id,
        title: updated.title,
        model: updated.model ? {
          id: updated.model.id,
          name: updated.model.name,
          displayName: updated.model.displayName,
          provider: updated.model.provider,
        } : null,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// Delete session (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const session = await db.chatSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await db.chatSession.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
