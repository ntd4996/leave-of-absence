import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.$executeRaw`
      UPDATE "User"
      SET "resetToken" = ${resetToken}, "resetTokenExpiry" = ${resetTokenExpiry}
      WHERE "id" = ${user.id}
    `;

    // TODO: Send email with reset token
    // For now, just return the token for testing
    return NextResponse.json({ resetToken });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const users = await prisma.$queryRaw<{id: string}[]>`
      SELECT * FROM "User"
      WHERE "resetToken" = ${token} 
      AND "resetTokenExpiry" > ${new Date()}
      LIMIT 1
    `;

    if (!users || users.length === 0) {
      return new NextResponse('Invalid or expired reset token', { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    await prisma.$executeRaw`
      UPDATE "User"
      SET "password" = ${hashedPassword}, "resetToken" = NULL, "resetTokenExpiry" = NULL
      WHERE "id" = ${users[0].id}
    `;

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 