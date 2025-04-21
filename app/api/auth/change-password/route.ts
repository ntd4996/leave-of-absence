import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { hash, compare } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return new NextResponse('User not found', { status: 404 });
    }

    const isValid = await compare(currentPassword, user.password);

    if (!isValid) {
      return new NextResponse('Invalid current password', { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 