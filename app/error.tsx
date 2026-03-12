"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Algo deu errado
      </h2>
      <p className="text-slate-500 mb-6 max-w-md">
        {error.message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  );
}
