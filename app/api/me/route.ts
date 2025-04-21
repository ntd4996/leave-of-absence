import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

interface UpdateUserData {
  name: string;
  email: string;
  password?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        remainingDays: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      ...user,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const data: UpdateUserData = {
      name,
      email,
    };

    if (password) {
      data.password = await hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        remainingDays: true,
      },
    });

    return NextResponse.json({
      ...user,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 