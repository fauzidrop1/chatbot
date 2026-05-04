// MFXAI Chat - Sessions API
// Session management endpoints

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all sessions for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const sessions = await db.chatSession.findMany({
      where: { userId, isActive: true },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Just get first message for preview
        },
        model: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        model: s.model ? {
          id: s.model.id,
          name: s.model.name,
          displayName: s.model.displayName,
          provider: s.model.provider,
        } : null,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s.messages.length,
      })),
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

// Create new session
export async function POST(request: NextRequest) {
  try {
    const { userId, modelId, title } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const session = await db.chatSession.create({
      data: {
        userId,
        modelId,
        title: title || 'New Chat',
      },
      include: { model: true },
    });

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
        isActive: session.isActive,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
