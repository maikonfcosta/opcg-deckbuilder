import { useState, useMemo } from 'react';
import { 
  Search, Info, Plus, Minus, AlertTriangle, CheckCircle, Save, ArrowLeft, BarChart2, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import type { OPCard, Deck } from '../types';
import DeckStats from './DeckStats';
import GeminiAnalysis from './GeminiAnalysis';

interface DeckBuilderProps {
  currentDeck: Deck;
  allCards: OPCard[];
  loadingCards: boolean;
  onSaveDeck: () => void;
  onCancel: () => void;
  onOpenCardModal: (card: OPCard) => void;
  
  // Ações de alteração de deck
  onSelectLeader: (card: OPCard) => void;
  onClearLeader: () => void;
  onAddCard: (card: OPCard) => void;
  onRemoveCard: (cardId: string) => void;
  onRenameDeck: (newName: string) => void;

  // IA
  loadingAnalysis: boolean;
  analysisResult: string | null;
  analysisError: string | null;
  onStartAnalysis: () => void;
  onClearAnalysis: () => void;
}

type BuilderTab = 'search' | 'deck';

export default function DeckBuilder({
  currentDeck,
  allCards,
  loadingCards,
  onSaveDeck,
  onCancel,
  onOpenCardModal,
  onSelectLeader,
  onClearLeader,
  onAddCard,
  onRemoveCard,
  onRenameDeck,
  loadingAnalysis,
  analysisResult,
  analysisError,
  onStartAnalysis,
  onClearAnalysis
}: DeckBuilderProps) {
  
  // Abas para visualização Mobile
  const [activeTab, setActiveTab] = useState<BuilderTab>('search');
  
  // Filtros internos da busca no construtor
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCost, setFilterCost] = useState('All');

  // Colapsáveis no painel direito/deck
  const [showStats, setShowStats] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const totalMainCards = useMemo(() => {
    return Object.values(currentDeck.cards).reduce((sum, entry) => sum + entry.count, 0);
  }, [currentDeck]);

  // Função interna para verificação de compatibilidade de cor
  const isColorCompatible = (cardColor: string, leaderColor: string | null): boolean => {
    if (!leaderColor) return true;
    const leaderColors = leaderColor.toLowerCase().split(/[\s/,\-+]+/).map(c => c.trim());
    const cardColors = cardColor.toLowerCase().split(/[\s/,\-+]+/).map(c => c.trim());
    return cardColors.some(color => leaderColors.includes(color));
  };

  // Validação de Regras do Deck
  const deckValidation = useMemo(() => {
    const errors: string[] = [];
    if (!currentDeck.leader) {
      errors.push('O deck precisa de 1 Líder selecionado.');
    }
    if (totalMainCards !== 50) {
      errors.push(`O deck principal deve ter exatamente 50 cartas (atualmente tem ${totalMainCards}).`);
    }
    Object.values(currentDeck.cards).forEach(entry => {
      const c = entry.card;
      if (entry.count > 4) {
        errors.push(`A carta ${c.card_name} (${c.card_set_id}) possui mais de 4 cópias (${entry.count}).`);
      }
      if (currentDeck.leader && !isColorCompatible(c.card_color, currentDeck.leader.card_color)) {
        errors.push(`A carta ${c.card_name} (${c.card_color}) tem cor incompatível com o líder (${currentDeck.leader.card_color}).`);
      }
    });
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [currentDeck, totalMainCards]);

  // Agrega dados estatísticos locais
  const calculatedStats = useMemo(() => {
    const costCounts: { [key: string]: number } = {
      '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10+': 0
    };
    const typeCounts: { [key: string]: number } = { 'Character': 0, 'Event': 0, 'Stage': 0 };
    const counterCounts: { [key: string]: number } = { '0': 0, '1000': 0, '2000': 0 };

    Object.values(currentDeck.cards).forEach(entry => {
      const c = entry.card;
      const count = entry.count;
      
      // Don!! Cost
      if (c.card_cost !== null) {
        const costNum = parseInt(c.card_cost);
        if (isNaN(costNum)) costCounts['0'] += count;
        else if (costNum >= 10) costCounts['10+'] += count;
        else costCounts[costNum.toString()] += count;
      } else {
        costCounts['0'] += count;
      }

      // Card Type
      if (typeCounts[c.card_type] !== undefined) {
        typeCounts[c.card_type] += count;
      } else if (c.card_type !== 'Leader') {
        typeCounts['Character'] += count;
      }

      // Counters
      const counterVal = c.counter_amount !== null ? c.counter_amount : 0;
      if (counterVal === 2000) counterCounts['2000'] += count;
      else if (counterVal === 1000) counterCounts['1000'] += count;
      else counterCounts['0'] += count;
    });

    return { costCounts, typeCounts, counterCounts };
  }, [currentDeck]);

  // Filtros rápidos — fluxo leader-first
  const filteredCards = useMemo(() => {
    const term = searchTerm.toLowerCase();

    if (!currentDeck.leader) {
      // Passo 1: mostrar apenas Leaders, com busca opcional por nome/ID
      return allCards.filter(card => {
        if (card.card_type !== 'Leader') return false;
        if (!term) return true;
        return (
          card.card_name.toLowerCase().includes(term) ||
          card.card_set_id.toLowerCase().includes(term)
        );
      });
    }

    // Passo 2: cartas não-Leader filtradas pela cor do leader
    return allCards.filter(card => {
      if (card.card_type === 'Leader') return false;
      if (!isColorCompatible(card.card_color, currentDeck.leader!.card_color)) return false;

      if (term) {
        const matches =
          card.card_name.toLowerCase().includes(term) ||
          card.card_set_id.toLowerCase().includes(term) ||
          (card.card_text && card.card_text.toLowerCase().includes(term)) ||
          (card.sub_types && card.sub_types.toLowerCase().includes(term));
        if (!matches) return false;
      }

      if (filterType !== 'All' && card.card_type !== filterType) return false;

      if (filterCost !== 'All') {
        if (filterCost === '10+') {
          const cost = parseInt(card.card_cost || '0');
          if (isNaN(cost) || cost < 10) return false;
        } else {
          if (card.card_cost !== filterCost) return false;
        }
      }

      return true;
    });
  }, [allCards, searchTerm, filterType, filterCost, currentDeck.leader]);

  // --- Renderização de Subseções ---

  // Lado do Banco de Dados de Cartas (Filtros e Grid)
  const renderCardSelectionSection = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/20">
      {/* Banner de passo */}
      {!currentDeck.leader ? (
        <div className="px-4 py-3 bg-yellow-500/10 border-b border-yellow-500/25 flex items-center gap-2">
          <AlertTriangle className="text-yellow-400 flex-shrink-0" size={15} />
          <p className="text-xs font-bold text-yellow-300">
            Passo 1: Escolha o Líder do seu deck abaixo
          </p>
        </div>
      ) : (
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2">
          <div className="w-6 h-8 rounded overflow-hidden border border-yellow-500/40 flex-shrink-0">
            <img src={currentDeck.leader.card_image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-yellow-400 truncate">{currentDeck.leader.card_name}</p>
            <p className="text-[9px] text-slate-500">{currentDeck.leader.card_color} · Passo 2: adicione cartas ao deck</p>
          </div>
          <button
            onClick={onClearLeader}
            className="text-[9px] text-slate-500 hover:text-cyan-400 transition-colors underline whitespace-nowrap"
          >
            Trocar líder
          </button>
        </div>
      )}

      {/* Filtros de Busca Compactos */}
      <div className="p-4 bg-slate-950/95 border-b border-slate-900 flex flex-wrap gap-2 sticky top-0 z-10">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            type="text"
            placeholder={currentDeck.leader ? 'Nome, ID ou efeito...' : 'Buscar Leader por nome ou ID...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-8 py-1.5 text-xs"
          />
        </div>
        {currentDeck.leader && (
          <>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select py-1.5 px-2 text-[10px] w-28"
            >
              <option value="All">Tipos</option>
              <option value="Character">Character</option>
              <option value="Event">Event</option>
              <option value="Stage">Stage</option>
            </select>
            <select
              value={filterCost}
              onChange={(e) => setFilterCost(e.target.value)}
              className="form-select py-1.5 px-2 text-[10px] w-20"
            >
              <option value="All">Custo</option>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10+">10+</option>
            </select>
          </>
        )}
      </div>

      {/* Grid de Cartas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {loadingCards ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-400">Carregando cartas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredCards.slice(0, 80).map(card => {
              const countInDeck = currentDeck.cards[card.card_set_id]?.count || 0;
              const isLeader = card.card_type === 'Leader';
              const isCurrentLeader = currentDeck.leader?.card_set_id === card.card_set_id;
              
              return (
                <div 
                  key={`${card.card_set_id}_${card.card_name}_${card.card_image}`}
                  className="glass-panel p-2 flex flex-col justify-between group/card relative"
                >
                  <div className="relative aspect-[2.5/3.5] rounded overflow-hidden mb-2 bg-slate-900">
                    <img src={card.card_image} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <button 
                      onClick={() => onOpenCardModal(card)}
                      className="absolute top-1 right-1 p-1 bg-black/60 border border-slate-700 hover:bg-cyan-500 hover:text-black transition-colors rounded-full z-10 opacity-0 group-hover/card:opacity-100"
                    >
                      <Info size={11} />
                    </button>

                    {countInDeck > 0 && !isLeader && (
                      <div className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 bg-cyan-500 text-black font-extrabold text-[10px] rounded shadow-md">
                        {countInDeck}x
                      </div>
                    )}

                    {isCurrentLeader && (
                      <div className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 bg-yellow-500 text-black font-extrabold text-[10px] rounded shadow-md">
                        Líder
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-200 truncate">{card.card_name}</p>
                    <div className="flex items-center justify-between mt-1 mb-2">
                      <span className="text-[9px] text-slate-500 font-bold font-mono">{card.card_set_id}</span>
                      <span className={`color-badge ${card.card_color.toLowerCase()}`} style={{ width: 8, height: 8 }} />
                    </div>

                    {isLeader ? (
                      <button 
                        onClick={() => onSelectLeader(card)}
                        className={`w-full py-1 rounded text-[10px] font-bold transition-all ${
                          isCurrentLeader 
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                            : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                        }`}
                      >
                        {isCurrentLeader ? 'Líder Selecionado' : 'Definir Líder'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => onAddCard(card)}
                        disabled={countInDeck >= 4 || totalMainCards >= 50}
                        className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 text-black rounded text-[10px] font-bold transition-all disabled:bg-slate-800 disabled:text-slate-550"
                      >
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Lado do Deck Atual (Ficha de Líder, Cartas, Estatísticas)
  const renderDeckStructureSection = () => (
    <div className="flex-1 flex flex-col p-4 space-y-6 overflow-y-auto">
      {/* Alertas de Validação */}
      {!deckValidation.isValid && (
        <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
          <p className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5">
            <AlertTriangle size={14} /> Regras Violadas:
          </p>
          <ul className="list-disc pl-4 text-[10px] text-slate-400 space-y-1">
            {deckValidation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Seção do Líder */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Líder</h4>
        {currentDeck.leader ? (
          <div 
            onClick={() => onOpenCardModal(currentDeck.leader!)}
            className="glass-panel p-3 flex items-center gap-3 border-yellow-500/25 hover:border-yellow-500/50 cursor-pointer transition-colors"
          >
            <div className="w-9 h-12 rounded border border-yellow-500/40 overflow-hidden bg-slate-900 flex-shrink-0">
              <img src={currentDeck.leader.card_image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{currentDeck.leader.card_name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{currentDeck.leader.card_set_id} | {currentDeck.leader.card_color}</p>
            </div>
            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-0.5 rounded-full font-bold">
              Leader
            </span>
          </div>
        ) : (
          <div className="border border-dashed border-slate-800 rounded-lg p-5 text-center">
            <p className="text-xs text-yellow-500/70 flex items-center justify-center gap-1.5 font-medium">
              <AlertTriangle size={14} /> Selecione o Líder na busca de cartas
            </p>
          </div>
        )}
      </div>

      {/* Lista de Cartas no Deck */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cartas Principais ({totalMainCards}/50)</h4>
        {Object.keys(currentDeck.cards).length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center border border-slate-900 rounded-lg">Seu deck está vazio.</p>
        ) : (
          <div className="space-y-2">
            {Object.values(currentDeck.cards).map(entry => (
              <div 
                key={entry.card.card_set_id} 
                className="glass-panel p-2 flex items-center justify-between gap-2 hover:border-slate-800 transition-colors"
              >
                <div 
                  className="flex items-center gap-2 min-w-0 cursor-pointer"
                  onClick={() => onOpenCardModal(entry.card)}
                >
                  <div className="w-8 h-11 rounded border border-slate-900 overflow-hidden bg-slate-900 flex-shrink-0">
                    <img src={entry.card.card_image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{entry.card.card_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold text-slate-500 font-mono">{entry.card.card_set_id}</span>
                      <span className="text-[9px] text-slate-450">Custo: {entry.card.card_cost || 0}</span>
                      <span className={`color-badge ${entry.card.card_color.toLowerCase()}`} style={{ width: 8, height: 8 }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button 
                    onClick={() => onRemoveCard(entry.card.card_set_id)}
                    className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-xs font-bold text-cyan-400 min-w-4 text-center">
                    {entry.count}
                  </span>
                  <button 
                    onClick={() => onAddCard(entry.card)}
                    disabled={entry.count >= 4 || totalMainCards >= 50}
                    className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white disabled:opacity-20"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel Estatístico Acoplado (Colapsável) */}
      <div className="border-t border-slate-900 pt-4">
        <button 
          onClick={() => setShowStats(!showStats)}
          className="flex items-center justify-between w-full py-2 text-slate-350 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <BarChart2 className="text-cyan-400" size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Estatísticas do Deck</span>
          </div>
          {showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showStats && (
          <div className="mt-3">
            <DeckStats 
              costCounts={calculatedStats.costCounts}
              typeCounts={calculatedStats.typeCounts}
              counterCounts={calculatedStats.counterCounts}
              totalCards={totalMainCards}
            />
          </div>
        )}
      </div>

      {/* Painel de Análise da IA (Colapsável) */}
      <div className="border-t border-slate-900 pt-4">
        <button 
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="flex items-center justify-between w-full py-2 text-slate-350 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="text-purple-400" size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Análise de IA & Sugestões</span>
          </div>
          {showAnalysis ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAnalysis && (
          <div className="mt-3">
            <GeminiAnalysis 
              deck={currentDeck}
              loadingAnalysis={loadingAnalysis}
              onStartAnalysis={onStartAnalysis}
              analysisResult={analysisResult}
              analysisError={analysisError}
              onClearAnalysis={onClearAnalysis}
            />
          </div>
        )}
      </div>

    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Bar do Builder */}
      <div className="bg-slate-950 border-b border-slate-900 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-900 rounded-md text-slate-400 hover:text-white transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <input 
            type="text" 
            value={currentDeck.name}
            onChange={(e) => onRenameDeck(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-cyan-500 focus:outline-none text-base md:text-lg font-bold text-slate-100 py-0.5 px-1 truncate max-w-[150px] sm:max-w-xs"
          />
          {deckValidation.isValid ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/25">
              <CheckCircle size={10} /> Válido
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 text-[10px] font-bold rounded-full border border-red-500/25">
              <AlertTriangle size={10} /> Inválido
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Se for mobile, exibe a contagem no botão de salvar ou simplificado */}
          <button 
            onClick={onSaveDeck}
            className="btn btn-primary py-1.5 px-4 text-xs font-bold shadow-md"
          >
            <Save size={14} /> Salvar
          </button>
        </div>
      </div>

      {/* Abas Seletoras Mobile (Apenas Mobile - abaixo de lg) */}
      <div className="flex lg:hidden bg-slate-950 border-b border-slate-900">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
            activeTab === 'search'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          {currentDeck.leader ? '2. Adicionar Cartas' : '1. Selecionar Líder'}
        </button>
        <button 
          onClick={() => setActiveTab('deck')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
            activeTab === 'deck' 
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' 
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          {currentDeck.leader ? '3.' : '2.'} Meu Deck ({totalMainCards}/50)
        </button>
      </div>

      {/* Corpo de Trabalho Responsivo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layout Desktop: Duas colunas sempre visíveis */}
        <div className="hidden lg:flex w-full overflow-hidden">
          <div className="w-3/5 flex flex-col overflow-hidden border-r border-slate-900">
            {renderCardSelectionSection()}
          </div>
          <div className="w-2/5 flex flex-col overflow-hidden bg-slate-950">
            {renderDeckStructureSection()}
          </div>
        </div>

        {/* Layout Mobile: Exibe apenas a aba ativa */}
        <div className="flex lg:hidden w-full overflow-hidden">
          {activeTab === 'search' ? (
            <div className="w-full flex flex-col overflow-hidden">
              {renderCardSelectionSection()}
            </div>
          ) : (
            <div className="w-full flex flex-col overflow-hidden bg-slate-950">
              {renderDeckStructureSection()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
