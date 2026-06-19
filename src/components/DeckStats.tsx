import { useState } from 'react';
import { BarChart2, Award, Shield } from 'lucide-react';

interface DeckStatsProps {
  costCounts: { [key: string]: number };
  typeCounts: { [key: string]: number };
  counterCounts: { [key: string]: number };
  totalCards: number;
}

type StatTab = 'cost' | 'type' | 'counter';

export default function DeckStats({ costCounts, typeCounts, counterCounts, totalCards }: DeckStatsProps) {
  const [activeTab, setActiveTab] = useState<StatTab>('cost');

  const renderCostTable = () => (
    <div className="glass-panel p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curva de Custo (Don!!)</h5>
        <span className="text-[10px] text-blue-600 font-bold">Total: {totalCards} cartas</span>
      </div>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Custo</th>
            <th>Qtd</th>
            <th>Proporção</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(costCounts).map(cost => {
            const count = costCounts[cost];
            const percentage = totalCards > 0 ? (count / totalCards) * 100 : 0;
            return (
              <tr key={cost}>
                <td className="font-semibold text-slate-600">{cost}</td>
                <td className="font-bold text-blue-600">{count}</td>
                <td className="w-3/5">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderTypeTable = () => (
    <div className="glass-panel p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipos de Cartas</h5>
        <span className="text-[10px] text-purple-600 font-bold">Total: {totalCards} cartas</span>
      </div>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Qtd</th>
            <th>Proporção</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(typeCounts).map(type => {
            const count = typeCounts[type];
            const percentage = totalCards > 0 ? (count / totalCards) * 100 : 0;
            return (
              <tr key={type}>
                <td className="font-semibold text-slate-600">{type}</td>
                <td className="font-bold text-purple-600">{count}</td>
                <td className="w-3/5">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill purple" style={{ width: `${percentage}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCounterTable = () => (
    <div className="glass-panel p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Defesa (Counters)</h5>
        <span className="text-[10px] text-amber-600 font-bold">Total: {totalCards} cartas</span>
      </div>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Counter</th>
            <th>Qtd</th>
            <th>Proporção</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(counterCounts).map(counter => {
            const count = counterCounts[counter];
            const percentage = totalCards > 0 ? (count / totalCards) * 100 : 0;
            const label = counter === '0' ? 'Sem Counter' : `+${counter}`;
            return (
              <tr key={counter}>
                <td className="font-semibold text-slate-600">{label}</td>
                <td className="font-bold text-amber-600">{count}</td>
                <td className="w-3/5">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill gold" style={{ width: `${percentage}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Abas Seletoras Mobile-Friendly */}
      <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-lg">
        <button 
          onClick={() => setActiveTab('cost')}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'cost'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 size={12} /> Custo
        </button>
        <button 
          onClick={() => setActiveTab('type')}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'type'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={12} /> Tipos
        </button>
        <button 
          onClick={() => setActiveTab('counter')}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'counter'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield size={12} /> Defesa
        </button>
      </div>

      {/* Renderiza a aba ativa */}
      {activeTab === 'cost' && renderCostTable()}
      {activeTab === 'type' && renderTypeTable()}
      {activeTab === 'counter' && renderCounterTable()}
    </div>
  );
}
