# OPCG Deckbuilder — Implementation Spec (Frontend / UI / UX)

> **Documento de handoff para CLI executor.** Contém diagnóstico confirmado por evidência, plano faseado, código pronto e critérios de aceite. Implemente **fase por fase**, na ordem. Não pule a P0 — ela desbloqueia tudo.
>
> **Projeto:** One Piece Card Game Deckbuilder (web app pessoal)
> **Stack:** React 19 + TypeScript 6 + Vite 8 + lucide-react + Google Gemini SDK
> **Branch deste doc:** `docs/implementation-spec`
> **Branch sugerida p/ execução:** `feature/ui-overhaul`
> **Gerado:** 19/Jun/2026 18:48 (GMT-3)

---

## 0. TL;DR (leia isto primeiro)

O app **parece pronto no código** mas está **visualmente quebrado em produção**. Causa raiz única e confirmada:

> **Todo o JSX usa classes utilitárias do Tailwind CSS (`flex`, `grid`, `w-3/5`, `text-xs`, `lg:flex`, `bg-white/90`, etc.), mas o Tailwind NÃO está instalado nem incluído via CDN.** Logo, ~90% das classes de layout/cor/tipografia são *strings inertes* — não produzem CSS.

Só funcionam as classes **CSS custom** definidas à mão em `src/index.css` (`.glass-panel`, `.btn`, `.card-grid`, `.bottom-nav`, `.form-input`, `.stats-table`, `.color-badge`...). O resto não renderiza.

**Evidência:**
```
$ ls node_modules | grep -i tailwind   → NO TAILWIND DIR
$ grep -i tailwind package.json         → (vazio)
$ grep cdn/tailwind index.html          → (nenhum script)
$ npm run build                         → ✓ built; CSS bundle = 11.11 kB
```
O bundle CSS de **11 KB** é exatamente o `index.css` escrito à mão. Um projeto Tailwind real geraria centenas de KB de utilities antes do purge. Confirma: zero Tailwind.

**Segundo problema (encadeado):** o `index.css` foi reescrito para um tema **claro "clean premium"** (fundo branco, `--text-primary: #0f172a`), mas os **componentes ainda usam classes de tema escuro** por toda parte (`bg-slate-950/70`, `text-slate-300`, `bg-cyan-500 text-black`, `text-slate-400`...). Quando o Tailwind for adicionado (P0), esses tons escuros vão **conflitar** com os painéis brancos do `index.css` → texto invisível, contraste quebrado. Precisa unificar o tema (P1).

**Terceiro:** há dezenas de classes com **shades de cor inexistentes** no Tailwind (`text-slate-350`, `text-red-650`, `border-slate-150`, `z-15`, `border-3`, `duration-355`) — não fazem nada nem depois do Tailwind instalado. São bugs silenciosos (P1).

### Ordem de execução
| Fase | Objetivo | Resultado |
|---|---|---|
| **P0** | Instalar + configurar Tailwind v4 | Layout volta a existir. App fica utilizável. |
| **P1** | Unificar tema (claro), corrigir shades inválidos, contraste | App fica visualmente coerente. |
| **P2** | UX: toasts, modal a11y, atalhos, export/import deck, cache | App fica profissional. |
| **P3** | Polimento: SEO/meta, README, microinterações, migração SDK Gemini | App fica "produção". |

---

## 1. Arquitetura atual (mapa para o executor)

```
src/
├── main.tsx                 # bootstrap React 19 StrictMode, importa index.css
├── App.tsx                  # estado global (view router por useState), header/nav, modal global
├── types.ts                 # OPCard, Deck, DeckCardEntry, AppSettings, LigaCardPrice
├── index.css                # ⭐ design system real (tokens HSL, .glass-panel, .btn, .card-grid...)
├── App.css                  # ⚠️ sobras do template Vite (.hero, #next-steps) — NÃO usado, remover
├── components/
│   ├── Dashboard.tsx        # lista de decks salvos + hero + card "criar"
│   ├── CardExplorer.tsx     # banco de cartas: busca + filtros + grid paginada
│   ├── DeckBuilder.tsx      # 2 painéis (seleção 60% / deck 40%), validação, abas mobile
│   ├── DeckStats.tsx        # tabelas custo/tipo/counter com progress bars
│   ├── GeminiAnalysis.tsx   # painel IA: estados idle/loading/error/result + markdown manual
│   ├── CardModal.tsx        # ficha técnica + preços LigaOnePiece (BRL)
│   └── Settings.tsx         # form chave Gemini → localStorage
└── services/
    ├── api.ts               # fetchAllCards (optcgapi, 4 endpoints paralelos) + fetchLigaPrices
    └── gemini.ts            # analyzeDeckWithGemini (prompt PT-BR estruturado)
```

**Roteamento:** sem React Router — `App.tsx` usa `view: 'dashboard'|'explorer'|'builder'|'settings'` em `useState`.
**Persistência:** `localStorage` (`opcg_decks`, `opcg_settings`). Sem backend.
**Dados externos:**
- `optcgapi.com/api` — banco de cartas (allSetCards / allSTCards / allPromoCards / allDonCards).
- `liga-onepiece-api.onrender.com/api` — preços em BRL.
- Gemini `gemini-2.5-flash` — análise de deck, chave do usuário client-side.

**Regras de deck (já implementadas em `DeckBuilder.tsx`):** 1 líder + exatamente 50 cartas principais; máx. 4 cópias por carta; cor da carta compatível com cor do líder.

---

## 2. Diagnóstico priorizado

### 🔴 P0 — Bloqueador: Tailwind ausente

**Sintoma:** layout colapsa. Sem flexbox/grid/spacing/responsividade. Header, painéis lado-a-lado do builder, grid de cartas, modal — todos dependem de classes Tailwind mortas.

**Arquivos afetados:** todos os `.tsx` (uso pervasivo de utilities).

**Fix:** instalar **Tailwind CSS v4** com o plugin oficial do Vite (`@tailwindcss/vite`) — abordagem v4 sem `tailwind.config.js` nem PostCSS. Ver §3.1 (passo a passo + código).

**Por que v4 e não v3:** v4 é zero-config, integra direto no Vite, e o projeto já está em Vite 8 / React 19 (stack moderna). v4 usa `@import "tailwindcss"` no CSS e `@theme` para tokens.

> ⚠️ **Validação obrigatória de docs:** antes de implementar, o executor DEVE consultar a doc atual do Tailwind v4 via Context7 MCP (`resolve-library-id "tailwindcss"` → `query-docs "install tailwind v4 with vite plugin"`). A API do v4 mudou em relação ao training data. Não confie de memória.

#### P0.1 — Sintomas confirmados em runtime (screenshot do usuário, tela "Banco de Cartas")

Dois bugs visíveis na tela `CardExplorer`, **ambos causados pela ausência de Tailwind** — mas exigem **fix defensivo em CSS puro** para serem robustos mesmo se algo no Tailwind mudar:

**(a) Imagens das cartas NÃO redimensionam (aparecem cortadas/zoomadas).**
No screenshot, cada célula mostra só o canto superior-esquerdo da arte (o círculo de custo gigante), não a carta inteira.
- **Causa:** `CardImage` (`CardExplorer.tsx:24`, `DeckBuilder.tsx:43`) aplica `className="w-full h-full object-cover"` — classes Tailwind mortas. A `<img>` renderiza no **tamanho natural** (centenas de px), ancorada no topo-esquerda, e o `overflow:hidden` do `.op-card-wrapper` (que tem `aspect-ratio: 2.5/3.5` no CSS real) corta o resto → efeito de zoom no canto.
- **Fix (CSS puro, robusto):** adicionar regra explícita no `index.css` para qualquer `<img>` dentro dos wrappers de carta, independente de utilities:
  ```css
  .op-card-wrapper img,
  .op-card-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;   /* wrapper já é 2.5/3.5 = ratio da carta, então cobre sem distorcer */
    display: block;
  }
  ```
  Manter também as utilities Tailwind (`w-full h-full object-cover`) após o P0 — a regra CSS é cinto-e-suspensório. Verificar visualmente que a carta inteira aparece (nome + arte + custo), não só o canto.

**(b) Clicar na carta abre "em outro menu", não como overlay na mesma tela.**
- **Causa:** `CardModal.tsx:20-21` usa `className="fixed inset-0 ... z-50 flex ..."` — Tailwind morto. Sem `position: fixed`, o modal **flui no fim do DOM** (renderizado após `<main>` em `App.tsx:355`) como um bloco normal empurrado para baixo → o usuário rola e vê "outra tela/menu" em vez de um overlay sobreposto.
- **Fix:** após P0 o `fixed inset-0` passa a funcionar. Para robustez (e para já corrigir antes mesmo da migração de tema), criar classe custom no `index.css`:
  ```css
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;        /* mobile: usar align-items:flex-end via media query, ver CardModal */
    justify-content: center;
    overflow-y: auto;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
  }
  ```
  e aplicar `className="modal-overlay ..."` no container do `CardModal`. Garante overlay correto independimente do Tailwind. Considerar também renderizar o modal via **React Portal** (`createPortal` em `document.body`) para escapar de qualquer `overflow` de ancestrais.

> Nota: estes dois itens são **a prova visual** do diagnóstico P0. Após instalar o Tailwind (P0) + aplicar os fixes defensivos acima, ambos se resolvem.

---

### 🟠 P1 — Coerência visual

#### P1.1 — Conflito tema claro (CSS) × tema escuro (componentes)
`index.css` define tema **claro**. Componentes usam tons **escuros**. Exemplos confirmados:

| Arquivo | Classe escura | Problema no fundo branco |
|---|---|---|
| `Dashboard.tsx:46` | `text-slate-300` no `<h2>` "Meus Decks Salvos" | título quase invisível |
| `DeckStats.tsx` | `bg-slate-900/50`, `border-slate-800`, `text-slate-400`, `bg-cyan-500 text-black` | painel escuro dentro de `.glass-panel` branco |
| `GeminiAnalysis.tsx:25` | `bg-slate-950/70`, `border-slate-900`, `text-slate-300/400` | painel preto sobre branco |
| `Settings.tsx` | `bg-purple-950/50`, `text-slate-100`, `bg-slate-950` | inputs/code escuros sobre branco |
| `App.tsx:272` | logo `from-cyan-500 to-purple-500` + `text-black` | resquício neon do tema antigo |

**Decisão de design:** **adotar o tema CLARO "clean premium"** já presente no `index.css` (é o mais recente, mais polido, e mobile-first). Migrar TODOS os componentes para a paleta clara. Ver §4 (Design System canônico) — use os tokens CSS, não hex soltos.

#### P1.2 — Shades de cor inexistentes (bugs silenciosos)
Tailwind só tem shades `50,100,...,900,950`. Estas classes **não existem** e nunca aplicam cor:

```
text-slate-350  (DeckStats ×3, GeminiAnalysis, Settings)
text-slate-450  (GeminiAnalysis)
text-slate-655  (CardModal)
text-red-650    (DeckBuilder)
text-red-750    (DeckBuilder)
border-slate-150 (CardModal ×2)
border-slate-850 (DeckStats)
z-15            (DeckBuilder ×3)   → usar z-10/z-20
border-3        (CardExplorer, DeckBuilder) → não existe; usar border-2 ou border-4
duration-355    (DeckBuilder)      → usar duration-300 ou arbitrário [355ms]
```
**Fix:** substituir por shades válidos mais próximos durante a migração de tema (§5 tem o mapa carta-a-carta).

#### P1.3 — Contraste / acessibilidade de cor
Após unificar para claro, garantir contraste AA (≥4.5:1 texto normal). Badges `cost-badge` (texto branco em `#1e293b`) OK. Revisar textos `text-slate-400/500` em fundos claros (`--text-muted: #94a3b8` é limítrofe para texto pequeno).

---

### 🟡 P2 — UX / robustez

| # | Item | Hoje | Proposta |
|---|---|---|---|
| P2.1 | Feedback de ações | `alert()` / `confirm()` nativos (`App.tsx:127,149`) | Toast não-bloqueante + modal de confirmação custom |
| P2.2 | A11y do modal | `CardModal` sem `Esc`, sem focus-trap, sem `role="dialog"`, sem retorno de foco | Adicionar `Esc` p/ fechar, trap de foco, `aria-modal`, restaurar foco ao fechar |
| P2.3 | Botões só-ícone | `Info`, `Trash2`, fechar, ±  sem `aria-label` | Adicionar `aria-label` em todos |
| P2.4 | Imagens | `alt=""` em cartas (`DeckBuilder`, Dashboard watermark) | `alt={card.card_name}` |
| P2.5 | Busca | filtra a cada tecla sobre milhares de cartas | `useDeferredValue` ou debounce 200ms |
| P2.6 | Cache do banco | refetch de 4 endpoints a cada reload | cache em `localStorage` c/ TTL (ex. 24h) + revalidação |
| P2.7 | Export/Import deck | inexistente | exportar deck como JSON / texto (lista p/ copiar), importar |
| P2.8 | Estado vazio builder | "Seu deck está vazio." simples | CTA + dica de fluxo (selecione líder → adicione 50) |
| P2.9 | Validação de cor do líder | quebra silenciosa se `card_color` vier `NULL` | guardas defensivas |
| P2.10 | Persistência do builder | sair sem salvar perde tudo, sem aviso | aviso "alterações não salvas" ao voltar |

---

### 🟢 P3 — Polimento / produção

| # | Item | Detalhe |
|---|---|---|
| P3.1 | `index.html` `<title>` genérico | → "OPCG LAB — Deckbuilder One Piece Card Game" + meta description + OG tags |
| P3.2 | `README.md` é o template Vite padrão | Reescrever: o que é, como rodar, APIs usadas, chave Gemini |
| P3.3 | `App.css` morto (sobras do template) | Remover import e arquivo |
| P3.4 | SDK Gemini deprecado | `@google/generative-ai` está descontinuado → migrar p/ `@google/genai`. Validar via Context7 antes. |
| P3.5 | Renderização Markdown manual em `GeminiAnalysis` | split por `\n` + regex frágil → considerar `react-markdown` (leve) |
| P3.6 | Microinterações | hover/focus states já parciais no CSS; uniformizar transições e `:focus-visible` p/ teclado |
| P3.7 | Erro de carga do banco | só `CardExplorer` mostra erro; `DeckBuilder` não trata `errorCards` | propagar estado de erro ao builder |
| P3.8 | `h-[calc(100vh-64px)]` no builder | no mobile o header some (view===builder) → restam 64px de gap fantasma | usar `100dvh` e ajustar p/ mobile |

---

## 3. Plano de execução — código pronto

### 3.1 P0 — Instalar Tailwind v4 (Vite plugin)

> Consultar Context7 antes (ver aviso P0). O abaixo reflete a API v4 esperada — ajuste conforme a doc retornada.

**1. Instalar:**
```bash
npm install -D tailwindcss @tailwindcss/vite
```

**2. `vite.config.ts`** — adicionar o plugin:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**3. `src/index.css`** — `@import` de fontes deve vir primeiro, depois o tailwind:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter...&display=swap');
@import "tailwindcss";

/* mapear tokens existentes p/ o @theme do Tailwind v4,
   tornando-os disponíveis como utilities (bg-neon-blue, text-op-red, etc.) */
@theme {
  --color-neon-blue: #2563eb;
  --color-neon-purple: #7c3aed;
  --color-gold: #d97706;
  --color-op-red: #e11d48;
  --color-op-green: #059669;
  --color-op-blue: #2563eb;
  --color-op-purple: #7c3aed;
  --color-op-yellow: #d97706;
  --color-op-black: #334155;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-heading: 'Outfit', var(--font-sans);
}

/* manter o :root e todas as classes custom (.glass-panel, .btn, .card-grid...) abaixo */
```

**4. Verificar:** `npm run dev` → layout deve "ganhar vida" (header em linha, builder em 2 colunas no desktop, grid de cartas correta). `npm run build` → bundle CSS deve crescer (Tailwind purga só o usado).

**Critério de aceite P0:**
- [ ] Header desktop renderiza em linha com nav à direita.
- [ ] `DeckBuilder` desktop mostra 2 painéis lado a lado (60/40).
- [ ] Grid de cartas usa colunas responsivas.
- [ ] Bottom-nav mobile aparece só no mobile.
- [ ] **Imagem da carta aparece INTEIRA dentro da célula** (nome + arte + custo), não cortada/zoomada no canto (P0.1a).
- [ ] **Clicar numa carta abre o `CardModal` como overlay sobreposto na mesma tela** (centralizado desktop / bottom-sheet mobile), não como bloco no fim da página (P0.1b).
- [ ] `npm run build` passa; CSS bundle > 11 KB.

---

### 3.2 P1 — Unificar tema claro + corrigir shades

Migrar componente por componente para a paleta clara (§4). Estratégia de substituição (regras gerais):

| De (escuro / inválido) | Para (claro / válido) |
|---|---|
| `text-slate-300` / `text-slate-400` (títulos/labels) | `text-slate-700` / `text-slate-500` |
| `bg-slate-900/50`, `bg-slate-950/70` (painéis) | `bg-white` + `.glass-panel`, ou `bg-slate-50` |
| `border-slate-800/900` | `border-slate-200` / `border-slate-100` |
| `bg-cyan-500 text-black` (aba ativa) | `bg-blue-600 text-white` |
| `text-cyan-400` (links/destaques) | `text-blue-600` |
| gradiente `from-cyan-400 to-purple-400` | `from-blue-600 to-indigo-600` |
| `text-slate-350` | `text-slate-400` |
| `text-slate-450` | `text-slate-500` |
| `text-slate-655` | `text-slate-600` |
| `text-red-650` / `text-red-750` | `text-red-600` / `text-red-700` |
| `border-slate-150` | `border-slate-200` |
| `border-slate-850` | `border-slate-200` |
| `z-15` | `z-10` (ou `z-20` se sobre imagem) |
| `border-3` | `border-2` |
| `duration-355` | `duration-300` |

**Arquivos com maior carga de tema escuro (prioridade):** `DeckStats.tsx`, `GeminiAnalysis.tsx`, `Settings.tsx`, depois `Dashboard.tsx:46`, `App.tsx` logo.

**Critério de aceite P1:**
- [ ] Nenhuma ocorrência de shade inválido (`grep -rE "(slate|red)-(150|350|450|650|655|750|850)|z-15|border-3|duration-355" src` → vazio).
- [ ] Todo texto legível (contraste AA) sobre o fundo claro.
- [ ] `DeckStats`, `GeminiAnalysis`, `Settings` visualmente coerentes com Dashboard/Explorer.
- [ ] Sem painel escuro "ilhado" no layout claro.

---

### 3.3 P2 / P3 — ver §2 (tabelas). Implementar incrementalmente, cada item é independente.

Destaques com nota de implementação:
- **P2.1 Toast:** componente próprio leve (`useState` + portal) ou `sonner`. Substituir `alert('Deck salvo localmente!')` e `confirm('Deseja realmente excluir...')`.
- **P2.2 Modal a11y:** `useEffect` para `keydown Esc`; `ref` no painel; focar primeiro elemento no mount e restaurar `document.activeElement` anterior no unmount; `role="dialog" aria-modal="true" aria-label`.
- **P2.6 Cache:** ao buscar em `fetchAllCards`, gravar `{ts, data}` em `localStorage` (`opcg_cards_cache`); se `< 24h`, usar cache e revalidar em background.
- **P3.4 SDK Gemini:** confirmar via Context7 o pacote atual (`@google/genai`) e a chamada equivalente a `getGenerativeModel/generateContent`. Manter `gemini-2.5-flash`.

---

## 4. Design System canônico (fonte: `index.css`)

**Use sempre os tokens.** Não introduzir hex soltos.

**Cores (tema claro):**
- Fundo: `--bg-primary #f8fafc` · superfícies: `--bg-secondary #fff` / `--bg-tertiary`
- Texto: `--text-primary #0f172a` · `--text-secondary #475569` · `--text-muted #94a3b8`
- Acento primário: `--neon-blue #2563eb` · secundário: `--neon-purple #7c3aed` · `--gold #d97706`
- Cores OPCG (badges): red `#e11d48`, green `#059669`, blue `#2563eb`, purple `#7c3aed`, yellow `#d97706`, black `#334155`

**Tipografia:** corpo `Inter`; headings `Outfit` (peso 700+, `letter-spacing -0.02em`).

**Componentes prontos (classes custom — preferir a recriar com utilities):**
`.glass-panel` / `.glass-panel-neon-blue` / `.glass-panel-neon-purple` · `.btn` `.btn-primary` `.btn-secondary` `.btn-neon-purple` · `.card-grid` · `.op-card-wrapper` · `.cost-badge` `.color-badge.{cor}` · `.stats-table` · `.progress-bar-fill{.purple|.gold}` · `.form-input` `.form-select` · `.bottom-nav` `.bottom-nav-item` · `.skeleton-card` · `.animate-fade-in` `.animate-slide-up`

**Raio:** painéis 12px, botões 8px, cartas 12–14px. **Sombras:** `--shadow-lg` suave. **Transições:** `--transition-normal 0.22s cubic-bezier(.4,0,.2,1)`.

**Princípio:** seguir o guia de design do usuário (frontend-design SKILL) — visual intencional, não-template. O tema "clean premium SaaS" já estabelecido é a direção; mantê-lo consistente, com mobile-first (o CSS já é mobile-first).

---

## 5. Mapa de migração por arquivo (checklist do executor)

- [ ] **`vite.config.ts`** — add `@tailwindcss/vite` (P0)
- [ ] **`src/index.css`** — add `@import "tailwindcss"` + `@theme` (P0); add regra `.op-card-wrapper img/.op-card-container img { object-fit }` (P0.1a) + `.modal-overlay` (P0.1b)
- [ ] **`CardModal.tsx`** — aplicar `.modal-overlay` no container + considerar `createPortal` (P0.1b)
- [ ] **`CardImage` (CardExplorer.tsx + DeckBuilder.tsx)** — confirmar img cobre a célula após fix (P0.1a)
- [ ] **`src/App.tsx`** — logo gradiente neon→claro; revisar header
- [ ] **`src/App.css`** — remover arquivo (confirmar que não é importado em App.tsx) (P3.3)
- [ ] **`Dashboard.tsx`** — `text-slate-300` → `text-slate-700` (l.46); `alt=""` watermark
- [ ] **`CardExplorer.tsx`** — `border-3`→`border-2`; `bg-slate-900/10` overlay ok (sobre imagem); debounce busca (P2.5)
- [ ] **`DeckBuilder.tsx`** — `z-15`→`z-10/20` (×3); `border-3`; `duration-355`→`duration-300`; `text-red-650/750`; `alt=""`→nome; aviso unsaved (P2.10)
- [ ] **`DeckStats.tsx`** — migração de tema completa (painéis escuros→claros); `text-slate-350` (×3); `border-slate-850`; abas `bg-cyan-500 text-black`→`bg-blue-600 text-white`
- [ ] **`GeminiAnalysis.tsx`** — `bg-slate-950/70`→claro; `border-slate-900` (×3); `text-slate-350/450`; considerar `react-markdown` (P3.5)
- [ ] **`CardModal.tsx`** — `text-slate-655`; `border-slate-150` (×2); a11y Esc/focus-trap (P2.2); `aria-label` no fechar
- [ ] **`Settings.tsx`** — `bg-purple-950/50`, `bg-slate-950`, `text-slate-100`, `text-slate-350`, `border-slate-900` → tema claro
- [ ] **`services/gemini.ts`** — migrar SDK (P3.4, validar Context7)
- [ ] **`services/api.ts`** — cache localStorage (P2.6)
- [ ] **`index.html`** — title + meta (P3.1)
- [ ] **`README.md`** — reescrever (P3.2)

---

## 6. Critérios de aceite globais

1. `npm run build` passa sem erros TS.
2. `npm run lint` sem novos erros.
3. `grep -rE "(slate|red|blue|emerald)-(150|350|450|650|655|750|850)|z-15|border-3|duration-355" src` → **vazio**.
4. App renderiza corretamente em **mobile (375px)** e **desktop (≥1280px)**: header, builder 2-colunas, grid, modal, bottom-nav.
5. Sem texto invisível / baixo contraste (checar Dashboard h2, DeckStats, GeminiAnalysis, Settings).
6. Fluxo E2E manual: criar deck → escolher líder → adicionar 50 cartas → validação fica "Válido" → salvar (toast) → reabrir do Dashboard → abrir modal de carta → ver preço BRL → rodar análise IA (com chave).
7. Modal fecha com `Esc` e devolve foco.

**Verificação visual:** rodar `npm run dev` e validar com Playwright MCP (screenshots mobile + desktop por tela) — comparar antes/depois.

---

## 7. Notas de segurança

- **Chave Gemini em `localStorage` + chamada client-side:** a chave fica exposta no navegador e trafega do cliente. Aceitável para ferramenta pessoal/local, mas **não** publicar instância compartilhada com essa arquitetura. Se for hospedar público, mover a chamada Gemini para um proxy backend. Documentar a limitação no README.
- Não commitar nenhuma chave. `Settings.tsx` já trata como input do usuário — manter assim.
- APIs externas (optcgapi, liga-onepiece) são read-only e públicas — sem credenciais.

---

## 8. Riscos & decisões em aberto

| Risco | Mitigação |
|---|---|
| API v4 do Tailwind divergir do esperado | Validar via Context7 antes de codar P0 |
| `liga-onepiece-api` no Render pode estar fria (cold start) | já tratado com `catch`→`null`; adicionar timeout/loading claro |
| Migração SDK Gemini quebrar a análise | manter branch isolada; testar com chave real antes de merge (P3.4) |
| `card_color`/`card_cost` retornando string `"NULL"` | já há guardas parciais; padronizar normalização no `api.ts` |

---

## 9. Como o executor deve trabalhar

1. Criar branch `feature/ui-overhaul` a partir de `feature/design-optimization` (ou da branch base do time).
2. Implementar **P0 → P1 → P2 → P3**, **uma fase por commit** (commits atômicos, mensagem `tipo(escopo): resumo`).
3. Após cada fase, rodar `npm run build && npm run lint` e validar critérios da fase.
4. Validação visual com Playwright MCP (mobile + desktop) ao fim de P0 e P1.
5. Consultar Context7 MCP para Tailwind v4 (P0) e SDK Gemini (P3.4) — **não confiar em memória**.
6. Não fazer feature creep: implementar exatamente o escopo das tabelas.
