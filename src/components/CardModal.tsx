import type React from 'react';
import { X, TrendingUp, ExternalLink } from 'lucide-react';
import type { OPCard, LigaCardPrice } from '../types';

interface CardModalProps {
  card: OPCard;
  onClose: () => void;
  ligaPrices: LigaCardPrice | null;
  loadingLiga: boolean;
}

export default function CardModal({ card, onClose, ligaPrices, loadingLiga }: CardModalProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div 
        className="glass-panel w-full md:max-w-4xl overflow-hidden relative rounded-t-2xl md:rounded-2xl max-h-[95vh] md:max-h-none flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Fechar Superior (Mobile Only) */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-20">
          <span className="text-xs font-bold text-slate-500">Ficha Técnica</span>
          <button 
            onClick={onClose}
            className="p-1 bg-slate-100 border border-slate-200 rounded-full text-slate-500 hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Botão de Fechar Desktop */}
        <button 
          onClick={onClose}
          className="hidden md:block absolute top-4 right-4 p-2 bg-slate-50 border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100 transition-all z-20"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col md:flex-row overflow-y-auto md:overflow-visible">
          {/* Imagem da Carta */}
          <div className="w-full md:w-2/5 p-6 flex flex-col items-center justify-center bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex-shrink-0">
            <div className="w-full max-w-[210px] md:max-w-[260px] aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-md border border-slate-200/60 relative op-card-container">
              <img 
                src={card.card_image} 
                alt={card.card_name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-3 font-semibold">Fonte de imagem • OPTCG API</span>
          </div>

          {/* Ficha Técnica */}
          <div className="flex-1 p-5 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className={`color-badge ${card.card_color.toLowerCase()}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.card_type}</span>
                <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                  {card.rarity}
                </span>
                {card.attribute && card.attribute !== 'NULL' && (
                  <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-150 px-2.5 py-0.5 rounded-full font-bold">
                    {card.attribute}
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight leading-tight text-slate-800">{card.card_name}</h2>
              <p className="text-xs md:text-sm font-bold text-blue-600 mb-5">{card.card_set_id} | {card.set_name}</p>

              {/* Grid de Atributos */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center md:text-left">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Custo</p>
                  <p className="text-sm font-black text-slate-700">
                    {card.card_cost !== null && card.card_cost !== "NULL" ? card.card_cost : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center md:text-left">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Poder</p>
                  <p className="text-sm font-black text-slate-700">
                    {card.card_power !== null && card.card_power !== "NULL" ? card.card_power : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center md:text-left">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Counter</p>
                  <p className="text-sm font-black text-slate-700">
                    {card.counter_amount !== null ? `+${card.counter_amount}` : 'Sem'}
                  </p>
                </div>
              </div>

              {card.sub_types && card.sub_types !== "NULL" && (
                <div className="mb-4">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Categorias / Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {card.sub_types.split('/').map((sub, i) => (
                      <span key={i} className="inline-block px-2.5 py-0.5 bg-slate-50 border border-slate-150 rounded-full text-[10px] font-bold text-slate-600">
                        {sub.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {card.card_text && card.card_text !== "NULL" && (
                <div className="mb-6">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Efeito da Carta</p>
                  <p className="text-xs bg-slate-50 border border-slate-100 p-3.5 rounded-lg text-slate-655 leading-relaxed max-h-[140px] overflow-y-auto scrollbar-thin">
                    {card.card_text}
                  </p>
                </div>
              )}
            </div>

            {/* Cotações da LigaOnePiece - Otimizado UI/UX */}
            <div className="border-t border-slate-100 pt-5 mt-3 bg-gradient-to-t from-slate-50/20 to-transparent">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Preços Liga One Piece</h4>
                </div>
                {ligaPrices && (
                  <a 
                    href={ligaPrices.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 hover:text-blue-500 hover:underline flex items-center gap-0.5 font-bold"
                  >
                    Abrir Loja <ExternalLink size={10} />
                  </a>
                )}
              </div>

              {loadingLiga ? (
                <div className="py-4 text-center">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-[10px] text-slate-400">Consultando API LigaOnePiece...</p>
                </div>
              ) : ligaPrices ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  
                  {/* Edição / Sincronização */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Coleção Catalogada</span>
                      <strong className="text-slate-600 font-bold font-mono">{ligaPrices.edition_code || 'Avulso (OPCG)'}</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 rounded-md font-bold uppercase tracking-wider text-[8px]">
                      BRL (R$)
                    </span>
                  </div>

                  {/* Lista de Versões Otimizadas com Badges de Preço */}
                  {ligaPrices.versions && ligaPrices.versions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {ligaPrices.versions.map((ver, idx) => {
                        const price = ver.price_avg || ver.price_min || 0;
                        return (
                          <div key={idx} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                            <span className="text-slate-600 font-medium truncate max-w-[130px]" title={ver.version_name}>
                              {ver.version_name}
                            </span>
                            <span className="font-extrabold text-emerald-600 text-xs px-2 py-0.5 bg-emerald-50/50 border border-emerald-500/10 rounded-md">
                              R$ {price.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 p-2 bg-white border border-slate-100 rounded-lg text-slate-500 text-[11px] leading-relaxed">
                      <span className="italic">
                        {ligaPrices.message || 'Card catalogado sem preços ativos no momento.'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center py-2 border border-dashed border-slate-200 rounded-lg">
                  Preços indisponíveis em Reais (BRL) para este código no momento.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
