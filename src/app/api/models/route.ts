// MFXAI Chat - Models API
// Get available AI models

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all active models
export async function GET(request: NextRequest) {
  try {
    const models = await db.chatModel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const chatModels = models.filter(m => m.type === 'chat' || m.type === 'multimodal');
    const imageModels = models.filter(m => m.type === 'image');
    const multimodalModels = models.filter(m => m.type === 'multimodal');

    return NextResponse.json({
      success: true,
      models: {
        chatModels: chatModels.map(m => ({
          id: m.id,
          name: m.name,
          displayName: m.displayName,
          provider: m.provider,
          type: m.type,
          capabilities: m.capabilities ? JSON.parse(m.capabilities) : [],
          maxTokens: m.maxTokens,
        })),
        imageModels: imageModels.map(m => ({
          id: m.id,
          name: m.name,
          displayName: m.displayName,
          provider: m.provider,
          type: m.type,
        })),
        multimodalModels: multimodalModels.map(m => ({
          id: m.id,
          name: m.name,
          displayName: m.displayName,
          provider: m.provider,
          type: m.type,
          capabilities: m.capabilities ? JSON.parse(m.capabilities) : [],
          maxTokens: m.maxTokens,
        })),
      },
    });
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { error: 'Failed to get models' },
      { status: 500 }
    );
  }
}
