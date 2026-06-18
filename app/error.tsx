"use client";

/** ルート単位のエラーバウンダリ。想定外の例外を握りつぶさず再試行導線を出す。 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-slate-800">
        エラーが発生しました
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        一時的な問題の可能性があります。再試行してください。
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-slate-400">参照 ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mx-auto mt-6 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        再試行
      </button>
    </main>
  );
}
