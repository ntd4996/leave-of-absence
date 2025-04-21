"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  User,
} from "lucide-react";

const navigation = [
  { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { name: "Nghỉ phép", href: "/dashboard/leaves", icon: FileText },
  { name: "Lịch", href: "/dashboard/calendar", icon: Calendar },
  { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/login",
    });
  };

  return (
    <div className="flex h-screen flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="text-xl font-bold">
          Nghỉ Phép
        </Link>
      </div>

      <div className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </div>

      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <User className="h-4 w-4" />
              <span className="flex-1 text-left">{session?.user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
