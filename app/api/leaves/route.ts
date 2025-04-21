import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const leaves = await prisma.leave.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        reason: true,
        startDate: true,
        endDate: true,
        status: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error('[LEAVES]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, reason, status } = body;

    // Kiểm tra startDate và endDate hợp lệ
    if (!startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Start date, end date, and reason are required' },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Đảm bảo startDate trước endDate
    if (parsedStartDate >= parsedEndDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    console.log("Session data:", JSON.stringify(session, null, 2));
    console.log("User ID from session:", session.user.id);

    // Kiểm tra xem có đơn nghỉ phép trùng thời gian không
    const overlappingLeave = await prisma.leave.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          {
            startDate: {
              lte: parsedEndDate,
            },
            endDate: {
              gte: parsedStartDate,
            },
          },
        ],
        NOT: {
          status: LeaveStatus.REJECTED,
        },
      },
    });

    if (overlappingLeave) {
      return NextResponse.json(
        { error: 'Thời gian nghỉ phép trùng với đơn đã gửi trước đó' },
        { status: 409 }
      );
    }

    // Xác định trạng thái đơn nghỉ phép
    let leaveStatus: LeaveStatus = LeaveStatus.PENDING;
    if (status && typeof status === 'string' && status.toUpperCase() === 'APPROVED') {
      leaveStatus = LeaveStatus.APPROVED;
    }

    // Tạo đơn nghỉ phép mới
    console.log("Creating leave with data:", {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      reason,
      userId: session.user.id,
      status: leaveStatus
    });

    const newLeave = await prisma.leave.create({
      data: {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        reason,
        userId: session.user.id,
        status: leaveStatus
      },
    });

    return NextResponse.json(newLeave);
  } catch (error) {
    console.error('Error creating leave:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 