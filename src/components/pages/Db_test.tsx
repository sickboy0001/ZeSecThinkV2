"use client";

import { useState } from "react";
import { executeQuery } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function DbTest() {
  const [query, setQuery] = useState("SELECT * FROM hadbit_logs LIMIT 10");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await executeQuery(query);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">DB Test Console</h1>
        <p className="text-muted-foreground mt-1">
          SQLクエリを直接実行して結果を確認します。
        </p>
      </header>

      <div className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter SQL query..."
            className="font-mono min-h-30"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Executing..." : "Execute Query"}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive text-lg">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-destructive font-mono">
                {error}
              </pre>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Result ({Array.isArray(result) ? result.length : 0} rows)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-muted/50 p-4 overflow-auto max-h-96">
                <pre className="text-xs font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
