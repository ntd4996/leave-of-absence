import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    const leave = await prisma.leave.update({
      where: {
        id: params.id,
      },
      data: {
        status,
        approverId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    console.error('Error updating leave:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 