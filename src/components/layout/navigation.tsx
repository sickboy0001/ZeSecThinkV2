"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  PieChart,
  Home,
  Menu,
  LogOut,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { logout } from "@/app/(auth)/actions";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Logs", href: "/hadbit/logs", icon: ClipboardList },
  { name: "Items", href: "/hadbit/items", icon: Settings },
  { name: "Analytics", href: "/hadbit/analytics", icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isLoggedIn = !!user;

  // スタートページや認証ページではサイドバーを表示しない
  if (["/", "/startPage", "/login", "/signup"].includes(pathname)) {
    return null;
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card/50 backdrop-blur-md h-screen sticky top-0 p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold italic">H</span>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight leading-none">
              Hadbit
            </div>
          </div>
        </div>
        {isLoggedIn && (
          <div className="text-[15px] text-muted-foreground mt-1 truncate max-w-[180px]">
            {user?.email}
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive
                      ? ""
                      : "group-hover:scale-110 transition-transform",
                  )}
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={async () => {
            if (isLoggedIn) {
              await logout();
            } else {
              router.push("/login");
            }
          }}
        >
          {isLoggedIn ? (
            <>
              <LogOut className="h-5 w-5" />
              <span>ログアウト</span>
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              <span>ログイン</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isLoggedIn = !!user;

  // スタートページや認証ページではモバイルナビを表示しない
  if (["/", "/startPage", "/login", "/signup"].includes(pathname)) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-6 left-6 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-transform active:scale-95"
          >
            <Menu className="h-7 w-7" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[280px] bg-card/95 backdrop-blur-xl border-r flex flex-col"
        >
          <SheetHeader className="text-left mb-8">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold italic">
                  H
                </span>
              </div>
              <div>
                <SheetTitle className="text-xl font-bold tracking-tight">
                  Hadbit
                </SheetTitle>
                {isLoggedIn && (
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[180px]">
                    {user?.email}
                  </div>
                )}
              </div>
            </div>
          </SheetHeader>
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("w-6 h-6", isActive ? "" : "")} />
                  <span className="font-bold text-lg">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 h-12 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={async () => {
                if (isLoggedIn) {
                  await logout();
                } else {
                  router.push("/login");
                }
              }}
            >
              {isLoggedIn ? (
                <>
                  <LogOut className="h-6 w-6" />
                  <span className="font-bold text-lg">ログアウト</span>
                </>
              ) : (
                <>
                  <LogIn className="h-6 w-6" />
                  <span className="font-bold text-lg">ログイン</span>
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
