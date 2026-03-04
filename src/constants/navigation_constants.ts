import {
  LayoutDashboard,
  ClipboardList,
  ScrollText,
  BarChart3,
  Sparkles,
  Tags,
  FileClock,
  Settings,
  PieChart,
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Posts", href: "/zst/posts", icon: ClipboardList },
  { name: "Logs", href: "/zst/logs", icon: ScrollText },
  { name: "Analytics", href: "/zst/analytics/analytics", icon: BarChart3 },
  { name: "AI>Typo", href: "/AI/RequestTypo", icon: Sparkles },
  { name: "AI>Tags", href: "/AI/tags", icon: Tags },
];

export const dashboardNavItems = [
  {
    href: "/zst/posts",
    icon: ClipboardList,
    label: "投稿-Posts",
    adminOnly: false,
  },
  {
    href: "/zst/logs",
    icon: Settings,
    label: "記録-Logs",
    adminOnly: false,
  },
  {
    href: "/zst/analytics",
    icon: PieChart,
    label: "分析表示-Analytics",
    adminOnly: false,
  },
  {
    href: "/setting/profile",
    icon: Settings,
    label: "プロフィール設定-Setting",
    adminOnly: false,
  },
  {
    href: "/AI/log/list",
    icon: Settings,
    label: "AIログ表示-AI Log",
    adminOnly: false,
  },
  {
    href: "/admin/ailog",
    icon: FileClock,
    label: "AILog",
    adminOnly: true,
  },
  {
    href: "/admin/setting/prompt",
    icon: Settings,
    label: "SettingPrompt",
    adminOnly: true,
  },
];
