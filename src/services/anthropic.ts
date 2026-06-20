import type { Deck } from '../types';

export async function analyzeDeckWithClaude(deck: Deck, apiKey: string): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('A chave de API da Anthropic não foi configurada. Por favor, adicione-a nas Configurações.');
  }
  if (!deck.leader) {
    throw new Error('O deck precisa ter um Líder selecionado para ser analisado.');
  }

  const leaderInfo = `${deck.leader.card_name} (${deck.leader.card_set_id}) — Cor: ${deck.leader.card_color}, Vida: ${deck.leader.life ?? 'N/A'}`;

  const cardEntries = Object.values(deck.cards);
  const totalCards = cardEntries.reduce((sum, e) => sum + e.count, 0);

  const cardList = cardEntries
    .map(e => `- ${e.count}x ${e.card.card_name} (${e.card.card_set_id}) | Tipo: ${e.card.card_type} | Custo: ${e.card.card_cost ?? 0} | Poder: ${e.card.card_power ?? 'N/A'} | Counter: ${e.card.counter_amount ?? 0}`)
    .join('\n');

  const costDistribution: Record<string, number> = {};
  cardEntries.forEach(e => {
    const cost = e.card.card_cost ?? '0';
    costDistribution[cost] = (costDistribution[cost] ?? 0) + e.count;
  });
  const curva = Object.entries(costDistribution)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([cost, count]) => `  Custo ${cost}: ${count} cartas`)
    .join('\n');

  const prompt = `Você é um especialista em One Piece Card Game (OPTCG). Analise o deck abaixo e forneça uma análise estratégica completa em português do Brasil.

## Deck para Análise

**Líder:** ${leaderInfo}
**Total de cartas:** ${totalCards}/50

**Lista de cartas:**
${cardList}

**Curva de Custo Don!!:**
${curva}

---

Por favor, forneça uma análise estruturada com as seguintes seções:

### 1. Pontuação Geral
Atribua uma nota de 1 a 10 e justifique brevemente.

### 2. Pontos Fortes
Liste de 3 a 5 pontos fortes do deck.

### 3. Fraquezas e Pontos de Melhoria
Liste de 3 a 5 pontos fracos ou riscos.

### 4. Análise da Curva de Don!!
Avalie se a curva de custo está balanceada para o estilo de jogo do Líder (agressivo, controle, médio).

### 5. Sugestões de Substituição
Sugira até 3 substituições concretas (carta atual → carta sugerida), explicando o motivo.

### 6. Resumo Final
Uma conclusão de 2 a 3 frases sobre o potencial competitivo do deck.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Chave de API inválida. Verifique sua chave no Console da Anthropic.');
    }
    const errorBody = await response.text();
    throw new Error(`Erro da API Anthropic (${response.status}): ${errorBody}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const textBlock = data.content.find(block => block.type === 'text');
  if (!textBlock) {
    throw new Error('A API Anthropic retornou uma resposta inesperada.');
  }
  return textBlock.text;
}
