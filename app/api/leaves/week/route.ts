import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(now);
    friday.setDate(now.getDate() - now.getDay() + 5);
    friday.setHours(23, 59, 59, 999);

    const leaves = await prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          gte: monday,
          lte: friday,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching week leaves:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 