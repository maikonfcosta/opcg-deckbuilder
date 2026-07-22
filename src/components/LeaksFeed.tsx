import React from 'react';
import { useRedditLeaks } from '../hooks/useRedditLeaks';
import { Loader2, ExternalLink, Flame } from 'lucide-react';
import './LeaksFeed.css';

export const LeaksFeed: React.FC = () => {
  const { leaks, isLoading } = useRedditLeaks();

  if (isLoading) {
    return (
      <div className="leaks-loading-container">
        <Loader2 size={40} className="spin-wand" style={{ animation: 'spin 1s linear infinite' }} />
        <p>Buscando cartas vazadas no r/OnePieceTCG...</p>
      </div>
    );
  }

  if (leaks.length === 0) {
    return (
      <div className="leaks-empty-container">
        <p>Nenhuma novidade encontrada nos últimos dias.</p>
      </div>
    );
  }

  return (
    <div className="leaks-feed-container">
      <div className="leaks-header">
        <Flame size={24} color="var(--accent)" />
        <h2>Últimos Leaks & Spoilers</h2>
        <span className="leaks-badge">r/OnePieceTCG</span>
      </div>
      <p className="leaks-subtitle">As informações abaixo são geradas pela comunidade e podem sofrer alterações até o lançamento oficial.</p>
      
      <div className="leaks-grid">
        {leaks.map((leak) => (
          <div key={leak.id} className="leak-card glass-panel">
            <div className="leak-image-container">
              <img 
                src={leak.url} 
                alt={leak.title} 
                className="leak-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon.jpg';
                }}
              />
            </div>
            <div className="leak-content">
              <h4 className="leak-title">{leak.title}</h4>
              <div className="leak-meta">
                <span>🔥 {leak.score}</span>
                <a href={leak.permalink} target="_blank" rel="noopener noreferrer" className="leak-link">
                  Ver no Reddit <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
