"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MarkdownRenderer } from "@/components/atoms/MarkdownRenderer";
import { guides_content } from "@/constants/page_constants";

export function AppFooter() {
  const pathname = usePathname();

  // これらのページは独自のフッターを持つか、フッターが不要なため表示しません。
  if (["/", "/login", "/signup"].includes(pathname)) {
    return null;
  }

  return (
    <footer className="py-8 px-6 border-t bg-background text-center text-sm text-muted-foreground">
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
        <div className="flex gap-6 items-center">
          <Link
            href="/privacy"
            className="hover:underline hover:text-foreground transition-colors"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/terms"
            className="hover:underline hover:text-foreground transition-colors"
          >
            利用規約
          </Link>
          <Sheet>
            <SheetTrigger className="hover:underline hover:text-foreground transition-colors">
              ガイド
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] w-full">
              <div className="max-w-3xl mx-auto h-full overflow-y-auto pb-12 px-4">
                <SheetHeader className="mb-6">
                  <SheetTitle>スタートガイド</SheetTitle>
                </SheetHeader>
                <MarkdownRenderer>{guides_content}</MarkdownRenderer>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <p>
          &copy; {new Date().getFullYear()} ZeroSecThink. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
