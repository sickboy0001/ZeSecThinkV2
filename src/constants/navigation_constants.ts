import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  PieChart,
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Posts", href: "/zst/posts", icon: ClipboardList },
  { name: "Logs", href: "/zst/logs", icon: Settings },
  { name: "Analytics", href: "/zst/analytics", icon: PieChart },
  { name: "Tags", href: "/zst/tags", icon: PieChart },
  // { name: "Convert", href: "/convert", icon: PieChart },
  { name: "GeminiTypo", href: "/zst/gemini-typo", icon: PieChart },
];
