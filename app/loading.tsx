/** ルート遷移中のフォールバック。 */
export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
      <div
        role="status"
        aria-label="読み込み中"
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
      />
    </main>
  );
}
