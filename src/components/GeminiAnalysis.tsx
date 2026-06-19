import { Sparkles, AlertTriangle, X, Play } from 'lucide-react';
import type { Deck } from '../types';

interface GeminiAnalysisProps {
  deck: Deck;
  loadingAnalysis: boolean;
  onStartAnalysis: () => void;
  analysisResult: string | null;
  analysisError: string | null;
  onClearAnalysis: () => void;
}

export default function GeminiAnalysis({
  deck,
  loadingAnalysis,
  onStartAnalysis,
  analysisResult,
  analysisError,
  onClearAnalysis
}: GeminiAnalysisProps) {
  
  const hasLeader = !!deck.leader;

  return (
    <div className="glass-panel p-5 border-purple-500/25">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-600 animate-pulse" size={18} />
          <h4 className="text-sm font-bold text-purple-600">Análise de IA (Gemini)</h4>
        </div>
        {(analysisResult || analysisError) && !loadingAnalysis && (
          <button
            onClick={onClearAnalysis}
            aria-label="Limpar análise"
            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Estado Inicial sem Análise */}
      {!analysisResult && !loadingAnalysis && !analysisError && (
        <div className="text-center py-4">
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Consulte o estrategista tático do Gemini para obter notas, identificar pontos fracos de curva e receber sugestões de substituições de cartas.
          </p>
          <button 
            onClick={onStartAnalysis}
            disabled={!hasLeader}
            className="btn btn-neon-purple w-full py-2.5 flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Analisar Deck com IA
          </button>
          {!hasLeader && (
            <p className="text-[10px] text-amber-600 mt-2">
              *Selecione um Líder no deck para ativar a análise de IA.
            </p>
          )}
        </div>
      )}

      {/* Estado de Carregamento */}
      {loadingAnalysis && (
        <div className="text-center py-8">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-slate-600 font-bold mb-1">Mapeando estratégias...</p>
          <p className="text-[10px] text-slate-500">A IA está avaliando sinergias de cores e curva de Don!!...</p>
        </div>
      )}

      {/* Estado de Erro */}
      {analysisError && !loadingAnalysis && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <AlertTriangle className="text-red-500 mx-auto mb-2" size={24} />
          <p className="text-xs font-bold text-red-600 mb-1">Erro na Análise</p>
          <p className="text-[11px] text-slate-500 mb-3">{analysisError}</p>
          <button 
            onClick={onStartAnalysis}
            className="btn btn-secondary py-1.5 px-4 text-xs font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Relatório de Análise renderizado */}
      {analysisResult && !loadingAnalysis && (
        <div className="markdown-content text-left text-xs max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
          {analysisResult.split('\n').map((line, i) => {
            // Renderização Markdown simples para o relatório
            const trimmed = line.trim();
            
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={i} className="text-xs font-extrabold mt-5 mb-2 text-purple-600 border-b border-slate-200 pb-1 uppercase tracking-wider">
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h3 key={i} className="text-sm font-extrabold mt-5 mb-2 text-purple-600 border-b border-slate-200 pb-1 uppercase tracking-wider">
                  {trimmed.replace('## ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('- **Retirar:**') || trimmed.startsWith('- **Adicionar:**') || trimmed.startsWith('- **Motivo:**')) {
              const boldMatch = trimmed.match(/\*\*(.*?)\*\*/);
              const restText = trimmed.replace(/\*\*(.*?)\*\*/, '');
              return (
                <p key={i} className="ml-4 text-slate-600 my-1 leading-relaxed">
                  {boldMatch ? <strong className="text-purple-700 font-bold">{boldMatch[1]}</strong> : null}
                  {restText}
                </p>
              );
            }
            if (trimmed.startsWith('- ')) {
              return (
                <li key={i} className="ml-4 text-slate-600 list-disc my-1.5 leading-relaxed">
                  {trimmed.replace('- ', '')}
                </li>
              );
            }
            if (trimmed === '') {
              return <div key={i} className="h-2" />;
            }
            return (
              <p key={i} className="my-1.5 text-slate-600 leading-relaxed">
                {trimmed}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
