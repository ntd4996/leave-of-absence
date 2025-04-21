'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

interface Leave {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: {
    name: string;
  };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user && session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
    fetchLeaves();
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await fetch('/api/leaves/all');
      const data = await response.json();
      setLeaves(data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const handleLeaveAction = async (leaveId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        }),
      });

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi cập nhật đơn xin nghỉ phép');
      }

      toast({
        title: 'Thành công',
        description: `Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} đơn xin nghỉ phép`,
      });

      fetchLeaves();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đã có lỗi xảy ra, vui lòng thử lại sau',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Quản lý hệ thống</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Quản lý người dùng</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quyền
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Quản lý đơn xin nghỉ phép</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y">
              {leaves.map((leave) => (
                <div key={leave.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{leave.user.name}</p>
                      <p className="text-sm text-gray-600">
                        Từ {formatDate(new Date(leave.startDate))} đến{' '}
                        {formatDate(new Date(leave.endDate))}
                      </p>
                      <p className="mt-2">{leave.reason}</p>
                    </div>
                    <div className="flex space-x-2">
                      {leave.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleLeaveAction(leave.id, 'approve')}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 disabled:opacity-50"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleLeaveAction(leave.id, 'reject')}
                            disabled={isLoading}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 disabled:opacity-50"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {leave.status === 'APPROVED' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          Đã duyệt
                        </span>
                      )}
                      {leave.status === 'REJECTED' && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          Đã từ chối
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {leaves.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  Chưa có đơn xin nghỉ phép nào
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 