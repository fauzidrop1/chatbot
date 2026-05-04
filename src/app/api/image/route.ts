// MFXAI Chat - Image Generation API
// DALL-E 3, Stable Diffusion, FLUX support

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateImage, getApiKey } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      modelId, 
      sessionId, 
      userId,
      size = '1024x1024'
    } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Verify user
    const user = await db.chatUser.findUnique({
      where: { id: userId },
      include: { accessCode: true },
    });

    if (!user || !user.accessCode.isActive) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check usage limit
    if (user.accessCode.usedRequests >= user.accessCode.maxRequests) {
      return NextResponse.json(
        { error: 'Usage limit reached' },
        { status: 403 }
      );
    }

    // Get model
    const model = await db.chatModel.findUnique({
      where: { id: modelId },
    });

    if (!model || !model.isActive || model.type !== 'image') {
      return NextResponse.json(
        { error: 'Image model not found or inactive' },
        { status: 404 }
      );
    }

    // Check API key
    const apiKey = getApiKey(model.provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for ${model.provider}` },
        { status: 500 }
      );
    }

    // Create or get session
    let session;
    if (sessionId) {
      session = await db.chatSession.findUnique({
        where: { id: sessionId },
      });
      
      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new session
      const title = `Image: ${prompt.slice(0, 40)}...`;
      session = await db.chatSession.create({
        data: {
          userId,
          modelId,
          title,
        },
      });
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: `Generate image: ${prompt}`,
      },
    });

    // Increment usage
    await db.chatAccessCode.update({
      where: { id: user.accessCodeId },
      data: { usedRequests: { increment: 1 } },
    });

    // Generate image
    const result = await generateImage(model.name, prompt, size);

    // Save assistant message with image URL
    const savedMessage = await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: result.url || result.base64 || '',
        model: model.name,
        metadata: JSON.stringify({ 
          type: 'image',
          prompt,
          size,
          isBase64: !!result.base64 
        }),
      },
    });

    // Update session
    await db.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: savedMessage.id,
        role: 'assistant',
        content: result.url || result.base64,
        model: model.name,
        metadata: {
          type: 'image',
          prompt,
          size,
          isBase64: !!result.base64,
        },
        createdAt: savedMessage.createdAt,
      },
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}
