import { NextResponse } from 'next/server';

// Redirect to the new management page
export async function GET() {
  return NextResponse.redirect('/dashboard/leaves/management');
} 