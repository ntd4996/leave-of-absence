import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error signing out:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 