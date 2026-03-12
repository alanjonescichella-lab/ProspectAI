"use client";

import { useState, useEffect } from "react";
import { Lead, SearchParams } from "@/types";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  Copy,
  MapPin,
  Phone,
  Globe,
  Star,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Markdown from "react-markdown";

interface LeadDetailProps {
  lead: Lead;
  searchParams: SearchParams;
  onBack: () => void;
}

export function LeadDetail({ lead, searchParams, onBack }: LeadDetailProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead, service: searchParams.service }),
          signal: controller.signal,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao gerar relatório.");

        setReport(data.report);
      } catch (err: any) {
        console.error("Report error:", err);
        setError(
          err.message || "Ocorreu um erro ao gerar o relatório de IA. Tente novamente.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();

    return () => controller.abort();
  }, [lead, searchParams, retryKey]);

  const copyToClipboard = () => {
    if (report) {
      // Strip markdown syntax for clean text
      const cleanText = report
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`(.*?)`/g, "$1");
      navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-500 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à Lista
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={copyToClipboard}
            disabled={!report || isLoading}
            className="bg-white"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? "Copiado!" : "Copiar Relatório"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {lead.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
              <span className="capitalize">
                {lead.primaryType?.replace(/_/g, " ")}
              </span>
              <span>•</span>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" />
                <span className="font-medium text-slate-700">
                  {lead.rating || "N/A"}
                </span>
                <span className="ml-1">({lead.userRatingCount || 0})</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{lead.address}</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                {lead.nationalPhoneNumber ? (
                  <a
                    href={`tel:${lead.nationalPhoneNumber}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {lead.nationalPhoneNumber}
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">
                    Não informado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                {lead.websiteUri ? (
                  <a
                    href={lead.websiteUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {lead.websiteUri}
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">
                    Sem website
                  </span>
                )}
              </div>

              {lead.googleMapsUri && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <a
                    href={lead.googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline flex items-center"
                  >
                    Abrir no Google Maps{" "}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-white shadow-sm">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
              Índice de Oportunidade Digital
            </h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-5xl font-bold tracking-tighter">
                {lead.digitalPainScore}
              </span>
              <span className="text-slate-400 mb-1">/ 100</span>
            </div>
            <p className="text-sm text-slate-300">
              {lead.digitalPainScore > 60
                ? "Alta oportunidade. Fortes deficiências digitais encontradas."
                : lead.digitalPainScore > 30
                  ? "Oportunidade média. Algumas melhorias necessárias."
                  : "Baixa oportunidade. Presença digital sólida."}
            </p>
          </div>
        </div>

        {/* Right Column: AI Report */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm min-h-[600px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-500 py-20">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="font-medium animate-pulse">
                  A IA está analisando o lead e gerando o relatório
                  estratégico...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-rose-500 py-20">
                <AlertCircle className="w-12 h-12" />
                <p className="font-medium">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => setRetryKey(k => k + 1)}
                >
                  Tentar Novamente
                </Button>
              </div>
            ) : report ? (
              <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-h2:text-xl prose-h2:font-bold prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 first:prose-h2:mt-0 prose-p:text-slate-600 prose-li:text-slate-600">
                <div className="markdown-body">
                  <Markdown>{report}</Markdown>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
