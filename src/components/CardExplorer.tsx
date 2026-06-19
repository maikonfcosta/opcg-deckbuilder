import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Eye, AlertTriangle } from 'lucide-react';
import type { OPCard } from '../types';

interface CardExplorerProps {
  allCards: OPCard[];
  loadingCards: boolean;
  errorCards: string | null;
  onOpenCardModal: (card: OPCard) => void;
}

export default function CardExplorer({ allCards, loadingCards, errorCards, onOpenCardModal }: CardExplorerProps) {
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterCost, setFilterCost] = useState('All');
  const [filterRarity, setFilterRarity] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Filtragem local eficiente
  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      const matchesSearch = card.card_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            card.card_set_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (card.card_text && card.card_text.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (card.sub_types && card.sub_types.toLowerCase().includes(searchTerm.toLowerCase()));

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
  }, [allCards, searchTerm, filterColor, filterType, filterCost, filterRarity]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-extrabold mb-1.5 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
          Banco de Cartas
        </h1>
        <p className="text-sm text-slate-400">Explore o banco de dados oficial e confira informações táticas.</p>
      </div>

      {/* Barra de Pesquisa Principal */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Nome, ID (OP01-001), efeito ou subtipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} px-3`}
          title="Filtros avançados"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Painel de Filtros Deslizante/Sanfona */}
      {showFilters && (
        <div className="glass-panel p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Cor</label>
            <select 
              value={filterColor} 
              onChange={(e) => setFilterColor(e.target.value)}
              className="form-select text-xs py-2"
            >
              <option value="All">Todas as Cores</option>
              <option value="Red">Red (Vermelho)</option>
              <option value="Blue">Blue (Azul)</option>
              <option value="Green">Green (Verde)</option>
              <option value="Yellow">Yellow (Amarelo)</option>
              <option value="Black">Black (Preto)</option>
              <option value="Purple">Purple (Roxo)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select text-xs py-2"
            >
              <option value="All">Todos os Tipos</option>
              <option value="Leader">Leader</option>
              <option value="Character">Character</option>
              <option value="Event">Event</option>
              <option value="Stage">Stage</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Custo</label>
            <select 
              value={filterCost} 
              onChange={(e) => setFilterCost(e.target.value)}
              className="form-select text-xs py-2"
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Raridade</label>
            <select 
              value={filterRarity} 
              onChange={(e) => setFilterRarity(e.target.value)}
              className="form-select text-xs py-2"
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

      {/* Resultados de Contador */}
      <p className="text-xs text-slate-500 mb-4 text-right">
        Cartas encontradas: <strong className="text-cyan-400 font-bold">{filteredCards.length}</strong>
      </p>

      {/* Feedback de Loading / Erros */}
      {loadingCards ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400 font-medium">Buscando banco de dados de cartas...</p>
        </div>
      ) : errorCards ? (
        <div className="glass-panel p-6 border-red-500/40 text-center max-w-sm mx-auto my-10">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={32} />
          <p className="text-slate-350 font-bold mb-2">Falha na conexão</p>
          <p className="text-xs text-slate-450 mb-4">{errorCards}</p>
          <button className="btn btn-primary text-xs" onClick={() => window.location.reload()}>Recarregar Banco</button>
        </div>
      ) : (
        <div className="card-grid">
          {filteredCards.slice(0, 100).map(card => (
            <div 
              key={`${card.card_set_id}_${card.card_name}_${card.card_image}`}
              onClick={() => onOpenCardModal(card)}
              className="op-card-container group"
            >
              <div className="op-card-wrapper">
                <img 
                  src={card.card_image} 
                  alt={card.card_name} 
                  className="w-full h-full object-cover rounded-lg border border-slate-900"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="p-2 bg-black/60 rounded-full border border-slate-800 text-cyan-400 shadow-lg">
                    <Eye size={20} />
                  </div>
                </div>
              </div>
              <div className="mt-2 text-left">
                <p className="text-xs text-slate-300 font-semibold truncate group-hover:text-cyan-400 transition-colors">{card.card_name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] font-bold text-slate-500 font-mono">{card.card_set_id}</span>
                  <span className={`color-badge ${card.card_color.toLowerCase()}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingCards && filteredCards.length > 100 && (
        <p className="text-center text-slate-500 text-[10px] mt-8 italic">
          Exibindo as primeiras 100 cartas. Refine a busca ou filtre para obter resultados mais específicos.
        </p>
      )}
    </div>
  );
}
