"use client";

import { useState } from "react";
import { executeQueryTurso } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DbTursoTest() {
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await executeQueryTurso(query);
      setResult(res);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred.");
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
                Result ({result?.rows?.length || 0} rows)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {result.columns?.map((col: string, i: number) => (
                        <TableHead key={i} className="whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={result.columns?.length || 1}
                          className="text-center text-muted-foreground"
                        >
                          No results
                        </TableCell>
                      </TableRow>
                    ) : (
                      result.rows?.map((row: any, i: number) => (
                        <TableRow key={i}>
                          {result.columns?.map((col: string, j: number) => (
                            <TableCell key={j} className="whitespace-nowrap">
                              {typeof row[col] === "object" && row[col] !== null
                                ? JSON.stringify(row[col])
                                : String(row[col] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                <p>Rows Affected: {result.rowsAffected}</p>
                <p>Last Insert ID: {String(result.lastInsertRowid)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
