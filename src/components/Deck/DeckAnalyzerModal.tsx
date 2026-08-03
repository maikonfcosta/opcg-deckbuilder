import { useState, useEffect } from 'react';
import { X, Wand2, Key, Loader2, Trash2, Sparkles, Copy, Share2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { BANNED_CARDS, RESTRICTED_CARDS, BANNED_PAIRS } from '../../data/banlist';
import { useDialog } from '../UI/DialogContext';
import { fetchLeaderMetaStats } from '../../services/api';
import './DeckAnalyzerModal.css';

interface DeckAnalyzerModalProps {
  deck: { name: string; cards: Record<string, number> };
  allCards: any[];
  onClose: () => void;
  onUpdateDeck?: (newCards: Record<string, number>) => void;
}

export function DeckAnalyzerModal({ deck, allCards, onClose, onUpdateDeck }: DeckAnalyzerModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState('');
  const { showAlert } = useDialog();

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setHasKey(true);
    }
  }, []);

  const saveKey = () => {
    if (apiKey.trim().length > 10) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setHasKey(true);
      setError('');
    } else {
      setError('Por favor, insira uma chave de API válida.');
    }
  };

  const removeKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setHasKey(false);
    setAnalysis('');
  };

  const analyzeDeck = async () => {
    if (!hasKey || !apiKey) return;
    
    setIsAnalyzing(true);
    setAnalysis('');
    setError('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      // Preparar a lista do deck
      const cardIds = Object.keys(deck.cards).filter(id => deck.cards[id] > 0);
      let deckListText = '';
      let metaText = '';
      
      const leaderCard = allCards.find(c => c.card_type === 'Leader' && deck.cards[c.card_set_id] > 0);
      if (leaderCard) {
        deckListText += `Líder: ${leaderCard.card_name} (${leaderCard.card_set_id}) - Cor: ${leaderCard.card_color} - Efeito: ${leaderCard.card_text}\n\nCartas do Deck:\n`;
        
        try {
          const meta = await fetchLeaderMetaStats(leaderCard.card_set_id);
          if (meta && meta.win_rate !== null) {
            metaText = `\nDADOS REAIS DO META (PONEGLYPH API):\n- Win Rate do Líder: ${(meta.win_rate * 100).toFixed(1)}%\n- Participação no Meta: ${(meta.deck_share * 100).toFixed(1)}%\n`;
            if (meta.matchups && meta.matchups.length > 0) {
              const top = meta.matchups.sort((a: any, b: any) => (b.wins + b.losses) - (a.wins + a.losses)).slice(0, 3);
              metaText += `- Principais Matchups (Win Rate):\n`;
              top.forEach((m: any) => {
                const oppName = allCards.find(c => c.card_set_id === m.opponent_card_number)?.card_name || m.opponent_card_number;
                metaText += `  * vs ${oppName}: ${m.win_rate ? (m.win_rate * 100).toFixed(1) : 'N/A'}%\n`;
              });
            }
          }
        } catch (e) {
          console.warn("Could not fetch meta stats for prompt", e);
        }
      } else {
        deckListText += `Cartas do Deck:\n`;
      }

      cardIds.forEach(id => {
        const card = allCards.find(c => c.card_set_id === id);
        if (card && card.card_type !== 'Leader') {
          deckListText += `- ${deck.cards[id]}x ${card.card_name} [${card.card_set_id}] (${card.card_type}, Cost: ${card.card_cost || 0}, Power: ${card.card_power || 0}, Counter: ${card.counter_amount || 0})\n  Efeito: ${card.card_text || 'Nenhum'}\n`;
        }
      });

      const prompt = `Atue como um jogador profissional e analista de One Piece Card Game (OPCG). 
Eu construí o seguinte deck:
Nome do Deck: ${deck.name}

${deckListText}
${metaText ? `\n${metaText}\nLeve esses dados estatísticos de Win Rate e Matchups em consideração para indicar as fraquezas e pontos fortes no meta atual.\n` : ''}

Por favor, faça uma análise detalhada deste deck abordando obrigatoriamente os seguintes pontos:
1. **Estratégia Principal:** Qual é a principal condição de vitória e como o deck deve jogar.
2. **Pontos Fortes (Sinergias):** Quais cartas combam melhor entre si e quais são as maiores vantagens do deck.
3. **Fraquezas:** Quais matchups ou situações podem ser difíceis para este deck e por que.
4. **Dicas de Mulligan:** Quais cartas eu devo sempre buscar manter na mão inicial.
5. **Regras Básicas e Banlist:** Verifique se o deck possui no máximo 4 cópias da mesma carta. Verifique também a Banlist oficial (Cartas Banidas: ${BANNED_CARDS.length > 0 ? BANNED_CARDS.join(', ') : 'Nenhuma'}). Além disso, não é permitido usar os seguintes pares de cartas no mesmo deck (Banned Pairs): ${BANNED_PAIRS.map(p => p.join(' + ')).join(' | ')}. Avise detalhadamente caso o deck seja ilegal.

Responda em português do Brasil, usando formatação Markdown (com títulos, listas e negritos) para deixar a leitura agradável e direta. Não precisa inventar regras, use seu conhecimento das mecânicas de One Piece TCG baseadas nos status/efeitos listados.`;

      const generate = async (modelName: string) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContentStream(prompt);
        let fullText = '';
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          setAnalysis(fullText);
        }
      };

      try {
        await generate('gemini-3.5-flash');
      } catch (err: any) {
        if (err.message && err.message.includes('503')) {
          console.log("3.5-flash is busy, falling back to gemini-3.1-flash-lite...");
          await generate('gemini-3.1-flash-lite');
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API key not valid')) {
        setError('Erro: A sua API Key é inválida. Por favor, verifique se você copiou corretamente.');
      } else if (err.message && err.message.includes('not found')) {
        setError(`Erro de Modelo: ${err.message}. A sua conta pode não ter acesso a este modelo ainda.`);
      } else if (err.message && err.message.includes('503')) {
        setError('O servidor do Google Gemini está com muita demanda no momento (503), e os modelos de backup também falharam. Por favor, aguarde alguns segundos e tente novamente.');
      } else {
        setError(`Erro na requisição: ${err.message || 'Falha desconhecida'}. Se for erro de permissão (403), você precisa ativar a API "Generative Language API" no Google Cloud Console.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatForWhatsApp = (md: string) => {
    let text = md;
    // Converte Títulos para *TÍTULO* (Negrito no WhatsApp)
    text = text.replace(/^#+\s+(.*$)/gm, (_, p1) => `*${p1.toUpperCase()}*`);
    // Converte Negrito Markdown **texto** para Negrito WhatsApp *texto*
    text = text.replace(/\*\*([^*]+)\*\*/g, '*$1*');
    // Converte Links [texto](url) para texto: url
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2');
    return text;
  };

  const handleCopy = () => {
    const waText = formatForWhatsApp(analysis);
    navigator.clipboard.writeText(waText)
      .then(() => showAlert('Relatório copiado para a área de transferência (Formatado para WhatsApp)!', 'Copiado', 'success'))
      .catch(() => showAlert('Erro ao copiar relatório.'));
  };

  const handleShare = () => {
    const waText = formatForWhatsApp(analysis);
    if (typeof navigator.share === 'function') {
      navigator.share({
        title: `Análise do Deck: ${deck.name}`,
        text: waText,
      }).catch(err => console.log('Erro ao compartilhar:', err));
    } else {
      handleCopy();
    }
  };

  // ... (autoAdjustDeck was updated correctly earlier, jumping to the render part)
  const autoAdjustDeck = async () => {
    if (!hasKey || !apiKey || !onUpdateDeck) return;
    
    setIsAdjusting(true);
    setError('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const leaderCard = allCards.find(c => c.card_type === 'Leader' && deck.cards[c.card_set_id] > 0);
      if (!leaderCard) throw new Error("Deck sem líder válido.");

      // Descobrir se o deck atual é Standard ou Extra Regulation
      const ROTATED_PREFIXES = ['OP01', 'OP02', 'OP03', 'OP04', 'ST01', 'ST02', 'ST03', 'ST04', 'ST05', 'ST06', 'ST07', 'ST08', 'ST09', 'ST10'];
      const isCardRotated = (setId: string) => ROTATED_PREFIXES.some(prefix => setId.startsWith(prefix));
      
      const hasRotatedCards = Object.keys(deck.cards).some(id => deck.cards[id] > 0 && isCardRotated(id));
      const isStandard = !hasRotatedCards;

      const leaderColors = leaderCard.card_color.split(/[\s/]+/);
      const isCardColorValid = (cardColor: string) => {
        if (!cardColor) return false;
        return leaderColors.some((lc: string) => cardColor.includes(lc.trim()));
      };

      const validCards = allCards
        .filter(c => c.card_type !== 'Leader') // O líder já é fixo, não mandar outros
        .filter(c => isCardColorValid(c.card_color))
        .filter(c => isStandard ? !isCardRotated(c.card_set_id) : true) // Se o deck for standard, só manda cartas validas
        .filter(c => !BANNED_CARDS.includes(c.card_set_id)) // Remover banidas para a IA nem ver
        .map(c => ({ id: c.card_set_id, name: c.card_name, type: c.card_type, cost: c.card_cost, counter: c.counter_amount }));

      const adjustPrompt = `Você analisou o deck "${deck.name}" e propôs melhorias.
Agora, gere a NOVA LISTA de cartas completa baseada nas suas próprias recomendações.

REGRAS DE OURO INQUEBRÁVEIS:
1. O Líder do deck DEVE SER OBRIGATORIAMENTE "${leaderCard.card_name}" (${leaderCard.card_set_id}). VOCÊ NÃO PODE TROCAR O LÍDER.
2. O deck OPCG precisa ter EXATAMENTE 1 Líder e 50 cartas no Main Deck (Total: 51 cartas contando o Líder).
3. Limite de no máximo 4 cópias da mesma carta.
4. VOCÊ SÓ PODE USAR CARTAS QUE ESTEJAM NA LISTA JSON FORNECIDA ABAIXO. NUNCA invente IDs ou use cartas fora desta lista (a lista já está filtrada para cores válidas, standard/extra, e banlist).
${RESTRICTED_CARDS.length > 0 ? `5. As seguintes cartas SÓ PODEM TER 1 CÓPIA NO MÁXIMO: ${RESTRICTED_CARDS.join(', ')}` : ''}

Catálogo de cartas legais permitidas (USE APENAS O CAMPO 'id' DESTAS CARTAS):
${JSON.stringify(validCards)}

Retorne EXCLUSIVAMENTE um objeto JSON válido representando o novo deck no seguinte formato:
{
  "cards": {
    "${leaderCard.card_set_id}": 1,
    "ID_DA_CARTA": QUANTIDADE
  }
}
NÃO RETORNE TEXTO NENHUM ANTES NEM DEPOIS DO JSON. NÃO USE BLOCOS \`\`\`json. APENAS O OBJETO VALIDÁVEL.`;

      const adjust = async (modelName: string) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(adjustPrompt);
        return result.response.text().trim();
      };

      let textResponse = '';
      try {
        textResponse = await adjust('gemini-3.5-flash');
      } catch (err: any) {
        if (err.message && err.message.includes('503')) {
          console.log("3.5-flash is busy, falling back to gemini-3.1-flash-lite...");
          textResponse = await adjust('gemini-3.1-flash-lite');
        } else {
          throw err;
        }
      }
      
      // Limpar marcações caso a IA mande ```json
      let jsonStr = textResponse;
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '');
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '');
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.cards) {
        onUpdateDeck(parsed.cards);
        showAlert('Seu deck foi atualizado magicamente pela IA!', 'Sucesso', 'success');
        onClose(); // Fechar o modal após atualizar
      } else {
        throw new Error("Formato JSON inválido.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('503')) {
        setError('A inteligência artificial está superlotada no momento (Erro 503). O modelo de backup também falhou. Tente clicar no botão novamente em alguns segundos!');
      } else {
        setError(`Erro ao auto-ajustar deck: ${err.message}`);
      }
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="analyzer-modal-overlay" onClick={onClose}>
      <div className="analyzer-modal-content" onClick={e => e.stopPropagation()}>
        <div className="analyzer-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wand2 className="analyzer-icon" />
            <h3>Análise de IA: {deck.name}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="analyzer-modal-body">
          {!hasKey ? (
            <div className="api-key-setup">
              <div className="api-key-icon-wrapper">
                <Key size={48} />
              </div>
              <h4>Configurar Inteligência Artificial</h4>
              <p>
                Para analisar seu deck usando o <strong>Google Gemini</strong> de forma gratuita, 
                você precisa informar sua Chave de API (API Key). 
                Esta chave fica salva apenas no seu navegador localmente.
              </p>
              
              <div className="api-key-input-group">
                <input 
                  type="password" 
                  placeholder="Cole sua API Key do Gemini aqui..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button className="btn-primary" onClick={saveKey}>Salvar Chave</button>
              </div>
              {error && <p className="error-msg">{error}</p>}
              
              <div className="api-key-help">
                <p>Não tem uma chave? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Pegue uma gratuitamente no Google AI Studio.</a></p>
              </div>
            </div>
          ) : (
            <div className="analysis-container">
              <div className="analysis-controls">
                <button 
                  className="btn-primary start-analysis-btn" 
                  onClick={analyzeDeck} 
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <><Loader2 className="spin" size={18} /> Analisando Deck...</>
                  ) : (
                    <><Wand2 size={18} /> Gerar Relatório de Estratégia</>
                  )}
                </button>
                
                <button className="btn-icon danger" onClick={removeKey} title="Remover API Key" style={{ padding: '8px 16px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
                  <Trash2 size={18} /> <span style={{fontSize: '12px', marginLeft: '6px'}}>Remover Key</span>
                </button>
              </div>
              
              {error && <div className="error-msg" style={{marginTop: '16px'}}>{error}</div>}

              {analysis && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px' }}>
                  {onUpdateDeck && (
                    <button className="btn-primary" title="Aplicar Melhorias Automaticamente" onClick={autoAdjustDeck} disabled={isAdjusting} style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                      {isAdjusting ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                      <span style={{ marginLeft: '6px' }}>Auto-Ajustar Deck</span>
                    </button>
                  )}
                  <button className="btn-icon" title="Copiar Análise para WhatsApp" onClick={handleCopy} style={{ background: 'var(--bg-card)', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', width: '40px', height: '40px' }}>
                    <Copy size={20} color="var(--accent)" />
                  </button>
                  {typeof navigator.share === 'function' && (
                    <button className="btn-icon" title="Compartilhar" onClick={handleShare} style={{ background: 'var(--bg-card)', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', width: '40px', height: '40px' }}>
                      <Share2 size={20} color="var(--accent)" />
                    </button>
                  )}
                </div>
              )}

              {analysis && (
                <div className="markdown-output">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              )}
              
              {!analysis && !isAnalyzing && !error && (
                <div className="analysis-empty-state">
                  <Sparkles size={32} style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <p>Clique no botão acima para que a IA analise a sinergia, curva de mana e estratégia do seu deck baseado no texto e código de cada carta.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
