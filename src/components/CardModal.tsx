import { X, TrendingUp, ExternalLink } from 'lucide-react';
import type { OPCard, LigaCardPrice } from '../types';

interface CardModalProps {
  card: OPCard;
  onClose: () => void;
  ligaPrices: LigaCardPrice | null;
  loadingLiga: boolean;
}

export default function CardModal({ card, onClose, ligaPrices, loadingLiga }: CardModalProps) {
  // Fecha ao clicar fora do modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-50 overflow-y-auto animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div 
        className="glass-panel w-full md:max-w-4xl overflow-hidden relative rounded-t-2xl md:rounded-2xl max-h-[92vh] md:max-h-none flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Fechar Superior (Mobile) */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-900 sticky top-0 z-20">
          <span className="text-xs font-bold text-slate-400">Detalhes do Card</span>
          <button 
            onClick={onClose}
            className="p-1 bg-slate-900 border border-slate-800 rounded-full text-slate-300 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Botão de Fechar Desktop */}
        <button 
          onClick={onClose}
          className="hidden md:block absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 hover:text-white transition-colors z-20"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col md:flex-row overflow-y-auto md:overflow-visible">
          {/* Imagem da Carta */}
          <div className="w-full md:w-2/5 p-6 flex flex-col items-center justify-center bg-slate-950/40 border-b md:border-b-0 md:border-r border-slate-900 flex-shrink-0">
            <div className="w-full max-w-[240px] md:max-w-[280px] aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative group op-card-container">
              <img 
                src={card.card_image} 
                alt={card.card_name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-3">Imagem original • OPTCG API</span>
          </div>

          {/* Ficha Técnica */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`color-badge ${card.card_color.toLowerCase()}`} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.card_type}</span>
                <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
                  {card.rarity}
                </span>
                {card.attribute && card.attribute !== 'NULL' && (
                  <span className="text-xs bg-slate-950 text-slate-450 border border-slate-900 px-2.5 py-0.5 rounded-full font-medium">
                    {card.attribute}
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">{card.card_name}</h2>
              <p className="text-sm font-bold text-cyan-400 mb-6">{card.card_set_id} | {card.set_name}</p>

              {/* Grid de Atributos */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg text-center md:text-left">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Custo</p>
                  <p className="text-sm md:text-base font-bold text-slate-200">
                    {card.card_cost !== null && card.card_cost !== "NULL" ? card.card_cost : '—'}
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg text-center md:text-left">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Poder</p>
                  <p className="text-sm md:text-base font-bold text-slate-200">
                    {card.card_power !== null && card.card_power !== "NULL" ? card.card_power : '—'}
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg text-center md:text-left">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Counter</p>
                  <p className="text-sm md:text-base font-bold text-slate-200">
                    {card.counter_amount !== null ? `+${card.counter_amount}` : 'Sem Counter'}
                  </p>
                </div>
              </div>

              {card.sub_types && card.sub_types !== "NULL" && (
                <div className="mb-4">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Subtipos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {card.sub_types.split('/').map((sub, i) => (
                      <span key={i} className="inline-block px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold text-slate-350">
                        {sub.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {card.card_text && card.card_text !== "NULL" && (
                <div className="mb-6">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Efeito da Carta</p>
                  <p className="text-xs md:text-sm bg-slate-900/40 border border-slate-850 p-4 rounded-lg text-slate-300 leading-relaxed max-h-[160px] overflow-y-auto">
                    {card.card_text}
                  </p>
                </div>
              )}
            </div>

            {/* Cotação LigaOnePiece */}
            <div className="border-t border-slate-900 pt-6 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-emerald-400" />
                  Liga One Piece
                </h4>
                {ligaPrices && (
                  <a 
                    href={ligaPrices.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Ver Cotações <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {loadingLiga ? (
                <div className="py-4 text-center">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-slate-500">Buscando menor preço em BRL...</p>
                </div>
              ) : ligaPrices ? (
                <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-850 text-xs">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Lançamento</p>
                      <p className="font-bold text-slate-300">{ligaPrices.edition_code || 'Avulso'}</p>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                      Preços em Reais (R$)
                    </span>
                  </div>

                  {ligaPrices.versions && ligaPrices.versions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {ligaPrices.versions.map((ver, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/20 px-2.5 py-1.5 rounded border border-slate-900/50">
                          <span className="text-slate-400 truncate max-w-[120px]" title={ver.version_name}>
                            {ver.version_name}
                          </span>
                          <span className="font-bold text-emerald-400">
                            R$ {ver.price_avg ? ver.price_avg.toFixed(2) : ver.price_min ? ver.price_min.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {ligaPrices.message || 'Carta catalogada na LigaOnePiece. Sem preços ativos cadastrados.'}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Preços indisponíveis em reais para este código.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
