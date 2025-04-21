import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
  }

  interface Session {
    user: User;
  }
} 