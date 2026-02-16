"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { startPageFeatures, guides_content } from "@/constants/page_constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarkdownRenderer } from "@/components/atoms/MarkdownRenderer";

export default function StartPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold italic">H</span>
          </div>
          <span className="font-bold text-xl tracking-tight">ZeroSecThink</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline">ログイン</Button>
          </Link>
          <Link href="/signup">
            <Button variant="default">新規登録</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 grid md:grid-cols-2 overflow-hidden">
        {/* Hero Section */}
        <section className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 text-left space-y-8 bg-gradient-to-br from-background to-muted/50 border-r relative overflow-y-auto">
          <h1
            className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter max-w-3xl transition-all duration-700 ease-out ${
              isMounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-5"
            }`}
          >
            脳の速度を、デバイスに宿せ。
          </h1>
          <p
            className={`text-xl text-muted-foreground max-w-2xl transition-all duration-700 ease-out delay-200 ${
              isMounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-5"
            }`}
          >
            思考のモヤモヤを言語化し、構造化する。1分間の集中トレーニングを通じて、あなたの判断スピードを劇的に進化させます。
          </p>
          <div
            className={`flex items-center gap-4 transition-all duration-700 ease-out delay-300 ${
              isMounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-5"
            }`}
          >
            <Link href="/signup">
              <Button size="lg" className="gap-2 h-12 px-8 text-lg">
                今すぐ始める <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="overflow-y-auto bg-background p-6 md:p-12">
          <div className="space-y-12 max-w-2xl mx-auto">
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {startPageFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group space-y-4 p-6 rounded-xl transition-all duration-300 hover:bg-muted/50 hover:shadow-xl hover:-translate-y-2 border border-border/50 bg-card"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {/* Guide Section moved here */}
        </section>
      </main>
      <div id="guide" className="pt-8 border-t">
        <Accordion
          type="single"
          collapsible
          className="w-full bg-background p-4 sm:p-8 rounded-xl shadow-lg border"
        >
          <AccordionItem value="guide-content">
            <AccordionTrigger className="hover:no-underline">
              <div className="border-l-4 border-primary pl-4 py-1 text-left">
                <span className="text-xl font-bold">スタートガイドを開く</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <MarkdownRenderer>{guides_content}</MarkdownRenderer>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
