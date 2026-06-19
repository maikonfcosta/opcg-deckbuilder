import { Plus, PlusCircle, Trash2, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Deck } from '../types';

interface DashboardProps {
  decks: Deck[];
  onCreateDeck: () => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string, e: React.MouseEvent) => void;
}

export default function Dashboard({ decks, onCreateDeck, onEditDeck, onDeleteDeck }: DashboardProps) {
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 text-center sm:text-left">
        <div>
          <h1 className="text-4xl font-extrabold mb-1.5 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            OPCG Deck Lab
          </h1>
          <p className="text-sm text-slate-400">Monte, valide e otimize seus decks com inteligência artificial.</p>
        </div>
        <button 
          onClick={onCreateDeck}
          className="btn btn-primary py-3 px-5 shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          Criar Deck
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card para Criar Novo Deck */}
        <div 
          onClick={onCreateDeck}
          className="glass-panel-neon-blue p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] hover:-translate-y-1 transition-all"
        >
          <div className="w-14 h-14 rounded-full bg-cyan-950/50 flex items-center justify-center border border-cyan-500/30 text-cyan-400 mb-4 shadow-inner">
            <PlusCircle size={28} />
          </div>
          <h3 className="text-xl font-bold mb-1 text-slate-100">Criar Novo Deck</h3>
          <p className="text-xs text-slate-400">Monte seu deck principal aplicando as regras do OPCG.</p>
        </div>

        {/* Decks Criados */}
        {decks.map(deck => {
          const cardCount = Object.values(deck.cards).reduce((sum, entry) => sum + entry.count, 0);
          return (
            <div 
              key={deck.id}
              onClick={() => onEditDeck(deck)}
              className="glass-panel p-6 cursor-pointer flex flex-col justify-between min-h-[200px] relative group overflow-hidden hover:-translate-y-1 transition-all"
            >
              {/* Leader watermark back */}
              {deck.leader && (
                <div 
                  className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 pointer-events-none bg-cover bg-center transition-opacity group-hover:opacity-30" 
                  style={{ backgroundImage: `url(${deck.leader.card_image})` }}
                />
              )}

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 pr-6">
                    <h3 className="text-lg font-bold text-slate-100 truncate group-hover:text-cyan-400 transition-colors">
                      {deck.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Salvo: {new Date(deck.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => onDeleteDeck(deck.id, e)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-950/20 absolute top-4 right-4 z-10"
                    title="Excluir deck"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  {deck.leader ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-11 rounded border border-yellow-500/50 overflow-hidden bg-slate-900 flex-shrink-0">
                        <img src={deck.leader.card_image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Líder</p>
                        <p className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{deck.leader.card_name}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-yellow-500/80 flex items-center gap-1 font-semibold">
                      <AlertTriangle size={14} /> Sem Líder definido
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-900/80 pt-4">
                <span className="text-xs font-bold text-slate-450">
                  {cardCount} / 50 cartas
                </span>
                <span className="text-xs text-cyan-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Editar <ChevronRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {decks.length === 0 && (
        <div className="text-center py-16 max-w-sm mx-auto">
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Nenhum deck personalizado criado ainda. Clique em "Criar Deck" para montar sua primeira estratégia!
          </p>
        </div>
      )}
    </div>
  );
}
