// MFXAI Chat - Authentication API
// Access code based authentication

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    // Find the access code
    const accessCode = await db.chatAccessCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!accessCode) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }

    if (!accessCode.isActive) {
      return NextResponse.json(
        { error: 'This access code has been deactivated' },
        { status: 403 }
      );
    }

    if (accessCode.expiresAt && new Date() > accessCode.expiresAt) {
      return NextResponse.json(
        { error: 'This access code has expired' },
        { status: 403 }
      );
    }

    if (accessCode.usedRequests >= accessCode.maxRequests) {
      return NextResponse.json(
        { error: 'This access code has reached its usage limit' },
        { status: 403 }
      );
    }

    // Check if user already exists for this access code
    let user = await db.chatUser.findFirst({
      where: { accessCodeId: accessCode.id },
      include: { accessCode: true },
    });

    // Create new user if doesn't exist
    if (!user) {
      user = await db.chatUser.create({
        data: {
          accessCodeId: accessCode.id,
        },
        include: { accessCode: true },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        accessCode: {
          id: accessCode.id,
          code: accessCode.code,
          name: accessCode.name,
          tier: accessCode.tier,
          maxRequests: accessCode.maxRequests,
          usedRequests: accessCode.usedRequests,
          expiresAt: accessCode.expiresAt,
          isActive: accessCode.isActive,
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Verify session
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const user = await db.chatUser.findUnique({
      where: { id: userId },
      include: { accessCode: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        accessCode: {
          id: user.accessCode.id,
          code: user.accessCode.code,
          name: user.accessCode.name,
          tier: user.accessCode.tier,
          maxRequests: user.accessCode.maxRequests,
          usedRequests: user.accessCode.usedRequests,
          expiresAt: user.accessCode.expiresAt,
          isActive: user.accessCode.isActive,
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
