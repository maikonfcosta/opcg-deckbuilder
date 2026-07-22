import { useState, useMemo, useEffect } from 'react';
import { Search, Home, Library, Settings, ChevronDown, Loader2 } from 'lucide-react';
import { OpcgCard } from './components/OpcgCard';
import { CardModal } from './components/CardModal';
import { DeckSummary } from './components/DeckSummary';
import { ProfileView } from './components/ProfileView';
import { DeckList } from './components/DeckList';
import type { SavedDeck } from './components/DeckList';
import { ViewDeckModal } from './components/ViewDeckModal';
import { useDialog } from './components/DialogContext';
import { AutoDeckWizard } from './components/AutoDeckWizard';
import { ManualDeckWizard } from './components/ManualDeckWizard';
import { BanlistViewModal } from './components/BanlistViewModal';
import { BANNED_CARDS, RESTRICTED_CARDS } from './data/banlist';
import { Flame } from 'lucide-react';
import { LeaksFeed } from './components/LeaksFeed';

const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'Purple', 'Multicolor'];
const TYPES = ['Leader', 'Character', 'Event', 'Stage'];
const COSTS = ['0', '1', '2', '3', '4', '5', '6', '7+'];
const POWERS = ['0', '1000', '2000', '3000', '4000', '5000', '6000', '7000', '8000', '9000', '10000+'];
const COMBOS = ['0', '1000', '2000'];
const KEYWORDS = ['Blocker', 'Rush', 'Banish', 'Double Attack', 'On Play', 'Activate: Main', 'When Attacking', 'End of Your Turn'];
const PAGE_SIZE = 50;

type TabType = 'home' | 'decks' | 'profile' | 'leaks';

function App() {
  const { showAlert, showConfirm } = useDialog();
  const [allCards, setAllCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeCost, setActiveCost] = useState<string | null>(null);
  const [activePower, setActivePower] = useState<string | null>(null);
  const [activeCombo, setActiveCombo] = useState<string | null>(null);
  const [activeSeries, setActiveSeries] = useState<string | null>(null);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAutoWizard, setShowAutoWizard] = useState(false);
  const [showManualWizard, setShowManualWizard] = useState(false);
  const [showBanlistModal, setShowBanlistModal] = useState(false);
  
  const [deck, setDeck] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('opcg_pro_deck_v2');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(() => {
    const saved = localStorage.getItem('opcg_pro_saved_decks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    import('./data/premadeDecks').then(module => {
      const PREMADE_DECKS = module.PREMADE_DECKS;
      setSavedDecks(prev => {
        const newDecks = [...prev];
        let changed = false;
        PREMADE_DECKS.forEach(premade => {
          if (!newDecks.find(d => d.id === premade.id)) {
            newDecks.push(premade);
            changed = true;
          }
        });
        return changed ? newDecks : prev;
      });
    });
  }, []);
  const [isBuildingDeck, setIsBuildingDeck] = useState(false);
  const [draftDeckName, setDraftDeckName] = useState('Novo Deck');
  const [draftDeckId, setDraftDeckId] = useState<string | null>(null);
  const [viewingDeck, setViewingDeck] = useState<SavedDeck | null>(null);
  
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  // 1. Fetch Assíncrono dos Dados (Performance)
  useEffect(() => {
    import('./services/api').then(({ fetchAllCards }) => {
      fetchAllCards()
        .then(data => {
          setAllCards(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Erro ao carregar banco de dados:", err);
          setIsLoading(false);
        });
    });
  }, []);

  const dynamicSeries = useMemo(() => {
    const seriesSet = new Set(allCards.map(c => c.card_set_id ? c.card_set_id.split('-')[0] : 'Unknown'));
    return Array.from(seriesSet).filter(Boolean).sort();
  }, [allCards]);

  // 2. Debounce na Busca (Performance React)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300); // 300ms de delay
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('opcg_pro_deck_v2', JSON.stringify(deck));
  }, [deck]);

  useEffect(() => {
    localStorage.setItem('opcg_pro_saved_decks', JSON.stringify(savedDecks));
  }, [savedDecks]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, activeColor, activeType, activeCost, activePower, activeCombo, activeSeries, activeKeyword, activeTab]);
  
  const allFilteredCards = useMemo(() => {
    let result = allCards;

    // Removido o filtro que forçava a mostrar apenas cartas do deck,
    // pois agora queremos que o usuário veja todas as cartas da cor selecionada para adicionar.
    // if (activeTab === 'decks' && isBuildingDeck) {
    //   result = result.filter(card => deck[card.card_set_id] > 0);
    // }

    if (activeColor) {
      if (activeColor === 'Multicolor') {
        result = result.filter(card => card.card_color?.includes(' '));
      } else {
        result = result.filter(card => card.card_color?.includes(activeColor));
      }
    }
    if (activeType) result = result.filter(card => card.card_type === activeType);
    
    if (activeCost) {
      if (activeCost === '7+') result = result.filter(card => card.card_cost >= 7);
      else result = result.filter(card => String(card.card_cost) === activeCost);
    }
    
    if (activePower) {
      if (activePower === '10000+') result = result.filter(card => parseInt(card.card_power || '0') >= 10000);
      else result = result.filter(card => String(card.card_power) === activePower);
    }

    if (activeCombo) {
      if (activeCombo === '0') result = result.filter(card => !card.counter_amount || card.counter_amount === '0');
      else result = result.filter(card => String(card.counter_amount) === activeCombo || String(card.counter_amount) === `+${activeCombo}`);
    }

    if (activeSeries) {
      result = result.filter(card => card.card_set_id?.startsWith(activeSeries));
    }

    if (activeKeyword) {
      result = result.filter(card => card.card_text?.includes(activeKeyword));
    }

    if (debouncedSearch) {
      result = result.filter(card => 
        card.card_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        card.card_set_id?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        card.card_text?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    return result; 
  }, [debouncedSearch, activeColor, activeType, activeCost, activePower, activeCombo, activeSeries, activeKeyword, activeTab, deck, allCards]);

  const visibleCards = allFilteredCards.slice(0, visibleCount);
  const hasMore = visibleCount < allFilteredCards.length;

  const toggleColor = (color: string) => setActiveColor(prev => prev === color ? null : color);
  const toggleType = (type: string) => setActiveType(prev => prev === type ? null : type);
  const toggleCost = (cost: string) => setActiveCost(prev => prev === cost ? null : cost);
  const togglePower = (power: string) => setActivePower(prev => prev === power ? null : power);
  const toggleCombo = (combo: string) => setActiveCombo(prev => prev === combo ? null : combo);
  const toggleKeyword = (kw: string) => setActiveKeyword(prev => prev === kw ? null : kw);

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveColor(null);
    setActiveType(null);
    setActiveCost(null);
    setActivePower(null);
    setActiveCombo(null);
    setActiveSeries(null);
    setActiveKeyword(null);
  };

  const handleLoadMore = () => setVisibleCount(prev => prev + PAGE_SIZE);

  const updateDeckCard = (card: any, quantity: number) => {
    if (quantity > 0) {
      if (BANNED_CARDS.includes(card.card_set_id)) {
        showAlert(`A carta ${card.card_name} (${card.card_set_id}) está banida e não pode ser adicionada ao deck.`);
        return;
      }
      if (RESTRICTED_CARDS.includes(card.card_set_id) && quantity > 1) {
        showAlert(`A carta ${card.card_name} (${card.card_set_id}) é restrita. Você só pode ter 1 cópia dela no deck.`);
        return;
      }
    }

    setDeck(prev => {
      const newDeck = { ...prev };
      if (quantity <= 0) {
        delete newDeck[card.card_set_id];
      } else {
        newDeck[card.card_set_id] = quantity;
      }
      return newDeck;
    });
  };

  const handleCreateDeck = () => {
    setShowManualWizard(true);
  };

  const handleManualDeckStarted = (name: string, leaderCard: any) => {
    setDraftDeckName(name);
    setDraftDeckId(null);
    setDeck({ [leaderCard.id]: 1 });
    
    // Travar na cor do líder e limpar a busca para o usuário focar nas cartas corretas
    setActiveColor(leaderCard.color);
    setSearchTerm('');
    setActiveType(null);
    setActiveCost(null);
    setActivePower(null);
    setActiveCombo(null);
    setActiveSeries(null);
    setActiveKeyword(null);
    
    setIsBuildingDeck(true);
    setShowManualWizard(false);
  };

  const handleAutoDeckGenerated = (name: string, generatedCards: Record<string, number>) => {
    setDraftDeckName(name);
    setDraftDeckId(null);
    setDeck(generatedCards);
    setIsBuildingDeck(true);
    setShowAutoWizard(false);
    
    // Clear filters so the user can see their newly added cards clearly
    setSearchTerm('');
    setDebouncedSearch('');
    setActiveColor(null);
    setActiveType(null);
    setActiveCost(null);
    setActivePower(null);
    setActiveCombo(null);
    setActiveSeries(null);
    setActiveKeyword(null);
  };

  const handleAutoAdjustDeck = (deckId: string, newCards: Record<string, number>) => {
    setSavedDecks(prev => {
      const updated = prev.map(d => {
        if (d.id === deckId) {
          const newDeck = { ...d, cards: newCards, updatedAt: new Date().toISOString() };
          setViewingDeck(newDeck);
          return newDeck;
        }
        return d;
      });
      return updated;
    });
  };

  const handleEditDeck = (savedDeck: SavedDeck) => {
    setDraftDeckName(savedDeck.name);
    setDraftDeckId(savedDeck.id);
    setDeck(savedDeck.cards);
    setIsBuildingDeck(true);
    setViewingDeck(null);
  };

  const handleDeleteDeck = (deckId: string) => {
    setSavedDecks(prev => prev.filter(d => d.id !== deckId));
    setViewingDeck(null);
  };

  const handleSaveDeck = () => {
    setSavedDecks(prev => {
      const existingIndex = prev.findIndex(d => d.id === draftDeckId);
      const newDeck: SavedDeck = {
        id: draftDeckId || Date.now().toString(),
        name: draftDeckName,
        cards: deck
      };
      
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = newDeck;
        return next;
      }
      return [...prev, newDeck];
    });
    
    setIsBuildingDeck(false);
    setDeck({});
    setDraftDeckId(null);
  };

  const handleCancelDeck = () => {
    showConfirm('Tem certeza que deseja cancelar a edição? As alterações não serão salvas.', () => {
      setIsBuildingDeck(false);
      setDeck({});
      setDraftDeckId(null);
    });
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={48} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <h2 style={{ color: 'var(--text-muted)' }}>Sincronizando Banco de Dados...</h2>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="top-header glass-panel">
        <h1 className="header-title">
          {activeTab === 'decks' ? (isBuildingDeck ? 'Editando Deck' : 'Meus Decks') : activeTab === 'profile' ? 'Perfil' : activeTab === 'leaks' ? 'Leaks' : 'OPCG'} <span>Pro</span>
        </h1>
        
        {activeTab !== 'profile' && activeTab !== 'leaks' && !(activeTab === 'decks' && !isBuildingDeck) && (
          <>
            <div className="search-bar-container">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filters-container">
              {COLORS.map(color => (
                <button 
                  key={color} 
                  className={`filter-pill ${activeColor === color ? 'active' : ''}`}
                  onClick={() => toggleColor(color)}
                >
                  <span className={`color-dot ${color}`} style={{ marginRight: '6px' }}></span>
                  {color}
                </button>
              ))}
              {TYPES.map(type => (
                <button 
                  key={type} 
                  className={`filter-pill ${activeType === type ? 'active' : ''}`}
                  onClick={() => toggleType(type)}
                >
                  {type}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button 
                  className={`filter-pill`}
                  onClick={handleClearFilters}
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                  title="Limpar todos os filtros"
                >
                  Limpar Filtros
                </button>
                <button 
                  className={`filter-pill ${showAdvancedFilters ? 'active' : ''}`}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  style={{ border: '1px solid var(--accent)' }}
                >
                  Filtros Avançados {showAdvancedFilters ? <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="advanced-filters-panel">
                <div className="filter-group">
                  <h4>Custo de Energia</h4>
                  <div className="filter-options">
                    {COSTS.map(cost => (
                      <button key={cost} className={`filter-pill ${activeCost === cost ? 'active' : ''}`} onClick={() => toggleCost(cost)}>
                        {cost}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <h4>Poder (Power)</h4>
                  <div className="filter-options">
                    {POWERS.map(pwr => (
                      <button key={pwr} className={`filter-pill ${activePower === pwr ? 'active' : ''}`} onClick={() => togglePower(pwr)}>
                        {pwr}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <h4>Poder de Combo</h4>
                  <div className="filter-options">
                    {COMBOS.map(cmb => (
                      <button key={cmb} className={`filter-pill ${activeCombo === cmb ? 'active' : ''}`} onClick={() => toggleCombo(cmb)}>
                        {cmb}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-group">
                  <h4>Série (Coleção)</h4>
                  <select 
                    className="filter-select"
                    value={activeSeries || ''} 
                    onChange={(e) => setActiveSeries(e.target.value || null)}
                  >
                    <option value="">Todas as Séries</option>
                    {dynamicSeries.map(series => (
                      <option key={series} value={series}>{series}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <h4>Keywords (Habilidades)</h4>
                  <div className="filter-options">
                    {KEYWORDS.map(kw => (
                      <button key={kw} className={`filter-pill ${activeKeyword === kw ? 'active' : ''}`} onClick={() => toggleKeyword(kw)}>
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </header>

      <main className="cards-grid">
        {activeTab === 'decks' && isBuildingDeck && (
          <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: 'var(--text)' }}>{draftDeckName}</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={handleCancelDeck} style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-muted)' }}>Cancelar</button>
                  <button className="btn-primary" onClick={handleSaveDeck}>Salvar Deck</button>
                </div>
             </div>
             <DeckSummary deckState={deck} cardsData={allCards} />
             
             {Object.keys(deck).length > 0 && (
               <>
                 <div style={{ marginTop: '24px', marginBottom: '8px' }}>
                   <h4 style={{ color: 'var(--text)', borderBottom: '2px solid var(--accent)', paddingBottom: '4px' }}>
                     Líder
                   </h4>
                 </div>
                 <div className="cards-grid" style={{ padding: 0, marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                   {Object.entries(deck)
                     .filter(([_, qty]) => qty > 0)
                     .sort(([idA], [idB]) => idA.localeCompare(idB))
                     .map(([cardId, qty], idx) => {
                       const card = allCards.find(c => c.card_set_id === cardId);
                       if (!card || card.card_type !== 'Leader') return null;
                       return (
                         <OpcgCard 
                           key={`deck-${card.card_set_id}-${idx}`} 
                           card={card} 
                           onClick={setSelectedCard} 
                           quantity={qty} 
                         />
                       );
                     })}
                 </div>

                 <div style={{ marginTop: '24px', marginBottom: '8px' }}>
                   <h4 style={{ color: 'var(--text)', borderBottom: '2px solid var(--accent)', paddingBottom: '4px' }}>
                     Main Deck (50 cartas)
                   </h4>
                 </div>
                 <div className="cards-grid" style={{ padding: 0, marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                   {Object.entries(deck)
                     .filter(([_, qty]) => qty > 0)
                     .sort(([idA], [idB]) => idA.localeCompare(idB))
                     .map(([cardId, qty], idx) => {
                       const card = allCards.find(c => c.card_set_id === cardId);
                       if (!card || card.card_type === 'Leader') return null;
                       return (
                         <OpcgCard 
                           key={`deck-${card.card_set_id}-${idx}`} 
                           card={card} 
                           onClick={setSelectedCard} 
                           quantity={qty} 
                         />
                       );
                     })}
                 </div>
               </>
             )}
          </div>
        )}

        {activeTab === 'decks' && !isBuildingDeck && (
          <div style={{ gridColumn: '1 / -1' }}>
             <DeckList 
                decks={savedDecks} 
                allCards={allCards}
                onCreateClick={handleCreateDeck}
                onDeckClick={(d) => setViewingDeck(d)}
                onAutoGenerateClick={() => setShowAutoWizard(true)}
             />
          </div>
        )}
        
        {activeTab === 'profile' ? (
          <ProfileView 
            onViewBanlist={() => setShowBanlistModal(true)}
          />
        ) : activeTab === 'leaks' ? (
          <LeaksFeed />
        ) : activeTab === 'decks' && !isBuildingDeck ? null : (
          <>
            {activeTab === 'decks' && isBuildingDeck ? (
              <>
                <div style={{ gridColumn: '1 / -1', marginTop: '8px', marginBottom: '8px' }}>
                  <h4 style={{ color: 'var(--text)', borderBottom: '2px solid var(--accent)', paddingBottom: '4px' }}>
                    Cartas Disponíveis (Toque para Adicionar/Remover)
                  </h4>
                </div>
                {visibleCards.filter(c => c.card_type !== 'Leader').map((card, idx) => (
                  <OpcgCard key={`${card.card_set_id}-${card.card_image || idx}-${idx}`} card={card} onClick={setSelectedCard} quantity={deck[card.card_set_id]} />
                ))}
              </>
            ) : (
              <>
                {visibleCards.map((card, idx) => (
                  <OpcgCard key={`${card.card_set_id}-${card.card_image || idx}-${idx}`} card={card} onClick={setSelectedCard} quantity={activeTab === 'home' && deck[card.card_set_id] ? deck[card.card_set_id] : undefined} />
                ))}
              </>
            )}
            {visibleCards.length === 0 && activeTab === 'decks' && isBuildingDeck && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
                Seu deck está vazio. Vá para Início e adicione algumas cartas!
              </div>
            )}
            {visibleCards.length === 0 && activeTab === 'home' && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
                Nenhuma carta encontrada com esses filtros.
              </div>
            )}
          </>
        )}
      </main>

      {hasMore && activeTab !== 'profile' && activeTab !== 'leaks' && !(activeTab === 'decks' && !isBuildingDeck) && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 64px 0' }}>
          <button 
            onClick={handleLoadMore}
            className="filter-pill active"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}
          >
            Carregar Mais Cartas <ChevronDown size={18} />
          </button>
        </div>
      )}

      <nav className="bottom-nav glass-panel">
        <a 
          href="#" 
          aria-label="Ir para Início"
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveTab('home'); }}
        >
          <Home size={24} />
          <span>Início</span>
        </a>
        <a 
          href="#" 
          aria-label="Ver Decks"
          className={`nav-item ${activeTab === 'decks' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveTab('decks'); }}
        >
          <Library size={24} />
          <span>Decks</span>
        </a>
        <a 
          href="#" 
          aria-label="Spoilers & Leaks"
          className={`nav-item ${activeTab === 'leaks' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveTab('leaks'); }}
        >
          <Flame size={24} />
          <span>Leaks</span>
        </a>
        <a 
          href="#" 
          aria-label="Abrir Perfil"
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
        >
          <Settings size={24} />
          <span>Perfil</span>
        </a>
      </nav>

      <CardModal 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)} 
        quantityInDeck={selectedCard ? (deck[selectedCard.id] || 0) : 0}
        onUpdateDeck={updateDeckCard}
      />

      {viewingDeck && (
        <ViewDeckModal
          deck={viewingDeck}
          allCards={allCards}
          onClose={() => setViewingDeck(null)}
          onEdit={handleEditDeck}
          onDelete={handleDeleteDeck}
          onCardClick={setSelectedCard}
          onAutoAdjust={(newCards) => handleAutoAdjustDeck(viewingDeck.id, newCards)}
        />
      )}

      {showAutoWizard && (
        <AutoDeckWizard 
          allCards={allCards}
          onClose={() => setShowAutoWizard(false)}
          onComplete={handleAutoDeckGenerated}
        />
      )}

      {showManualWizard && (
        <ManualDeckWizard 
          allCards={allCards}
          onClose={() => setShowManualWizard(false)}
          onComplete={handleManualDeckStarted}
        />
      )}

      {showBanlistModal && (
        <BanlistViewModal
          allCards={allCards}
          onClose={() => setShowBanlistModal(false)}
        />
      )}
    </div>
  );
}

export default App;
