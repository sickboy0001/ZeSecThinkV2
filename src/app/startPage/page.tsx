import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, BarChart3, Shield } from "lucide-react";

export default function StartPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold italic">H</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Hadbit</span>
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
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter max-w-3xl mx-auto">
            習慣を記録し、
            <br className="hidden sm:inline" />
            <span className="text-primary">未来を変える</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hadbitは、あなたの毎日の小さな積み重ねを可視化し、
            目標達成をサポートする習慣化プラットフォームです。
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
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">簡単記録</h3>
              <p className="text-muted-foreground">
                ワンタップで日々の習慣を記録。 ストレスなく継続できます。
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">データ分析</h3>
              <p className="text-muted-foreground">
                継続率や達成状況をグラフで確認。 成長を実感できます。
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">プライバシー</h3>
              <p className="text-muted-foreground">
                あなたのデータは安全に保護されます。 安心してご利用ください。
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Hadbit. All rights reserved.</p>
      </footer>
    </div>
  );
}
