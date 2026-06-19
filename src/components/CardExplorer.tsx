import { useState, useMemo, useDeferredValue } from 'react';
import { Search, SlidersHorizontal, Eye, AlertTriangle } from 'lucide-react';
import type { OPCard } from '../types';

interface CardExplorerProps {
  allCards: OPCard[];
  loadingCards: boolean;
  errorCards: string | null;
  onOpenCardModal: (card: OPCard) => void;
}

// Subcomponente de Imagem com Skeleton Loader integrado
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

export default function CardExplorer({ allCards, loadingCards, errorCards, onOpenCardModal }: CardExplorerProps) {
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterCost, setFilterCost] = useState('All');
  const [filterRarity, setFilterRarity] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Paginação inteligente (Carregamento Incremental)
  const [visibleCount, setVisibleCount] = useState(60);

  // Busca adiada (P2.5) — mantém o input responsivo ao filtrar milhares de cartas
  const deferredSearch = useDeferredValue(searchTerm);

  // Filtragem local
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

      if (filterRarity !== 'All' && card.rarity !== filterRarity) return false;

      return true;
    });
  }, [allCards, deferredSearch, filterColor, filterType, filterCost, filterRarity]);

  // Seção visível paginada
  const visibleCards = useMemo(() => {
    return filteredCards.slice(0, visibleCount);
  }, [filteredCards, visibleCount]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-3 py-6 md:px-4 md:py-8 animate-fade-in pb-20">
      <div className="mb-6 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
          Banco de Cartas
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Explore e consulte detalhes e preços em tempo real.</p>
      </div>

      {/* Barra de Busca */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nome, ID, efeito..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(60); }}
            className="form-input pl-9 text-xs py-2 md:text-sm"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} px-3 py-2`}
          title="Filtros avançados"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Filtros Extras */}
      {showFilters && (
        <div className="glass-panel p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cor</label>
            <select 
              value={filterColor} 
              onChange={(e) => { setFilterColor(e.target.value); setVisibleCount(60); }}
              className="form-select text-[11px] py-1.5"
            >
              <option value="All">Todas</option>
              <option value="Red">Red</option>
              <option value="Blue">Blue</option>
              <option value="Green">Green</option>
              <option value="Yellow">Yellow</option>
              <option value="Black">Black</option>
              <option value="Purple">Purple</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
            <select 
              value={filterType} 
              onChange={(e) => { setFilterType(e.target.value); setVisibleCount(60); }}
              className="form-select text-[11px] py-1.5"
            >
              <option value="All">Todos</option>
              <option value="Leader">Leader</option>
              <option value="Character">Character</option>
              <option value="Event">Event</option>
              <option value="Stage">Stage</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Custo</label>
            <select 
              value={filterCost} 
              onChange={(e) => { setFilterCost(e.target.value); setVisibleCount(60); }}
              className="form-select text-[11px] py-1.5"
            >
              <option value="All">Todos</option>
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

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Raridade</label>
            <select 
              value={filterRarity} 
              onChange={(e) => { setFilterRarity(e.target.value); setVisibleCount(60); }}
              className="form-select text-[11px] py-1.5"
            >
              <option value="All">Todas</option>
              <option value="L">Leader</option>
              <option value="SEC">SEC</option>
              <option value="SR">SR</option>
              <option value="R">R</option>
              <option value="UC">UC</option>
              <option value="C">C</option>
            </select>
          </div>
        </div>
      )}

      {/* Estatísticas de Resultados */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-3 px-1">
        <span>Mostrando {visibleCards.length} de {filteredCards.length} cartas</span>
      </div>

      {/* Grid de Cartas */}
      {loadingCards ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Buscando banco de cartas...</p>
        </div>
      ) : errorCards ? (
        <div className="glass-panel p-6 border-red-500/30 text-center max-w-sm mx-auto my-8">
          <AlertTriangle className="text-red-500 mx-auto mb-3" size={28} />
          <p className="text-slate-800 font-bold text-sm mb-1.5">Erro de conexão</p>
          <p className="text-xs text-slate-500 mb-4">{errorCards}</p>
          <button className="btn btn-primary text-xs py-1.5" onClick={() => window.location.reload()}>Recarregar Banco</button>
        </div>
      ) : (
        <>
          <div className="card-grid">
            {visibleCards.map(card => {
              const hasCost = card.card_cost !== null && card.card_cost !== 'NULL';
              return (
                <div 
                  key={`${card.card_set_id}_${card.card_name}_${card.card_image}`}
                  onClick={() => onOpenCardModal(card)}
                  className={`op-card-container group rarity-${card.rarity.toLowerCase()} type-${card.card_type.toLowerCase()}`}
                >
                  <div className="op-card-wrapper">
                    {/* Custo & Cor no Topo (Mobile First Overlay) */}
                    <div className="card-top-badges">
                      {hasCost ? (
                        <span className="cost-badge">{card.card_cost}</span>
                      ) : (
                        <div />
                      )}
                      <span className={`color-badge ${card.card_color.toLowerCase()}`} />
                    </div>

                    <CardImage src={card.card_image} alt={card.card_name} />

                    {/* Botão Hover Desktop */}
                    <div className="hidden lg:flex absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center pointer-events-none z-20">
                      <div className="p-1.5 bg-blue-600 rounded-full border border-blue-400 text-white shadow-md">
                        <Eye size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5 text-left px-1">
                    <p className="text-[10px] font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {card.card_name}
                    </p>
                    <span className="text-[8px] font-bold text-slate-500 font-mono block mt-0.5">
                      {card.card_set_id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Carregar Mais */}
          {filteredCards.length > visibleCount && (
            <div className="mt-8 text-center animate-fade-in">
              <button 
                onClick={() => setVisibleCount(prev => prev + 60)}
                className="btn btn-secondary py-2 px-6 text-xs font-bold border-blue-600/10 hover:border-blue-600/30"
              >
                Carregar Mais Cartas
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
