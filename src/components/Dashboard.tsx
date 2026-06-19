import React, { useRef } from 'react';
import { Plus, PlusCircle, Trash2, ChevronRight, AlertTriangle, Upload } from 'lucide-react';
import type { Deck } from '../types';

interface DashboardProps {
  decks: Deck[];
  onCreateDeck: () => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string, e: React.MouseEvent) => void;
  onImportDeck: (file: File) => void;
}

export default function Dashboard({ decks, onCreateDeck, onEditDeck, onDeleteDeck, onImportDeck }: DashboardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportDeck(file);
    e.target.value = ''; // permite reimportar o mesmo arquivo
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 md:px-8 animate-fade-in pb-24">
      
      {/* Seção Hero Estilizada (Clean Premium Hero) */}
      <div className="relative overflow-hidden glass-panel p-6 md:p-10 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-blue-50/50 via-white to-slate-50">
        {/* Glow de fundo sutil */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/3 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex-1 text-center md:text-left min-w-0 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">
            🏴‍☠️ One Piece Card Game
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600">
            Monte os Decks de Torneio Mais Fortes
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-xl leading-relaxed">
            Seja você um fã de Zoro, Luffy ou Law: monte suas listas, visualize curvas estatísticas de Don!! e melhore suas chances de vitória nos campeonatos com análise avançada do Gemini.
          </p>
        </div>

        <div className="flex-shrink-0 z-10 w-full md:w-auto flex justify-center">
          <button 
            onClick={onCreateDeck}
            className="btn btn-primary py-3.5 px-6 shadow-xl text-sm font-extrabold flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <Plus size={18} />
            Construir Novo Deck
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800 border-l-2 border-blue-600 pl-2.5">
          Meus Decks Salvos ({decks.length})
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary py-1.5 px-3 text-xs"
        >
          <Upload size={14} /> Importar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Importar deck a partir de arquivo JSON"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Criar Deck */}
        <div 
          onClick={onCreateDeck}
          className="glass-panel-neon-blue p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px] hover:-translate-y-1 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-blue-600 mb-3 shadow-inner group-hover:scale-105 transition-transform">
            <PlusCircle size={24} />
          </div>
          <h3 className="text-lg font-bold mb-1 text-slate-800 group-hover:text-blue-600 transition-colors">Criar do Zero</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px]">Crie sua lista de cartas validando regras de torneio.</p>
        </div>

        {/* Decks Criados */}
        {decks.map(deck => {
          const cardCount = Object.values(deck.cards).reduce((sum, entry) => sum + entry.count, 0);
          return (
            <div 
              key={deck.id}
              onClick={() => onEditDeck(deck)}
              className="glass-panel p-6 cursor-pointer flex flex-col justify-between min-h-[180px] relative group overflow-hidden hover:-translate-y-1 transition-all"
            >
              {/* Leader Watermark Mascarada com Fade Gradual da Direita para a Esquerda */}
              {deck.leader && (
                <div 
                  className="absolute right-0 bottom-0 top-0 w-2/5 opacity-15 pointer-events-none bg-cover bg-center transition-all group-hover:opacity-25" 
                  style={{ 
                    backgroundImage: `url(${deck.leader.card_image})`,
                    maskImage: 'linear-gradient(to left, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)'
                  }}
                />
              )}

              <div className="z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 pr-4">
                    <h3 className="text-base font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {deck.name}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      Atualizado: {new Date(deck.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => onDeleteDeck(deck.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 absolute top-5 right-5 z-20"
                    title="Excluir deck"
                    aria-label={`Excluir deck ${deck.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {deck.leader ? (
                    <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 max-w-[180px]">
                      <div className="w-6 h-8 rounded border border-amber-500/40 overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={deck.leader.card_image} alt={deck.leader.card_name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 truncate">{deck.leader.card_name}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-yellow-600 flex items-center gap-1 font-semibold">
                      <AlertTriangle size={12} /> Sem Líder definido
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 z-10">
                <span className="text-[11px] font-bold text-slate-500">
                  {cardCount} / 50 cartas
                </span>
                <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Otimizar Deck <ChevronRight size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {decks.length === 0 && (
        <div className="text-center py-12 max-w-sm mx-auto">
          <p className="text-xs text-slate-500 leading-relaxed">
            Seu laboratório de decks está vazio. Crie seu primeiro deck no botão acima!
          </p>
        </div>
      )}
    </div>
  );
}
