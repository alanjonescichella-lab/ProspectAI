"use client";

import { useState, useRef, useEffect } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultsList } from "@/components/ResultsList";
import { LeadDetail } from "@/components/LeadDetail";
import { Lead, SearchParams } from "@/types";
import { Sparkles, LogOut } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function Home() {
  const [step, setStep] = useState<"search" | "results" | "detail">("search");
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [results, setResults] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    mainRef.current?.focus();
  }, [step]);

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    setSearchParams(params);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar leads.");

      setResults(data || []);
      setStep("results");

      // Persist leads in background (non-blocking)
      if (data?.length > 0) {
        fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leads: data, search_params: params }),
        }).catch(() => {}); // Silent fail — persistence is optional
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setStep("detail");
  };

  const handleBackToSearch = () => {
    setStep("search");
    setResults([]);
    setSelectedLead(null);
  };

  const handleBackToResults = () => {
    setStep("results");
    setSelectedLead(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded">
        Pular para o conteúdo
      </a>

      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            className="flex items-center gap-2 cursor-pointer bg-transparent border-none text-white"
            onClick={handleBackToSearch}
            aria-label="Voltar ao início"
          >
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-xl tracking-tight">ProspectAI</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">
              Prospecção Inteligente B2B
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" ref={mainRef} tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 outline-none">
        {error && (
          <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Fechar mensagem de erro"
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {step === "search" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>
        )}

        {step === "results" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResultsList
              results={results}
              onSelectLead={handleSelectLead}
              onBack={handleBackToSearch}
            />
          </div>
        )}

        {step === "detail" && selectedLead && searchParams && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LeadDetail
              lead={selectedLead}
              searchParams={searchParams}
              onBack={handleBackToResults}
            />
          </div>
        )}
      </main>
    </div>
  );
}
