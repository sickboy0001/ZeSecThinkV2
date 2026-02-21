import {
  LayoutDashboard,
  ClipboardList,
  ScrollText,
  BarChart3,
  Sparkles,
  Tags,
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Posts", href: "/zst/posts", icon: ClipboardList },
  { name: "Logs", href: "/zst/logs", icon: ScrollText },
  { name: "Analytics", href: "/zst/analytics", icon: BarChart3 },
  { name: "AI>Typo", href: "/AI/typo", icon: Sparkles },
  { name: "AI>Tags", href: "/AI/tags", icon: Tags },
];
