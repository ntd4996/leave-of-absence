'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function NewLeavePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const startDate = formData.get('startDate') as string;
    const startTime = formData.get('startTime') as string;
    const endDate = formData.get('endDate') as string;
    const endTime = formData.get('endTime') as string;
    const reason = formData.get('reason') as string;
    const relatedUsers = Array.from(
      e.currentTarget.querySelectorAll<HTMLInputElement>(
        'input[name="relatedUsers"]:checked'
      )
    ).map((input) => input.value);

    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: new Date(`${startDate}T${startTime}`),
          endDate: new Date(`${endDate}T${endTime}`),
          reason,
          relatedUsers,
        }),
      });

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi tạo đơn xin nghỉ phép');
      }

      toast({
        title: 'Thành công',
        description: 'Đã tạo đơn xin nghỉ phép',
      });

      router.push('/dashboard');
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tạo đơn xin nghỉ phép</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Ngày bắt đầu
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700"
            >
              Giờ bắt đầu
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              required
              min="08:00"
              max="17:00"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              Ngày kết thúc
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700"
            >
              Giờ kết thúc
            </label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              required
              min="08:00"
              max="17:00"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700"
          >
            Lý do
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={4}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Nhập lý do xin nghỉ phép..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Người liên quan
          </label>
          <div className="space-y-2">
            {/* Placeholder for user list */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="user1"
                name="relatedUsers"
                value="user1"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="user1"
                className="ml-2 block text-sm text-gray-900"
              >
                Người dùng 1
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="user2"
                name="relatedUsers"
                value="user2"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="user2"
                className="ml-2 block text-sm text-gray-900"
              >
                Người dùng 2
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang xử lý...' : 'Tạo đơn'}
          </button>
        </div>
      </form>
    </div>
  );
} 