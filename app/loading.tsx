export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center" role="status" aria-live="polite">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Carregando...</p>
    </div>
  );
}
