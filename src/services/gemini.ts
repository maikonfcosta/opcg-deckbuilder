import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Deck } from '../types';

/**
 * Envia o deck para a API do Gemini analisar e trazer insights de melhoria
 */
export async function analyzeDeckWithGemini(deck: Deck, apiKey: string): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('A chave de API do Gemini não foi configurada. Por favor, adicione-a nas Configurações.');
  }

  if (!deck.leader) {
    throw new Error('O deck precisa ter um Líder selecionado para ser analisado.');
  }

  // Prepara as informações do deck em texto estruturado para a IA
  const leaderInfo = `Líder: ${deck.leader.card_name} (${deck.leader.card_set_id})
- Cor: ${deck.leader.card_color}
- Poder: ${deck.leader.card_power}
- Efeito: ${deck.leader.card_text}`;

  const cardList = Object.values(deck.cards)
    .map(entry => {
      const c = entry.card;
      return `- ${entry.count}x ${c.card_name} (${c.card_set_id}) [Custo: ${c.card_cost || 'N/A'}, Poder: ${c.card_power || 'N/A'}, Counter: +${c.counter_amount || 0}, Tipo: ${c.card_type}, Subtipos: ${c.sub_types}]
  Efeito: ${c.card_text}`;
    })
    .join('\n');

  // Calcula estatísticas básicas de apoio para a IA
  const totalCards = Object.values(deck.cards).reduce((sum, entry) => sum + entry.count, 0);
  const costDistribution = Object.values(deck.cards).reduce((acc: { [key: string]: number }, entry) => {
    const cost = entry.card.card_cost || '0';
    acc[cost] = (acc[cost] || 0) + entry.count;
    return acc;
  }, {});

  const typeDistribution = Object.values(deck.cards).reduce((acc: { [key: string]: number }, entry) => {
    const type = entry.card.card_type;
    acc[type] = (acc[type] || 0) + entry.count;
    return acc;
  }, {});

  const counterDistribution = Object.values(deck.cards).reduce((acc: { [key: string]: number }, entry) => {
    const counter = entry.card.counter_amount?.toString() || '0';
    acc[counter] = (acc[counter] || 0) + entry.count;
    return acc;
  }, {});

  const statsSummary = `Estatísticas do Deck:
- Total de Cartas: ${totalCards} (Líder não conta nas 50 cartas do deck principal)
- Curva de Don!! (Custo): ${JSON.stringify(costDistribution)}
- Distribuição de Tipo: ${JSON.stringify(typeDistribution)}
- Distribuição de Counters: ${JSON.stringify(counterDistribution)}`;

  // Constrói o prompt detalhado para a IA
  const prompt = `Você é um jogador profissional de One Piece Card Game (OPCG) altamente experiente e estrategista de torneios competitivos.
Sua tarefa é analisar o deck fornecido abaixo e fornecer um relatório detalhado de análise, com insights táticos e sugestões claras de melhoria.

Aqui estão as informações do deck:

${leaderInfo}

${statsSummary}

Lista de Cartas do Deck:
${cardList}

Por favor, estruture seu relatório em português brasileiro (PT-BR) usando Markdown formatado de forma limpa e moderna com os seguintes tópicos:

### 🌟 Pontuação do Deck
Forneça uma nota de 0 a 10 para o deck baseando-se em sua consistência, sinergia com o líder e viabilidade no meta-game atual do OPCG. Justifique brevemente a nota.

### ⚔️ Forças do Deck
Liste de 2 a 3 pontos fortes. Analise as principais sinergias entre as cartas e o líder (como efeitos de compra, combos de ataque, proteção ou controle).

### 🛡️ Fraquezas & Vulnerabilidades
Liste de 2 a 3 pontos fracos ou vulnerabilidades táticas (por exemplo, falta de cartas com counter +2000 para defesa, curva de custo muito pesada que pode travar sua mão no início do jogo, ou dependência excessiva de uma única carta-chave).

### 📈 Análise da Curva de Mana (Don!!) & Ritmo
Analise a curva de mana. Diga se o deck se comporta melhor como Aggro (rápido), Midrange (equilibrado) ou Control (lento/controle de mesa) e se a distribuição de custos está de acordo com essa estratégia.

### 🛠️ Sugestões de Melhorias & Substituições
Forneça recomendações cirúrgicas de cartas que poderiam ser substituídas. Diga claramente quais cartas retirar (e a quantidade) e quais cartas colocar no lugar, explicando o motivo estratégico da troca. Se possível, sugira cartas populares e fortes que combinem com a cor e os subtipos do Líder.
Use o formato:
- **Retirar:** [Quantidade]x [Nome da Carta] ([ID da Carta])
- **Adicionar:** [Quantidade]x [Nome da Carta sugerida] ([ID sugerido])
- **Motivo:** [Explicação estratégica curta]

Seja direto, tático e evite jargões excessivos não relacionados ao jogo One Piece TCG.`;

  try {
    // Inicializa o SDK do Gemini
    const ai = new GoogleGenerativeAI(apiKey);
    // Usamos o modelo recomendado gemini-2.5-flash para respostas rápidas e ótimas
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const responseText = result.response.text();
    return responseText;
  } catch (error: unknown) {
    console.error('Erro na chamada da Gemini API:', error);
    const message = error instanceof Error ? error.message : 'Falha ao conectar com o Gemini. Verifique se sua chave de API é válida.';
    throw new Error(message, { cause: error });
  }
}
