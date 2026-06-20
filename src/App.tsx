import React, { useState, useEffect } from 'react';
import { 
  FolderHeart, Database, Settings as SettingsIcon
} from 'lucide-react';

import { fetchAllCards, fetchLigaPrices } from './services/api';
import { analyzeDeckWithGemini } from './services/gemini';
import type { OPCard, Deck, AppSettings, LigaCardPrice } from './types';

// Componentes Modulares Refatorados
import Dashboard from './components/Dashboard';
import CardExplorer from './components/CardExplorer';
import DeckBuilder from './components/DeckBuilder';
import Settings from './components/Settings';
import CardModal from './components/CardModal';
import Toast from './components/Toast';
import type { ToastData, ToastType } from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';
import type { ConfirmState } from './components/ConfirmDialog';

// Utilitário para gerar ID único
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  // --- Estados Globais ---
  const [view, setView] = useState<'dashboard' | 'explorer' | 'builder' | 'settings'>('dashboard');
  const [allCards, setAllCards] = useState<OPCard[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(true);
  const [errorCards, setErrorCards] = useState<string | null>(null);
  
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem('opcg_decks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [currentDeck, setCurrentDeck] = useState<Deck>({
    id: '',
    name: 'Novo Deck',
    leader: null,
    cards: {},
    createdAt: '',
    updatedAt: ''
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('opcg_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { geminiApiKey: '' };
  });

  // Estados da IA
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Estados do Modal
  const [selectedCard, setSelectedCard] = useState<OPCard | null>(null);
  const [ligaPrices, setLigaPrices] = useState<LigaCardPrice | null>(null);
  const [loadingLiga, setLoadingLiga] = useState<boolean>(false);

  // Toast e Confirmação (P2.1)
  const [toast, setToast] = useState<ToastData | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const notify = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const requestConfirm = (state: ConfirmState) => setConfirmState(state);

  // --- Efeitos ---
  // Carrega o banco de cartas principal
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingCards(true);
        const data = await fetchAllCards();
        setAllCards(data);
        setErrorCards(null);
      } catch (err) {
        console.error(err);
        setErrorCards('Falha ao conectar com a OPTCG API. Por favor, tente novamente mais tarde.');
      } finally {
        setLoadingCards(false);
      }
    }
    loadData();
  }, []);



  // --- Ações de Armazenamento ---
  const saveDecks = (updatedDecks: Deck[]) => {
    setDecks(updatedDecks);
    localStorage.setItem('opcg_decks', JSON.stringify(updatedDecks));
  };

  const handleSaveSettings = (newApiKey: string) => {
    const updated = { geminiApiKey: newApiKey };
    setSettings(updated);
    localStorage.setItem('opcg_settings', JSON.stringify(updated));
  };

  // --- Lógica de Deck Builder ---
  const handleCreateDeck = () => {
    const newDeck: Deck = {
      id: generateId(),
      name: 'Novo Deck',
      leader: null,
      cards: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentDeck(newDeck);
    setAnalysisResult(null);
    setAnalysisError(null);
    setView('builder');
  };

  const handleEditDeck = (deck: Deck) => {
    setCurrentDeck({ ...deck });
    setAnalysisResult(null);
    setAnalysisError(null);
    setView('builder');
  };

  // Importa um deck a partir de um arquivo JSON exportado (P2.7)
  const handleImportDeck = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<Deck>;
        if (!parsed || typeof parsed !== 'object' || !parsed.cards) {
          throw new Error('estrutura inválida');
        }
        const imported: Deck = {
          id: generateId(),
          name: parsed.name ? `${parsed.name} (importado)` : 'Deck importado',
          leader: parsed.leader ?? null,
          cards: parsed.cards,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveDecks([...decks, imported]);
        notify('Deck importado com sucesso!', 'success');
      } catch {
        notify('Arquivo de deck inválido.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm({
      message: 'Deseja realmente excluir este deck? Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      destructive: true,
      onConfirm: () => {
        saveDecks(decks.filter(d => d.id !== id));
        notify('Deck excluído.', 'info');
      },
    });
  };

  const handleSaveCurrentDeck = () => {
    const now = new Date().toISOString();
    const updatedDeck = {
      ...currentDeck,
      updatedAt: now
    };

    let updatedDecks: Deck[];
    if (decks.some(d => d.id === currentDeck.id)) {
      updatedDecks = decks.map(d => (d.id === currentDeck.id ? updatedDeck : d));
    } else {
      updatedDecks = [...decks, updatedDeck];
    }

    saveDecks(updatedDecks);
    setCurrentDeck(updatedDeck);
    notify('Deck salvo localmente!', 'success');
    setView('dashboard');
  };

  // --- Modificações do Deck (Passadas por callback) ---
  const handleSelectLeader = (card: OPCard) => {
    setCurrentDeck(prev => ({ ...prev, leader: card }));
  };

  const handleAddCard = (card: OPCard) => {
    setCurrentDeck(prev => {
      const updated = { ...prev.cards };
      const currentCount = updated[card.card_set_id]?.count || 0;
      updated[card.card_set_id] = { card, count: currentCount + 1 };
      return { ...prev, cards: updated };
    });
  };

  const handleRemoveCard = (cardId: string) => {
    setCurrentDeck(prev => {
      const updated = { ...prev.cards };
      if (!updated[cardId]) return prev;
      if (updated[cardId].count > 1) {
        updated[cardId] = { ...updated[cardId], count: updated[cardId].count - 1 };
      } else {
        delete updated[cardId];
      }
      return { ...prev, cards: updated };
    });
  };

  const handleRenameDeck = (newName: string) => {
    setCurrentDeck(prev => ({ ...prev, name: newName }));
  };

  // --- Chamadas Extras e IA ---
  const handleOpenCardModal = async (card: OPCard) => {
    setSelectedCard(card);
    setLigaPrices(null);
    setLoadingLiga(true);
    try {
      const prices = await fetchLigaPrices(card.card_set_id);
      setLigaPrices(prices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLiga(false);
    }
  };

  const handleStartAnalysis = async () => {
    setLoadingAnalysis(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
      const report = await analyzeDeckWithGemini(currentDeck, settings.geminiApiKey);
      setAnalysisResult(report);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro de conexão com o Gemini.';
      setAnalysisError(message);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // --- Renderização Dinâmica de Telas ---
  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard
            decks={decks}
            onCreateDeck={handleCreateDeck}
            onEditDeck={handleEditDeck}
            onDeleteDeck={handleDeleteDeck}
            onImportDeck={handleImportDeck}
          />
        );
      case 'explorer':
        return (
          <CardExplorer 
            allCards={allCards} 
            loadingCards={loadingCards} 
            errorCards={errorCards} 
            onOpenCardModal={handleOpenCardModal}
          />
        );
      case 'builder':
        return (
          <DeckBuilder
            currentDeck={currentDeck}
            allCards={allCards}
            loadingCards={loadingCards}
            errorCards={errorCards}
            onSaveDeck={handleSaveCurrentDeck}
            onCancel={() => setView('dashboard')}
            requestConfirm={requestConfirm}
            onOpenCardModal={handleOpenCardModal}
            onSelectLeader={handleSelectLeader}
            onAddCard={handleAddCard}
            onRemoveCard={handleRemoveCard}
            onRenameDeck={handleRenameDeck}
            loadingAnalysis={loadingAnalysis}
            analysisResult={analysisResult}
            analysisError={analysisError}
            onStartAnalysis={handleStartAnalysis}
            onClearAnalysis={() => { setAnalysisResult(null); setAnalysisError(null); }}
          />
        );
      case 'settings':
        return (
          <Settings 
            settings={settings} 
            onSaveSettings={handleSaveSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      {/* Header Desktop (Oculto no Celular se visualização não for Builder) */}
      <header className="hidden-mobile bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-16 items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
            ☠️
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            OPCG LAB
          </span>
        </div>

        {view !== 'builder' && (
          <nav className="flex items-center gap-1">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'dashboard' ? 'bg-blue-600/10 text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderHeart size={16} />
              Decks
            </button>
            <button 
              onClick={() => setView('explorer')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'explorer' ? 'bg-blue-600/10 text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database size={16} />
              Cartas
            </button>
            <button 
              onClick={() => setView('settings')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'settings' ? 'bg-blue-600/10 text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <SettingsIcon size={16} />
              Ajustes
            </button>
          </nav>
        )}
      </header>

      {/* Header Mobile Simplificado (Apenas Logo e Título, sem menu superior) */}
      {view !== 'builder' && (
        <header className="hidden-desktop bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-14 items-center justify-center sticky top-0 z-30">
          <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 flex items-center gap-1.5">
            ☠️ OPCG LAB
          </span>
        </header>
      )}

      {/* Área de Visualização Principal */}
      <main className="flex-1 flex flex-col">
        {renderView()}
      </main>

      {/* Barra de Navegação Inferior (Mobile-Only, Oculta na tela do Builder) */}
      {view !== 'builder' && (
        <nav className="bottom-nav md:hidden">
          <button 
            onClick={() => setView('dashboard')}
            className={`bottom-nav-item ${view === 'dashboard' ? 'active' : ''}`}
          >
            <FolderHeart size={18} />
            <span>Decks</span>
          </button>
          <button 
            onClick={() => setView('explorer')}
            className={`bottom-nav-item ${view === 'explorer' ? 'active' : ''}`}
          >
            <Database size={18} />
            <span>Cartas</span>
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`bottom-nav-item ${view === 'settings' ? 'active' : ''}`}
          >
            <SettingsIcon size={18} />
            <span>Ajustes</span>
          </button>
        </nav>
      )}

      {/* Modal Global de Carta */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => { setSelectedCard(null); setLigaPrices(null); }}
          ligaPrices={ligaPrices}
          loadingLiga={loadingLiga}
        />
      )}

      {/* Confirmação global e Toast (P2.1) */}
      {confirmState && (
        <ConfirmDialog confirm={confirmState} onClose={() => setConfirmState(null)} />
      )}
      <Toast toast={toast} />
    </div>
  );
}
