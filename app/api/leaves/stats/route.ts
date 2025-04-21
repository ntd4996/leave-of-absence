import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, differenceInHours } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Lấy số đơn nghỉ phép trong tháng
    const leaves = await prisma.leave.findMany({
      where: {
        userId: session.user.id,
        startDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: { 
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    // Tính tổng số giờ nghỉ đã được duyệt
    const totalHours = leaves
      .filter(leave => leave.status === 'APPROVED')
      .reduce((total, leave) => {
        return total + differenceInHours(leave.endDate, leave.startDate);
      }, 0);

    const stats = {
      pendingLeaves: leaves.filter((leave) => leave.status === 'PENDING').length,
      approvedLeaves: leaves.filter((leave) => leave.status === 'APPROVED').length,
      rejectedLeaves: leaves.filter((leave) => leave.status === 'REJECTED').length,
      totalHours,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[LEAVES_STATS]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 