# OPCG LAB — Deckbuilder One Piece Card Game

Web app para montar, validar e otimizar decks de **One Piece Card Game (OPCG)**: explore o banco de cartas, monte listas seguindo as regras de torneio, visualize curvas de Don!! e estatísticas, consulte preços em BRL e receba análise tática via IA (Google Gemini).

## Funcionalidades

- **Banco de cartas** — busca por nome/ID/efeito/subtipo + filtros (cor, tipo, custo, raridade) com carregamento incremental.
- **Deck Builder** — seleção de líder, adição de cartas (máx. 4 cópias), validação de regras (1 líder + 50 cartas, compatibilidade de cor) em tempo real.
- **Estatísticas** — curva de custo (Don!!), distribuição de tipos e counters de defesa.
- **Preços** — cotações em Reais (BRL) via API LigaOnePiece.
- **Análise de IA** — relatório tático (pontuação, forças, fraquezas, sugestões de substituição) gerado pelo Gemini.
- **Persistência local** — decks e chave de API ficam no `localStorage` do navegador (sem backend).

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · lucide-react · `@google/generative-ai`

## Rodando localmente

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

## Configuração da IA (Gemini)

A análise de deck usa a API do Google Gemini com a **sua própria chave**:

1. Crie uma chave gratuita no [Google AI Studio](https://aistudio.google.com/).
2. Na app, vá em **Ajustes** e cole a chave.
3. A chave é salva apenas no `localStorage` do navegador.

> ⚠️ **Segurança:** a chave fica no cliente e a chamada ao Gemini é feita direto do navegador. Adequado para uso pessoal/local. **Não** publique uma instância compartilhada com essa arquitetura — nesse caso, mova a chamada para um proxy backend.

## APIs externas

| API | Uso |
|---|---|
| [optcgapi.com](https://www.optcgapi.com) | banco de cartas (sets, starters, promos, Don!!) |
| LigaOnePiece API | preços de mercado em BRL |
| Google Gemini | análise tática de deck |

> Nota: em ambiente de desenvolvimento, alguns endpoints externos podem retornar erro de CORS no navegador. As chamadas afetadas são tratadas com fallback gracioso (lista vazia / preço indisponível) e não quebram a aplicação.
