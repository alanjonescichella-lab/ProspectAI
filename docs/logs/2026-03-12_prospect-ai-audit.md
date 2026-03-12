# ProspectAI — Relatório de Auditoria Técnica Consolidado

**Data:** 2026-03-12
**Projeto:** ProspectAI (Next.js 15.5.12 / Gemini AI / Tailwind CSS 4)
**Método:** Brownfield Discovery — 3 fases paralelas

---

## Sumário Executivo

| Fase | Score (1-10) | Principal Achado |
|------|:---:|---|
| Arquitetura | 4/10 | Ausência total de testes, CI/CD, validação de input e rate limiting |
| Dados | 3/10 | Zero persistência — todos os leads são perdidos ao fechar a aba |
| Frontend/UX | 5/10 | Múltiplas violações WCAG e dependências mortas no bundle |

**Score Consolidado: 4/10**

---

## Fase 1: Arquitetura (@architect)

### Stack Identificada
- **Framework:** Next.js 15.5.12 (App Router, Turbopack)
- **Linguagem:** TypeScript 5.9.3 (strict mode)
- **UI:** Tailwind CSS 4.1.11 + shadcn/ui primitives
- **AI:** @google/genai 1.17.0 (Gemini 2.5 Flash)
- **Deploy:** Vercel (standalone output)
- **Testes:** Nenhum
- **CI/CD:** Nenhum

### Padrões Positivos
- API routes server-side protegem a GEMINI_API_KEY
- TypeScript strict mode habilitado
- Componentes UI seguem padrão shadcn (CVA + forwardRef)
- `.gitignore` protege `.env*`

### Padrões Negativos
- `page.tsx` é um Client Component monolítico gerenciando todo o estado
- `eslint: ignoreDuringBuilds: true` silencia erros no build
- Configuração ESLint duplicada (`.eslintrc.json` + `eslint.config.mjs`)
- Dependências fantasma (motion, @hookform/resolvers, firebase-tools)

### Tabela de Débitos Arquiteturais

| # | Débito | Sev. | Área | Detalhes |
|---|--------|:---:|------|----------|
| A1 | Credenciais reais no `.env` e no build artifact `.next/standalone/` | P0 | Segurança | SERVICE_ROLE_KEY bypassa RLS. Build copia .env para standalone. |
| A2 | Supabase no `.env` mas não instalado | P0 | Infra | Credenciais sem consumidor = risco máximo, benefício zero |
| A3 | Ausência total de testes | P1 | Qualidade | Nenhum framework de teste, nenhum arquivo de teste |
| A4 | Ausência de CI/CD | P1 | Operações | Sem GitHub Actions, deploy manual sem validação |
| A5 | Sem validação de input nas API routes | P1 | Segurança | Prompt injection possível via campos do formulário |
| A6 | `eslint: ignoreDuringBuilds` | P1 | Qualidade | Erros de lint chegam a produção silenciosamente |
| A7 | Tipagem `any` disseminada | P1 | Manutenção | reviews, photos, regularOpeningHours tipados como any |
| A8 | Sem rate limiting / custo control no Gemini | P1 | Custo | Chamadas ilimitadas, sem cache, sem throttle |
| A9 | Sem `error.tsx` / `loading.tsx` (App Router) | P1 | Resiliência | Erros não capturados = tela branca |
| A10 | ESLint config duplicada | P2 | Config | .eslintrc.json + eslint.config.mjs coexistem |
| A11 | Dependências não utilizadas | P2 | Bundle | motion, @hookform/resolvers, firebase-tools |
| A12 | `window.location.reload()` como retry | P2 | UX | Destrói todo o estado da aplicação |
| A13 | `use-mobile.ts` não utilizado | P2 | Manutenção | Dead code de scaffolding |
| A14 | Sem middleware de autenticação | P2 | Segurança | API routes 100% públicas |
| A15 | `page.tsx` como Client Component monolítico | P2 | Arquitetura | Impede SSR e otimizações RSC |
| A16 | Prompt pede 100 negócios "reais" sem grounding verificável | P3 | Dados | Gemini pode alucinar negócios fictícios |
| A17 | picsum.photos no config sem uso | P3 | Config | Superfície de CSP desnecessária |
| A18 | Sem AbortController nas chamadas fetch | P3 | Confiabilidade | Memory leaks em unmount |

---

## Fase 2: Dados (@data-engineer)

### Fluxo de Dados Atual
```
SearchForm → POST /api/search → Gemini → JSON leads → useState (efêmero)
LeadDetail → POST /api/report → Gemini → Markdown → useState (efêmero)
```

**Persistência:** ZERO. Todos os dados vivem em React state e são perdidos ao fechar/recarregar.

### Análise de Segurança
- GEMINI_API_KEY: server-side only (OK)
- SUPABASE_SERVICE_ROLE_KEY: presente sem uso (RISCO)
- VERCEL_TOKEN: presente no .env (RISCO se exposto)
- Input validation: INEXISTENTE
- Rate limiting: INEXISTENTE
- Autenticação: INEXISTENTE
- CSP headers: INEXISTENTE

### Tabela de Débitos de Dados

| # | Débito | Sev. | Área | Detalhes |
|---|--------|:---:|------|----------|
| D1 | Credenciais reais no .env e build artifact | P0 | Segurança | Mesma credencial em .env e .next/standalone/.env |
| D2 | Sem validação/sanitização de input | P0 | Segurança | Prompt injection via campos do formulário |
| D3 | Zero persistência — dados efêmeros | P0 | Negócio | Leads perdidos ao fechar a aba. Inaceitável para B2B |
| D4 | SERVICE_ROLE_KEY sem consumidor | P1 | Segurança | Credencial privilegiada sem uso = risco puro |
| D5 | Sem rate limiting | P1 | Custo | Billing exploitation possível |
| D6 | Sem autenticação/autorização | P1 | Segurança | API routes 100% públicas |
| D7 | Objeto lead enviado inteiro pelo cliente | P1 | Segurança | Cliente pode forjar campos para prompt injection |
| D8 | Sem CSP / headers de segurança HTTP | P1 | Segurança | X-Powered-By expõe versão do Next.js |
| D9 | Tipos `any` em campos críticos | P2 | Tipagem | reviews, photos sem tipagem = bugs silenciosos |
| D10 | IDs de leads gerados pela IA | P2 | Integridade | Sem garantia de unicidade ou formato |
| D11 | Parsing Gemini sem validação de schema | P2 | Integridade | Campos ausentes = crashes silenciosos |
| D12 | Sem mecanismo de exportação (CSV/PDF) | P3 | Produto | Sem export + sem DB = dados descartados |

---

## Fase 3: Frontend/UX (@ux-design-expert)

### Inventário de Componentes

| Componente | Linhas | Responsabilidade |
|-----------|:---:|---|
| `app/page.tsx` | ~70 | Controlador de estado (search→results→detail) |
| `SearchForm.tsx` | 123 | Formulário ICP + serviço + localização |
| `ResultsList.tsx` | 254 | Lista cards/tabela com toggle |
| `LeadDetail.tsx` | 259 | Info do lead + relatório AI em markdown |
| `ui/button.tsx` | 54 | Botão CVA (6 variantes, 4 tamanhos) |
| `ui/input.tsx` | 23 | Input estilizado |
| `ui/textarea.tsx` | 22 | Textarea estilizado |

### Paleta de Cores

| Cor | Uso | Contraste c/ branco |
|-----|-----|:---:|
| `blue-600` (#2563EB) | Primária, botões, links | 4.6:1 (AA) |
| `slate-900` (#0F172A) | Header, textos | 15.4:1 (AAA) |
| `amber-400` (#FBBF24) | Rating stars | 1.7:1 (FAIL) |
| `rose-500` (#F43F5E) | Erros, scores altos | 4.2:1 (AA) |
| `emerald-500` (#10B981) | Scores baixos | 3.0:1 (FAIL) |

### Tabela de Débitos Frontend/UX

| # | Débito | Sev. | Área | Detalhes |
|---|--------|:---:|------|----------|
| F1 | Score depende exclusivamente de cor | P0 | Acessibilidade | Daltonismo impede distinção dos níveis |
| F2 | Botões icon-only sem aria-label | P0 | Acessibilidade | Toggle card/tabela invisível para screen readers |
| F3 | Sem gerenciamento de foco nas transições | P0 | Acessibilidade | Foco se perde ao trocar de etapa |
| F4 | `<div>` clicável sem semântica de botão | P0 | Acessibilidade | Logo clicável não acessível via teclado |
| F5 | Sem skip-to-content link | P1 | Acessibilidade | WCAG 2.4.1 — Bypass Blocks |
| F6 | `<select>` sem htmlFor/id | P1 | Acessibilidade | Label não associada ao campo |
| F7 | Labels sem htmlFor em todos os campos | P1 | Acessibilidade | Nenhum campo do form tem associação |
| F8 | `window.location.reload()` como retry | P1 | UX | Perde todo o contexto de busca |
| F9 | Sem empty state (0 resultados) | P1 | UX | Grid/tabela vazia sem mensagem |
| F10 | Sem design tokens centralizados | P2 | Design System | Cores hardcoded em 4+ componentes |
| F11 | motion instalado mas não usado | P2 | Bundle | ~40-80KB mortos no bundle |
| F12 | use-mobile.ts não importado | P2 | Qualidade | Dead code |
| F13 | picsum.photos config sem uso | P2 | Segurança | Superfície de proxy desnecessária |
| F14 | eslint ignoreDuringBuilds | P2 | Qualidade | Lint silenciado no build |
| F15 | Sem dark mode | P2 | Design System | Paleta 100% light, sem prefers-color-scheme |
| F16 | Sem paginação na lista de resultados | P2 | Performance | 100 cards renderizados de uma vez |
| F17 | Copiar relatório copia Markdown bruto | P2 | UX | Colar em email = sintaxe markdown |
| F18 | Sem aria-live para loading/erro | P2 | Acessibilidade | Mudanças dinâmicas não anunciadas |
| F19 | Tipos `any` nos tipos centrais | P3 | Tipagem | reviews, photos sem tipo definido |
| F20 | @hookform/resolvers sem react-hook-form | P3 | Bundle | Dependência órfã |
| F21 | Textareas sem maxLength | P3 | UX/Segurança | Input ilimitado → custo Gemini |
| F22 | Inter font só com subset latin | P3 | i18n | Falta latin-ext para acentos pt-BR |
| F23 | "Pain Score" em inglês na UI pt-BR | P3 | Consistência | Terminologia mista |

---

## Consolidado: Débitos Priorizados

### P0 — Corrigir Imediatamente (7 itens)

| # | Débito | Fase | Ação |
|---|--------|------|------|
| A1/D1 | Credenciais no .env e build artifact | Arq+Dados | Rotacionar todas as chaves. Auditar git history |
| A2 | Supabase sem consumidor | Arq | Remover credenciais ou instalar @supabase/supabase-js |
| D2 | Sem validação de input nas API routes | Dados | Adicionar Zod schema validation |
| D3 | Zero persistência | Dados | Implementar Supabase ou IndexedDB como mínimo |
| F1 | Score depende só de cor | UX | Adicionar ícone/texto semântico |
| F2 | Botões icon-only sem aria-label | UX | Adicionar aria-label e aria-pressed |
| F3 | Sem foco nas transições de etapa | UX | useRef + focus() programático |
| F4 | div clicável sem semântica | UX | Substituir por `<button>` ou `<a>` |

### P1 — Corrigir Neste Sprint (14 itens)

| # | Débito | Fase | Ação |
|---|--------|------|------|
| A3 | Sem testes | Arq | Configurar Vitest + Testing Library |
| A4 | Sem CI/CD | Arq | GitHub Actions: lint, typecheck, test, build |
| A5 | Sem validação de input | Arq | Zod schemas nas API routes |
| A6 | eslint ignoreDuringBuilds | Arq | Setar false |
| A7 | Tipos `any` | Arq | Definir interfaces para reviews, photos |
| A8 | Sem rate limiting | Arq | Middleware throttle por IP |
| A9 | Sem error.tsx/loading.tsx | Arq | Criar arquivos App Router |
| D4-D8 | Segurança de dados | Dados | Auth, CSP, rate limit, headers |
| F5 | Sem skip-to-content | UX | Adicionar skip link |
| F6-F7 | Labels sem associação | UX | htmlFor/id em todos os campos |
| F8 | reload como retry | UX | Re-executar fetchReport() |
| F9 | Sem empty state | UX | Componente de 0 resultados |

### P2 — Próximo Sprint (15 itens)

| # | Débito | Fase | Ação |
|---|--------|------|------|
| A10 | ESLint config duplicada | Arq | Remover .eslintrc.json |
| A11/F11 | Dependências mortas | Arq+UX | Remover motion, @hookform/resolvers, firebase-tools |
| A13/F12 | use-mobile.ts morto | Arq+UX | Remover arquivo |
| A14 | Sem middleware auth | Arq | Implementar middleware.ts |
| A15 | page.tsx monolítico | Arq | Migrar para Server Component + Client Islands |
| D9-D11 | Tipagem e integridade | Dados | Zod post-parse, UUIDs no servidor |
| F10 | Sem design tokens | UX | Variáveis CSS + @theme Tailwind 4 |
| F13-F18 | UX/Performance | UX | Paginação, dark mode, aria-live, copy HTML |

### P3 — Backlog (8 itens)

| # | Débito | Fase | Ação |
|---|--------|------|------|
| A16 | Alucinação de leads | Arq | Verificação cruzada com Places API |
| A17-A18 | Config residual + AbortController | Arq | Limpeza |
| D12 | Sem exportação CSV/PDF | Dados | Feature de export |
| F19-F23 | Tipagem, i18n, terminologia | UX | Polimento |

---

## Roadmap Sugerido

### Sprint 1: Segurança e Fundação (P0 + P1 críticos)
- Rotacionar todas as credenciais (Supabase, Vercel, Gemini)
- Adicionar Zod validation nas API routes
- Implementar rate limiting (middleware.ts)
- Corrigir acessibilidade P0 (aria-labels, foco, semântica)
- Configurar Vitest + primeiro teste de API route
- Criar error.tsx e loading.tsx

### Sprint 2: Persistência e Qualidade (P1 restantes)
- Instalar @supabase/supabase-js e implementar persistência de leads
- Configurar GitHub Actions (lint, typecheck, test, build)
- Adicionar CSP headers no next.config.ts
- Empty state, skip-to-content, labels acessíveis
- Remover dependências mortas (motion, hookform, firebase-tools)

### Sprint 3: Polish e Escalabilidade (P2)
- Design tokens centralizados com @theme Tailwind 4
- Paginação/virtualização na lista de resultados
- Dark mode (prefers-color-scheme)
- Migrar page.tsx para Server Component + Client Islands
- Exportação CSV/PDF dos leads

---

## Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Total de arquivos fonte | 15 |
| Total de linhas (fonte) | ~900 |
| Dependências produção | 12 |
| Dependências dev | 8 |
| Dependências mortas | 3 (motion, @hookform/resolvers, firebase-tools) |
| Arquivos mortos | 2 (use-mobile.ts, .eslintrc.json) |
| Total de débitos | 44 (deduplicados: ~35 únicos) |
| P0 | 7 |
| P1 | 14 |
| P2 | 15 |
| P3 | 8 |
| Cobertura de testes | 0% |
| Score consolidado | **4/10** |

---

*Auditoria executada via Brownfield Discovery — AIOS Framework*
*Agentes: @architect, @data-engineer, @ux-design-expert*
