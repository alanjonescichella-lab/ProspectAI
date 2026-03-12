"use client";

import { useState } from "react";
import { Lead } from "@/types";
import { Button } from "./ui/button";
import {
  LayoutGrid,
  List,
  Star,
  MapPin,
  Building2,
  ExternalLink,
  Phone,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

interface ResultsListProps {
  results: Lead[];
  onSelectLead: (lead: Lead) => void;
  onBack: () => void;
}

export function ResultsList({
  results,
  onSelectLead,
  onBack,
}: ResultsListProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prospectai-view-mode");
      if (saved === "card" || saved === "table") {
        return saved;
      }
    }
    return "card";
  });
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedResults = results.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const toggleViewMode = (mode: "card" | "table") => {
    setViewMode(mode);
    localStorage.setItem("prospectai-view-mode", mode);
  };

  const getScoreColor = (score: number) => {
    if (score <= 30)
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (score <= 60) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  const getScoreLabel = (score: number) => {
    if (score <= 30) return "Baixa";
    if (score <= 60) return "Média";
    return "Alta";
  };

  const exportCSV = () => {
    const headers = [
      "Nome",
      "Endereço",
      "Cidade",
      "Estado",
      "Avaliação",
      "Nº Avaliações",
      "Tipo",
      "Telefone",
      "Website",
      "Google Maps",
      "Score",
      "Oportunidade",
      "Resumo IA",
    ];

    const rows = results.map((lead) => [
      lead.name,
      lead.address,
      lead.city,
      lead.state,
      lead.rating ?? "",
      lead.userRatingCount ?? 0,
      lead.primaryType?.replace(/_/g, " ") ?? "",
      lead.nationalPhoneNumber ?? "",
      lead.websiteUri ?? "",
      lead.googleMapsUri ?? "",
      lead.digitalPainScore,
      getScoreLabel(lead.digitalPainScore),
      `"${(lead.aiSummary || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prospect-ai-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-2 -ml-4 text-slate-500"
          >
            &larr; Nova Busca
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">
            {results.length} Leads Encontrados
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {results.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCSV} className="bg-white">
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Exportar CSV
            </Button>
          )}

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => toggleViewMode("card")}
              aria-label="Visualização em Cards"
              aria-pressed={viewMode === "card"}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "card"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => toggleViewMode("table")}
              aria-label="Visualização em Tabela"
              aria-pressed={viewMode === "table"}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "table"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              <List className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum lead encontrado</h3>
          <p className="text-slate-500 mb-6 max-w-md">
            Não encontramos leads para esses critérios. Tente ampliar a localização ou ajustar o ICP.
          </p>
          <Button onClick={onBack}>Refinar Busca</Button>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedResults.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2">
                    {lead.name}
                  </h3>
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ml-3",
                      getScoreColor(lead.digitalPainScore),
                    )}
                    title={getScoreLabel(lead.digitalPainScore) + " Oportunidade"}
                  >
                    {lead.digitalPainScore} — {getScoreLabel(lead.digitalPainScore)}
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {lead.primaryType?.replace(/_/g, " ") || "Negócio Local"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {lead.city}, {lead.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400" aria-hidden="true" />
                    <span>
                      {lead.rating || "N/A"} ({lead.userRatingCount || 0}{" "}
                      avaliações)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <p className="text-sm text-slate-700 italic line-clamp-3">
                    &quot;{lead.aiSummary}&quot;
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <Button className="w-full" onClick={() => onSelectLead(lead)}>
                  Ver Relatório Completo
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Local</th>
                <th className="px-6 py-4 font-medium">Avaliação</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Contato</th>
                <th className="px-6 py-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td
                    className="px-6 py-4 font-medium text-slate-900 max-w-[200px] truncate"
                    title={lead.name}
                  >
                    {lead.name}
                    <div className="text-xs text-slate-500 font-normal mt-1">
                      {lead.primaryType?.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    {lead.city}, {lead.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                      <span className="font-medium">{lead.rating || "-"}</span>
                      <span className="text-slate-400 text-xs">
                        ({lead.userRatingCount || 0})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={cn(
                        "inline-flex px-2 py-1 rounded text-xs font-medium border",
                        getScoreColor(lead.digitalPainScore),
                      )}
                    >
                      {lead.digitalPainScore} — {getScoreLabel(lead.digitalPainScore)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {lead.nationalPhoneNumber ? (
                        <a
                          href={`tel:${lead.nationalPhoneNumber}`}
                          className="text-slate-400 hover:text-blue-600"
                          title={lead.nationalPhoneNumber}
                          aria-label={`Ligar para ${lead.nationalPhoneNumber}`}
                        >
                          <Phone className="w-4 h-4" aria-hidden="true" />
                        </a>
                      ) : (
                        <Phone className="w-4 h-4 text-slate-200" aria-hidden="true" />
                      )}
                      {lead.websiteUri ? (
                        <a
                          href={lead.websiteUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-blue-600"
                          aria-label={`Abrir website de ${lead.name}`}
                        >
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        </a>
                      ) : (
                        <ExternalLink className="w-4 h-4 text-slate-200" aria-hidden="true" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectLead(lead)}
                    >
                      Relatório
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
          <span className="text-sm text-slate-600 px-3">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
