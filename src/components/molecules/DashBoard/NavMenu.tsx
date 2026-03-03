"use client";
import React, { useEffect, useState } from "react";
import { ClipboardList, Settings, PieChart, FileClock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkIsAdmin } from "@/lib/roleCheck";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { dashboardNavItems } from "@/constants/navigation_constants";

interface Props {
  userId: string;
}

export const NavMenu = ({ userId }: Props) => {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const checkAdminStatus = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const isAdm = await checkIsAdmin(user.email);
        setIsAdmin(isAdm);
      }
    };
    checkAdminStatus();
  }, [userId]);
  return (
    <div>
      {" "}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          {dashboardNavItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-24 flex flex-col gap-2 bg-card hover:border-primary hover:text-primary transition-all group",
                    item.adminOnly &&
                      "bg-destructive/10 hover:border-destructive hover:text-destructive border-destructive/20",
                  )}
                >
                  <item.icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};
