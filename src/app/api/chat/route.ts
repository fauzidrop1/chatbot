// MFXAI Chat - Chat API
// Multi-model chat with streaming and AbortController support

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendChatRequest, getApiKey } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      modelId, 
      sessionId, 
      userId,
      stream = true 
    } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
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

    if (!model || !model.isActive) {
      return NextResponse.json(
        { error: 'Model not found or inactive' },
        { status: 404 }
      );
    }

    // Check if API key exists
    const apiKey = getApiKey(model.provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for ${model.provider}` },
        { status: 500 }
      );
    }

    // Create or update session
    let session;
    if (sessionId) {
      session = await db.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      
      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new session
      const firstMessage = messages[messages.length - 1]?.content || 'New Chat';
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      
      session = await db.chatSession.create({
        data: {
          userId,
          modelId,
          title,
        },
        include: { messages: true },
      });
    }

    // Save user message
    const userMessage = messages[messages.length - 1];
    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: userMessage.content,
        imageUrls: userMessage.imageUrls ? JSON.stringify(userMessage.imageUrls) : null,
      },
    });

    // Increment usage
    await db.chatAccessCode.update({
      where: { id: user.accessCodeId },
      data: { usedRequests: { increment: 1 } },
    });

    // Prepare messages for AI
    const chatMessages = messages.map((m: { role: string; content: string; imageUrls?: string[] }) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      imageUrls: m.imageUrls,
    }));

    if (stream) {
      // Create streaming response
      const encoder = new TextEncoder();
      let assistantMessageId = '';
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let fullContent = '';
            
            const content = await sendChatRequest(
              model as any,
              chatMessages,
              (text) => {
                fullContent += text;
                const data = JSON.stringify({ type: 'token', text });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            );

            // Save assistant message
            const savedMessage = await db.chatMessage.create({
              data: {
                sessionId: session!.id,
                role: 'assistant',
                content: content || fullContent,
                model: model.name,
              },
            });
            assistantMessageId = savedMessage.id;

            // Update session
            await db.chatSession.update({
              where: { id: session!.id },
              data: { updatedAt: new Date() },
            });

            // Send done signal
            const doneData = JSON.stringify({ 
              type: 'done', 
              messageId: assistantMessageId,
              sessionId: session!.id,
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
            controller.close();
          } catch (error: any) {
            const errorData = JSON.stringify({ type: 'error', error: error.message });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const content = await sendChatRequest(model as any, chatMessages);
      
      // Save assistant message
      const savedMessage = await db.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content,
          model: model.name,
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
          content,
          model: model.name,
          createdAt: savedMessage.createdAt,
        },
        sessionId: session.id,
      });
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
}
