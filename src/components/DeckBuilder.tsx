import { useState, useMemo, useRef, useDeferredValue } from 'react';
import {
  Search, Info, Plus, Minus, AlertTriangle, CheckCircle, Save, ArrowLeft, BarChart2, Sparkles, ChevronDown, ChevronUp, Download
} from 'lucide-react';
import type { OPCard, Deck } from '../types';
import type { ConfirmState } from './ConfirmDialog';
import DeckStats from './DeckStats';
import GeminiAnalysis from './GeminiAnalysis';

interface DeckBuilderProps {
  currentDeck: Deck;
  allCards: OPCard[];
  loadingCards: boolean;
  errorCards: string | null;
  onSaveDeck: () => void;
  onCancel: () => void;
  requestConfirm: (state: ConfirmState) => void;
  onOpenCardModal: (card: OPCard) => void;
  
  onSelectLeader: (card: OPCard) => void;
  onAddCard: (card: OPCard) => void;
  onRemoveCard: (cardId: string) => void;
  onRenameDeck: (newName: string) => void;

  loadingAnalysis: boolean;
  analysisResult: string | null;
  analysisError: string | null;
  onStartAnalysis: () => void;
  onClearAnalysis: () => void;
}

type BuilderTab = 'search' | 'deck';

// Subcomponente de Imagem com Skeleton Loader
function CardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full bg-slate-100" key={src}>
      {!loaded && <div className="skeleton-card absolute inset-0 z-10" />}
      <img 
        src={src} 
        alt={alt} 
        onLoad={() => setLoaded(true)}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100 z-0' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function DeckBuilder({
  currentDeck,
  allCards,
  loadingCards,
  errorCards,
  onSaveDeck,
  onCancel,
  requestConfirm,
  onOpenCardModal,
  onSelectLeader,
  onAddCard,
  onRemoveCard,
  onRenameDeck,
  loadingAnalysis,
  analysisResult,
  analysisError,
  onStartAnalysis,
  onClearAnalysis
}: DeckBuilderProps) {

  // Snapshot inicial para detectar alterações não salvas (P2.10)
  const initialSnapshot = useRef(JSON.stringify(currentDeck));

  const handleBack = () => {
    const isDirty = JSON.stringify(currentDeck) !== initialSnapshot.current;
    if (isDirty) {
      requestConfirm({
        message: 'Há alterações não salvas neste deck. Deseja sair mesmo assim?',
        confirmLabel: 'Sair sem salvar',
        destructive: true,
        onConfirm: onCancel,
      });
    } else {
      onCancel();
    }
  };

  // Exporta o deck atual como arquivo JSON (P2.7)
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(currentDeck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentDeck.name || 'deck').replace(/[^\w-]+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Abas para visualização Mobile
  const [activeTab, setActiveTab] = useState<BuilderTab>('search');
  
  // Filtros internos
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterCost, setFilterCost] = useState('All');

  // Paginação incremental para otimização de banda/imagens
  const [visibleCount, setVisibleCount] = useState(40);

  // Colapsáveis no painel direito
  const [showStats, setShowStats] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const totalMainCards = useMemo(() => {
    return Object.values(currentDeck.cards).reduce((sum, entry) => sum + entry.count, 0);
  }, [currentDeck]);

  // Lógica de compatibilidade de cor
  const isColorCompatible = (cardColor: string | null, leaderColor: string | null): boolean => {
    if (!leaderColor || leaderColor === 'NULL') return true;
    if (!cardColor || cardColor === 'NULL') return true; // sem cor definida: não bloqueia
    const leaderColors = leaderColor.toLowerCase().split(/[\s/,\-+]+/).map(c => c.trim()).filter(Boolean);
    const cardColors = cardColor.toLowerCase().split(/[\s/,\-+]+/).filter(Boolean);
    return cardColors.some(color => leaderColors.includes(color));
  };

  // Validação de Regras
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

  // Dados Estatísticos
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

  // Busca adiada (P2.5) — mantém o input responsivo ao filtrar milhares de cartas
  const deferredSearch = useDeferredValue(searchTerm);

  // Filtragem
  const filteredCards = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    return allCards.filter(card => {
      const matchesSearch = card.card_name.toLowerCase().includes(term) ||
                            card.card_set_id.toLowerCase().includes(term) ||
                            (card.card_text && card.card_text.toLowerCase().includes(term)) ||
                            (card.sub_types && card.sub_types.toLowerCase().includes(term));
      if (!matchesSearch) return false;

      if (filterColor !== 'All') {
        const colors = card.card_color.toLowerCase().split(/[\s/,\-+]+/);
        if (!colors.includes(filterColor.toLowerCase())) return false;
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
  }, [allCards, deferredSearch, filterColor, filterType, filterCost]);

  // Cartas visíveis paginadas
  const visibleCards = useMemo(() => {
    return filteredCards.slice(0, visibleCount);
  }, [filteredCards, visibleCount]);

  // Lado do Banco de Dados (Seleção)
  const renderCardSelectionSection = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* Filtros Rápidos */}
      <div className="p-4 bg-white/95 border-b border-slate-200/80 flex flex-wrap gap-2.5 sticky top-0 z-10">
        <div className="flex-1 min-w-[140px] relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input 
            type="text" 
            placeholder="Nome, ID..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(40); }}
            className="form-input pl-8 py-1.5 text-xs"
          />
        </div>
        <select 
          value={filterColor} 
          onChange={(e) => { setFilterColor(e.target.value); setVisibleCount(40); }}
          className="form-select py-1.5 px-2 text-[10px] w-24"
        >
          <option value="All">Cores</option>
          <option value="Red">Red</option>
          <option value="Blue">Blue</option>
          <option value="Green">Green</option>
          <option value="Yellow">Yellow</option>
          <option value="Black">Black</option>
          <option value="Purple">Purple</option>
        </select>
        <select 
          value={filterType} 
          onChange={(e) => { setFilterType(e.target.value); setVisibleCount(40); }}
          className="form-select py-1.5 px-2 text-[10px] w-24"
        >
          <option value="All">Tipos</option>
          <option value="Leader">Leader</option>
          <option value="Character">Character</option>
          <option value="Event">Event</option>
          <option value="Stage">Stage</option>
        </select>
        <select 
          value={filterCost} 
          onChange={(e) => { setFilterCost(e.target.value); setVisibleCount(40); }}
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
      </div>

      {/* Grid de Cartas com Skeletons e Overlays */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {loadingCards ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Carregando cartas...</p>
          </div>
        ) : errorCards ? (
          <div className="glass-panel p-5 border-red-500/30 text-center max-w-xs mx-auto my-8">
            <AlertTriangle className="text-red-500 mx-auto mb-2" size={24} />
            <p className="text-xs font-bold text-slate-800 mb-1">Erro ao carregar cartas</p>
            <p className="text-[11px] text-slate-500 mb-3">{errorCards}</p>
            <button className="btn btn-primary text-xs py-1.5" onClick={() => window.location.reload()}>Recarregar</button>
          </div>
        ) : (
          <>
            <div className="card-grid">
              {visibleCards.map(card => {
                const countInDeck = currentDeck.cards[card.card_set_id]?.count || 0;
                const isLeader = card.card_type === 'Leader';
                const isCurrentLeader = currentDeck.leader?.card_set_id === card.card_set_id;
                const hasCost = card.card_cost !== null && card.card_cost !== 'NULL';
                
                return (
                  <div 
                    key={`${card.card_set_id}_${card.card_name}_${card.card_image}`}
                    className={`glass-panel p-2 flex flex-col justify-between group/card relative rarity-${card.rarity.toLowerCase()} type-${card.card_type.toLowerCase()}`}
                  >
                    <div className="relative aspect-[2.5/3.5] rounded overflow-hidden mb-1.5 bg-slate-100 op-card-wrapper">
                      {/* Custo & Cor no Topo */}
                      <div className="card-top-badges">
                        {hasCost ? (
                          <span className="cost-badge">{card.card_cost}</span>
                        ) : (
                          <div />
                        )}
                        <span className={`color-badge ${card.card_color.toLowerCase()}`} />
                      </div>

                      <CardImage src={card.card_image} alt={card.card_name} />

                      <button
                        onClick={() => onOpenCardModal(card)}
                        aria-label={`Ver detalhes de ${card.card_name}`}
                        className="absolute top-1.5 right-1.5 p-1 bg-white/80 border border-slate-200 hover:bg-blue-600 hover:text-white transition-colors rounded-full z-20 opacity-0 group-hover/card:opacity-100"
                      >
                        <Info size={10} />
                      </button>

                      {countInDeck > 0 && !isLeader && (
                        <div className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 bg-blue-600 text-white font-extrabold text-[9px] rounded shadow-md z-20">
                          {countInDeck}x
                        </div>
                      )}

                      {isCurrentLeader && (
                        <div className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 bg-amber-500/90 text-white font-extrabold text-[9px] rounded shadow-md z-20">
                          Líder
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-800 truncate">{card.card_name}</p>
                      <span className="text-[8px] text-slate-500 font-bold font-mono block mt-0.5 mb-1.5">{card.card_set_id}</span>

                      {isLeader ? (
                        <button 
                          onClick={() => onSelectLeader(card)}
                          className={`w-full py-1 rounded text-[9px] font-bold transition-all ${
                            isCurrentLeader 
                              ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' 
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          {isCurrentLeader ? 'Líder Selecionado' : 'Definir Líder'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => onAddCard(card)}
                          disabled={countInDeck >= 4 || totalMainCards >= 50}
                          className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[9px] font-bold transition-all disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carregar Mais no Construtor */}
            {filteredCards.length > visibleCount && (
              <div className="mt-4 pb-6 text-center animate-fade-in">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 40)}
                  className="btn btn-secondary py-1.5 px-5 text-[10px] font-bold"
                >
                  Carregar Mais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Lado do Deck Estruturado (Meu Deck)
  const renderDeckStructureSection = () => (
    <div className="flex-1 flex flex-col p-4 space-y-6 overflow-y-auto">
      {/* Erros */}
      {!deckValidation.isValid && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1.5">
            <AlertTriangle size={13} /> Regras Violadas:
          </p>
          <ul className="list-disc pl-4 text-[10px] text-red-600 space-y-1">
            {deckValidation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Líder */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Líder</h4>
        {currentDeck.leader ? (
          <div 
            onClick={() => onOpenCardModal(currentDeck.leader!)}
            className="glass-panel p-3 flex items-center gap-3 border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-colors"
          >
            <div className="w-9 h-12 rounded border border-amber-500/30 overflow-hidden bg-slate-100 flex-shrink-0">
              <img src={currentDeck.leader.card_image} alt={currentDeck.leader.card_name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{currentDeck.leader.card_name}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{currentDeck.leader.card_set_id} | {currentDeck.leader.card_color}</p>
            </div>
            <span className="text-[9px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
              Leader
            </span>
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-lg p-5 text-center bg-slate-50/50">
            <p className="text-xs text-amber-600 flex items-center justify-center gap-1.5 font-medium">
              <AlertTriangle size={14} /> Selecione o Líder na lista de cartas
            </p>
          </div>
        )}
      </div>

      {/* Cartas do Deck */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cartas do Deck ({totalMainCards}/50)</h4>
        {Object.keys(currentDeck.cards).length === 0 ? (
          <div className="py-5 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/30">
            <p className="text-xs font-bold text-slate-600 mb-1">Seu deck está vazio</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              1. Defina um Líder &nbsp;·&nbsp; 2. Adicione 50 cartas da lista ao lado (máx. 4 cópias cada) até a validação ficar verde.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.values(currentDeck.cards).map(entry => (
              <div 
                key={entry.card.card_set_id} 
                className="glass-panel p-2 flex items-center justify-between gap-2 bg-white"
              >
                <div 
                  className="flex items-center gap-2 min-w-0 cursor-pointer"
                  onClick={() => onOpenCardModal(entry.card)}
                >
                  <div className="w-8 h-11 rounded border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                    <img src={entry.card.card_image} alt={entry.card.card_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{entry.card.card_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold text-slate-500 font-mono">{entry.card.card_set_id}</span>
                      <span className="text-[9px] text-slate-500">Custo: {entry.card.card_cost || 0}</span>
                      <span className={`color-badge ${entry.card.card_color.toLowerCase()}`} style={{ width: 7, height: 7 }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onRemoveCard(entry.card.card_set_id)}
                    aria-label={`Remover uma cópia de ${entry.card.card_name}`}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-xs font-bold text-blue-600 min-w-4 text-center">
                    {entry.count}
                  </span>
                  <button
                    onClick={() => onAddCard(entry.card)}
                    disabled={entry.count >= 4 || totalMainCards >= 50}
                    aria-label={`Adicionar uma cópia de ${entry.card.card_name}`}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 disabled:opacity-20"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estatísticas (Colapsável) */}
      <div className="border-t border-slate-200 pt-4">
        <button 
          onClick={() => setShowStats(!showStats)}
          className="flex items-center justify-between w-full py-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <BarChart2 className="text-blue-600" size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Estatísticas do Deck</span>
          </div>
          {showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showStats && (
          <div className="mt-2 animate-fade-in">
            <DeckStats 
              costCounts={calculatedStats.costCounts}
              typeCounts={calculatedStats.typeCounts}
              counterCounts={calculatedStats.counterCounts}
              totalCards={totalMainCards}
            />
          </div>
        )}
      </div>

      {/* Análise (Colapsável) */}
      <div className="border-t border-slate-200 pt-4">
        <button 
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="flex items-center justify-between w-full py-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="text-purple-600" size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Análise de IA & Sugestões</span>
          </div>
          {showAnalysis ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAnalysis && (
          <div className="mt-2 animate-fade-in">
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
    <div className="flex-1 flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100dvh-64px)] max-lg:h-[100dvh] overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={handleBack}
            aria-label="Voltar"
            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <input 
            type="text" 
            value={currentDeck.name}
            onChange={(e) => onRenameDeck(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none text-base md:text-lg font-bold text-slate-800 py-0.5 px-1 truncate max-w-[140px] sm:max-w-xs"
          />
          {deckValidation.isValid ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
              <CheckCircle size={10} /> Válido
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-200">
              <AlertTriangle size={10} /> Inválido
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            aria-label="Exportar deck como JSON"
            title="Exportar deck (JSON)"
            className="btn btn-secondary py-1.5 px-3 text-xs font-bold"
          >
            <Download size={14} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={onSaveDeck}
            className="btn btn-primary py-1.5 px-4 text-xs font-bold shadow-md animate-fade-in"
          >
            <Save size={14} /> Salvar
          </button>
        </div>
      </div>

      {/* Abas Seletoras Mobile */}
      <div className="flex lg:hidden bg-white border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
            activeTab === 'search' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Adicionar Cartas
        </button>
        <button 
          onClick={() => setActiveTab('deck')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
            activeTab === 'deck' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Meu Deck ({totalMainCards}/50)
        </button>
      </div>

      {/* Corpo de Trabalho Responsivo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop */}
        <div className="hidden lg:flex w-full overflow-hidden">
          <div className="w-3/5 flex flex-col overflow-hidden border-r border-slate-200">
            {renderCardSelectionSection()}
          </div>
          <div className="w-2/5 flex flex-col overflow-hidden bg-slate-50/80">
            {renderDeckStructureSection()}
          </div>
        </div>

        {/* Mobile */}
        <div className="flex lg:hidden w-full overflow-hidden">
          {activeTab === 'search' ? (
            <div className="w-full flex flex-col overflow-hidden">
              {renderCardSelectionSection()}
            </div>
          ) : (
            <div className="w-full flex flex-col overflow-hidden bg-slate-50/80">
              {renderDeckStructureSection()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
