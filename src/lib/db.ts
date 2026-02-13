import postgres from "postgres";

// Supabaseの「Transaction mode」か「Session mode」のURLを使用
const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, {
  prepare: false, // Supabaseのトランザクションモード(Port 6543)を使う場合はfalseを推奨
});

export default sql;
