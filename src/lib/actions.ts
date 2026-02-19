"use server";

import sql from "@/lib/db";
import { turso } from "./turso/turso";
import { ResultSet } from "@libsql/client";

export async function executeQuery(query: string) {
  if (!query.trim()) {
    return { success: false, error: "Query is empty" };
  }

  try {
    // sql.unsafe は生のSQL文字列を実行します。
    // SQLインジェクションのリスクがあるため、信頼できるユーザーのみが使用する管理画面等でのみ使用してください。
    const data = await sql.unsafe(query);
    // postgres.jsの結果はJSONシリアライズ可能なオブジェクトの配列です
    return { success: true, data: data };
  } catch (error: any) {
    console.error("Database execution error:", error);
    return { success: false, error: error.message };
  }
}

// Server Actionからクライアントコンポーネントへ渡せるように、シリアライズ可能な型を定義します。
// ResultSetのプロパティには、JSONでシリアライズできないbigintが含まれる可能性があるため、変換後の型を定義します。
type SerializableSQLiteResultSet = Omit<
  ResultSet,
  "lastInsertRowid" | "rows" | "toJSON"
> & {
  lastInsertRowid?: string;
  rows: any[];
};

export async function executeQueryTurso(
  query: string,
): Promise<SerializableSQLiteResultSet> {
  try {
    const rs = await turso.execute(query);

    // ResultSetImpl (クラス) をプレーンなオブジェクトに変換して返す
    return {
      columns: rs.columns,
      columnTypes: rs.columnTypes,
      // `rows` に含まれる `bigint` もシリアライズできないため、文字列に変換します。
      rows: rs.rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === "bigint" ? value.toString() : value,
          ]),
        ),
      ),
      rowsAffected: rs.rowsAffected,
      // BigIntが含まれる可能性があるため、文字列に変換しておくと安全です
      lastInsertRowid: rs.lastInsertRowid?.toString(),
    };
  } catch (e) {
    // ... (error handling)
    throw e;
  }
}
