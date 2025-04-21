import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Kiểm tra người dùng đã đăng nhập và có quyền admin
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ admin mới có thể cập nhật trạng thái đơn nghỉ
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, cancelReason, rejectReason } = body;

    // Kiểm tra status hợp lệ
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'];
    
    console.log("Received status:", status);
    console.log("Valid statuses:", validStatuses);
    console.log("Status is valid:", validStatuses.includes(status));

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Chuyển đổi chuỗi thành enum LeaveStatus
    let leaveStatus: LeaveStatus;
    
    if (status === 'PENDING') {
      leaveStatus = LeaveStatus.PENDING;
    } else if (status === 'APPROVED') {
      leaveStatus = LeaveStatus.APPROVED;
    } else if (status === 'REJECTED') {
      leaveStatus = LeaveStatus.REJECTED;
    } else if (status === 'CANCELED') {
      leaveStatus = LeaveStatus.CANCELED;
    } else {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Kiểm tra đơn nghỉ tồn tại
    const leave = await prisma.leave.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    // Cập nhật trạng thái đơn nghỉ
    const updatedLeave = await prisma.leave.update({
      where: {
        id: params.id,
      },
      data: {
        status: leaveStatus,
        // Nếu status là CANCELED, thêm lý do hủy đơn
        ...(status === 'CANCELED' && cancelReason ? { cancelReason } : {}),
        // Nếu status là REJECTED, thêm lý do từ chối
        ...(status === 'REJECTED' && rejectReason ? { rejectReason } : {})
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error('Error updating leave status:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 