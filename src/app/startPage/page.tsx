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
  return (
    <div className="flex flex-col min-h-screen">
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
            <Button variant="ghost">ログイン</Button>
          </Link>
          <Link href="/signup">
            <Button>無料で始める</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-6 text-center space-y-8 bg-gradient-to-b from-background to-muted/50">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter max-w-3xl mx-auto">
            脳の速度を、デバイスに宿せ。
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            思考のモヤモヤを言語化し、構造化する。1分間の集中トレーニングを通じて、あなたの判断スピードを劇的に進化させます。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 h-12 px-8 text-lg">
                今すぐ始める <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 bg-background">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
            {startPageFeatures.map((feature, index) => (
              <div key={index} className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      {/* Guide Section */}
      <section id="guide" className="py-6 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <Accordion
            type="single"
            collapsible
            className="w-full bg-background p-4 sm:p-8 rounded-xl shadow-lg border"
          >
            <AccordionItem value="guide-content">
              <AccordionTrigger className="text-xl text-left font-bold hover:no-underline whitespace-nowrap">
                スタートガイドを開く
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <MarkdownRenderer>{guides_content}</MarkdownRenderer>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
