import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Kiểm tra người dùng đã đăng nhập
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let leaves;

    // Nếu là admin, lấy tất cả đơn nghỉ của tất cả người dùng
    if (session.user.role === 'ADMIN') {
      leaves = await prisma.leave.findMany({
        select: {
          id: true,
          reason: true,
          startDate: true,
          endDate: true,
          status: true,
          cancelReason: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc', // Sắp xếp theo thời gian bắt đầu mới nhất
        },
      });
    } 
    // Ngược lại, chỉ lấy đơn nghỉ của người dùng hiện tại
    else {
      leaves = await prisma.leave.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          reason: true,
          startDate: true,
          endDate: true,
          status: true,
          cancelReason: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc', // Sắp xếp theo thời gian bắt đầu mới nhất
        },
      });
    }

    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 