# OPCG LAB — Deckbuilder One Piece Card Game

Web app para montar, validar e otimizar decks de **One Piece Card Game (OPCG)**: explore o banco de cartas, monte listas seguindo regras oficiais de torneio, visualize curvas de Don!! e estatísticas, e receba análise tática com auto-ajuste via IA (Google Gemini).

## 🚀 Funcionalidades

- **Banco de Cartas & Catálogo** — Busca instantânea por nome/ID/efeito/subtipo com filtros avançados (cor, tipo, custo, raridade) e paginação.
- **Deck Builder & Assistente Inteligente** — Construção de decks com validação de regras em tempo real (1 líder + 50 cartas, checagem estrita de compatibilidade de cor e limite de 4 cópias).
- **Formatos e Rotação Oficial** — Suporte nativo para os formatos **Standard** (filtra automaticamente cartas do Bloco 1 rotacionadas) e **Extra Regulation** (permitido todas as cartas).
- **Banlist Integrada** — O construtor avisa e bloqueia ativamente a adição de cartas banidas, e limita a 1 cópia as cartas restritas.
- **Leaks & Novidades (Em Tempo Real)** — Feed na página inicial consumindo dados reais via RSS do Reddit (r/OnePieceTCG) exibindo os últimos vazamentos e anúncios.
- **Análise de IA (Gemini)** — Relatório tático completo focado em estratégia, sinergias, fraquezas, regras de banlist e mulligan gerado em Markdown. 
- **Auto-Ajustar Deck (IA)** — Uma das grandes inovações do laboratório: a IA ajusta fisicamente o seu deck removendo cartas mortas e consertando a curva, sendo travada numa sandbox de regras (mantém o líder, mantém as cores, respeita a rotação e a banlist oficial).
- **Exportação** — Função de copiar e compartilhar a análise do deck totalmente pré-formatada para **WhatsApp** (títulos, negritos corretos).
- **Persistência Local** — Decks e chave de API ficam no `localStorage` do navegador, mantendo seus dados seguros e offline.

## 🛠️ Stack

**React 19** · **TypeScript** · **Vite** · CSS Vanilla · **lucide-react** · `@google/generative-ai`

## 💻 Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
```

Outros scripts:

```bash
npm run build    # type-check + build de produção
npm run preview  # serve o build
npm run lint     # ESLint
```

## 🧠 Configuração da IA (Gemini)

A análise tática e o auto-ajuste de deck exigem a API do Google Gemini com a **sua própria chave**:

1. Crie uma chave gratuita no [Google AI Studio](https://aistudio.google.com/).
2. Na app, abra um de seus decks salvos e cole a chave no painel "Configurar Inteligência Artificial".
3. A chave é salva apenas no seu navegador localmente.

> ⚠️ **Segurança:** A API Key nunca viaja para servidores de terceiros, ela faz chamadas direto do seu navegador para a infraestrutura do Google.

## 📡 Integrações & APIs

| Fonte | Finalidade |
|---|---|
| [optcgapi.com](https://www.optcgapi.com) | Banco de cartas estruturado (Sets, Promos, Starters) |
| Reddit RSS | Busca de Leaks em tempo real |
| Google Gemini | Análise tática e Assistente Automático de Construtor |
