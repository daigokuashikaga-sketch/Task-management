import Link from "next/link";

/** 404 ページ。 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-slate-800">
        ページが見つかりません
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        href="/"
        className="mx-auto mt-6 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        ホームへ戻る
      </Link>
    </main>
  );
}
