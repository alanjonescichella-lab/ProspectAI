"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createSupabaseBrowser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message
      );
      setIsLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.");
    setIsLoading(false);
  };

  const handleSubmit =
    mode === "login"
      ? handleLogin
      : mode === "register"
        ? handleRegister
        : handleForgotPassword;

  const title =
    mode === "login"
      ? "Entrar na sua conta"
      : mode === "register"
        ? "Criar nova conta"
        : "Recuperar senha";

  const submitLabel =
    mode === "login"
      ? "Entrar"
      : mode === "register"
        ? "Criar Conta"
        : "Enviar Email";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <span className="font-bold text-2xl text-slate-900 tracking-tight">
          ProspectAI
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-bold text-slate-900 text-center mb-6">
          {title}
        </h1>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" aria-hidden="true" />
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" aria-hidden="true" />
                Senha
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          )}

          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Aguarde...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {mode === "login" ? (
                  <LogIn className="w-4 h-4" />
                ) : mode === "register" ? (
                  <UserPlus className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {submitLabel}
              </span>
            )}
          </Button>
        </form>

        {/* Mode toggles */}
        <div className="mt-6 space-y-2 text-center text-sm">
          {mode === "login" && (
            <>
              <button
                onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                className="text-blue-600 hover:underline block w-full"
              >
                Esqueceu a senha?
              </button>
              <p className="text-slate-500">
                Não tem conta?{" "}
                <button
                  onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Criar conta
                </button>
              </p>
            </>
          )}

          {mode === "register" && (
            <p className="text-slate-500">
              Já tem conta?{" "}
              <button
                onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                className="text-blue-600 hover:underline font-medium"
              >
                Entrar
              </button>
            </p>
          )}

          {mode === "forgot" && (
            <button
              onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
              className="text-blue-600 hover:underline"
            >
              &larr; Voltar ao login
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Prospecção Inteligente B2B — Powered by Gemini AI
      </p>
    </div>
  );
}
