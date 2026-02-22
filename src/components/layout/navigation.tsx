"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Menu,
  LogOut,
  LogIn,
  ChevronDown,
  ChevronRight,
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
import { navItems } from "@/constants/navigation_constants";
import { checkIsAdmin } from "@/lib/roleCheck";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user?.email) {
        const isAdm = await checkIsAdmin(user.email);
        setIsAdmin(isAdm);
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        const isAdm = await checkIsAdmin(session.user.email);
        setIsAdmin(isAdm);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Group navItems based on "Parent>Child" naming convention
  const groupedNavItems = useMemo(() => {
    const groups: any[] = [];
    const groupMap: Record<string, any> = {};

    const availableNavItems = navItems.filter(
      (item: any) => !item.adminOnly || isAdmin,
    );

    availableNavItems.forEach((item) => {
      if (item.name.includes(">")) {
        const [groupName, childName] = item.name.split(">");
        if (!groupMap[groupName]) {
          const group = {
            name: groupName,
            icon: item.icon, // Use the first child's icon for the group
            isGroup: true,
            children: [],
          };
          groupMap[groupName] = group;
          groups.push(group);
        }
        groupMap[groupName].children.push({
          ...item,
          name: childName.trim(),
        });
      } else {
        groups.push(item);
      }
    });
    return groups;
  }, [user, isAdmin]);

  // Auto-expand group if a child is active
  useEffect(() => {
    groupedNavItems.forEach((item) => {
      if (item.isGroup) {
        const hasActiveChild = item.children.some(
          (child: any) => child.href === pathname,
        );
        if (hasActiveChild) {
          setExpandedGroups((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [pathname, groupedNavItems]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

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
            <span className="text-primary-foreground font-bold italic">Z</span>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight leading-none">
              ZeroSecThink
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {groupedNavItems.map((item) => {
            if (item.isGroup) {
              const isExpanded = expandedGroups[item.name];
              const hasActiveChild = item.children.some(
                (child: any) => child.href === pathname,
              );

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group",
                      hasActiveChild
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          "w-5 h-5",
                          hasActiveChild
                            ? "text-primary"
                            : "group-hover:scale-110 transition-transform",
                        )}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.children.map((child: any) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                              isChildActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <child.icon className="w-4 h-4" />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
        {isLoggedIn && (
          <>
            <div className="text-sm text-muted-foreground px-2 mb-2 truncate">
              {user?.email}
            </div>
            <div className="my-2 border-t border-border/50" />
          </>
        )}
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
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user?.email) {
        const isAdm = await checkIsAdmin(user.email);
        setIsAdmin(isAdm);
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        const isAdm = await checkIsAdmin(session.user.email);
        setIsAdmin(isAdm);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Group navItems based on "Parent>Child" naming convention (Same logic as Sidebar)
  const groupedNavItems = useMemo(() => {
    const groups: any[] = [];
    const groupMap: Record<string, any> = {};

    const availableNavItems = navItems.filter(
      (item: any) => !item.adminOnly || isAdmin,
    );

    availableNavItems.forEach((item) => {
      if (item.name.includes(">")) {
        const [groupName, childName] = item.name.split(">");
        if (!groupMap[groupName]) {
          const group = {
            name: groupName,
            icon: item.icon,
            isGroup: true,
            children: [],
          };
          groupMap[groupName] = group;
          groups.push(group);
        }
        groupMap[groupName].children.push({
          ...item,
          name: childName.trim(),
        });
      } else {
        groups.push(item);
      }
    });
    return groups;
  }, [user, isAdmin]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const isLoggedIn = !!user;

  // スタートページや認証ページではモバイルナビを表示しない
  if (["/", "/startPage", "/login", "/signup"].includes(pathname)) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-6 left-6 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
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
                  ZeroSecThink
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
            {groupedNavItems.map((item) => {
              if (item.isGroup) {
                const isExpanded = expandedGroups[item.name];
                const hasActiveChild = item.children.some(
                  (child: any) => child.href === pathname,
                );

                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                        hasActiveChild
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className="w-6 h-6" />
                        <span className="font-bold text-lg">{item.name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="pl-6 space-y-1">
                        {item.children.map((child: any) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                                isChildActive
                                  ? "bg-primary/10 text-primary shadow-sm"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <child.icon className="w-5 h-5" />
                              <span className="font-medium text-base">
                                {child.name}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
                setOpen(false);
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
