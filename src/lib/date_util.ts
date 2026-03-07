// export const formatDateToJst = (dateStr: string | undefined | null): string => {
//   if (!dateStr) return "-";

//   // 1. まずは素直に Date オブジェクトに変換する
//   // これにより "Fri Mar 06 2026..." も正しく解釈されます
//   const date = new Date(dateStr);

//   // パース失敗時のフォールバック
//   if (isNaN(date.getTime())) {
//     console.error("Invalid Date input:", dateStr);
//     return dateStr;
//   }

//   // 2. 「00:00:00」かどうかを判定 (9時間加算するかどうかのフラグ)
//   // 入力文字列に 00:00:00 が含まれているかチェック
//   const isZeroTime = /00:00:00/.test(dateStr);

//   // 3. タイムゾーンのズレを補正する
//   // JSの Date は内部的にUTCで持っています。
//   // 「JST表記の19:10」を入力すると、JSは勝手に9時間引いて「UTCの10:10」として保持します。
//   // 今回の要件は「19:10」という数字をベースにしたいので、引かれた9時間を戻し(加算)、
//   // さらに本来のJST化のために9時間を足す ＝ 【計18時間】足すと意図した数字になります。
//   // ※ただし 00:00:00 の時は、入力された日付を維持するために 9時間だけ戻します。

//   if (isZeroTime) {
//     date.setMinutes(date.getMinutes());
//   } else {
//     date.setMinutes(date.getMinutes() + Math.abs(date.getTimezoneOffset()));
//   }

//   // 4. 文字列組み立て (YYYY-MM-DD HH:mm:ss)
//   const pad = (n: number) => String(n).padStart(2, "0");

//   const yyyy = date.getFullYear();
//   const mm = pad(date.getMonth() + 1);
//   const dd = pad(date.getDate());
//   const hh = pad(date.getHours());
//   const min = pad(date.getMinutes());
//   const ss = pad(date.getSeconds());

//   const result = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

//   console.log("Format Result:", {
//     input: dateStr,
//     isZeroTime,
//     output: result,
//   });

//   return result;
// };
export const formatDateToJst = (
  dateStr: string | undefined | null,
  format: string = "yyyy-MM-dd HH:mm:ss", // デフォルトの形式
): string => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    console.error("Invalid Date input:", dateStr);
    return dateStr;
  }

  // 1. 00:00:00 かどうかの判定
  const isZeroTime = /00:00:00/.test(dateStr);

  // 2. 補正ロジック
  // JSが勝手に引いた9時間を戻す(getTimezoneOffsetはJST環境なら-540を返すので、その絶対値を足す)
  if (!isZeroTime) {
    // 00:00:00 以外はJSTにすることで、自然と９時間つかされるので時差の追加はこれ以上不要
    date.setMinutes(date.getMinutes() + Math.abs(date.getTimezoneOffset()));
  } else {
    // 00:00:00 の時は JSが引いた分だけを戻して、日付を維持する
    date.setMinutes(date.getMinutes() + Math.abs(date.getTimezoneOffset()));
  }

  // 3. 各パーツの取得
  const pad = (n: number) => String(n).padStart(2, "0");
  const parts: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };

  // 4. フォーマット文字列に基づいて置換
  // yyyy -> 2026, MM -> 03 ... と順番に書き換えます
  let result = format;
  (Object.keys(parts) as (keyof typeof parts)[]).forEach((key) => {
    result = result.replace(key, parts[key]);
  });

  return result;
};
