import { useEffect, useState } from 'react';
import { fetchLeaderMetaStats } from '../../services/api';
import type { PoneglyphLeaderMeta } from '../../services/api';
import type { OPCard } from '../../types';
import './LeaderMetaStats.css';
import { Activity, Swords } from 'lucide-react';

interface LeaderMetaStatsProps {
  leaderCard: OPCard;
  allCards: OPCard[];
}

export function LeaderMetaStats({ leaderCard, allCards }: LeaderMetaStatsProps) {
  const [stats, setStats] = useState<PoneglyphLeaderMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    // Some OPTCG cards have a format like OP01-001. We use the card_set_id
    fetchLeaderMetaStats(leaderCard.card_set_id)
      .then((data) => {
        if (isMounted) {
          if (data) setStats(data);
          else setError(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [leaderCard.card_set_id]);

  if (loading) {
    return (
      <div className="meta-stats-container loading">
        <div className="spinner-small"></div>
        <span>Carregando dados do Meta (Poneglyph)...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="meta-stats-container error">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Sem dados de Meta disponíveis para este líder no momento.
        </span>
      </div>
    );
  }

  // Helper to format winrate
  const formatWR = (wr: number | null) => {
    if (wr === null || wr === undefined) return 'N/A';
    return `${(wr * 100).toFixed(1)}%`;
  };

  const winRateClass = stats.win_rate && stats.win_rate >= 0.5 ? 'positive' : 'negative';

  // Get top 3 matchups based on games played (wins + losses)
  const topMatchups = (stats.matchups || [])
    .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
    .slice(0, 3);

  return (
    <div className="meta-stats-container">
      <div className="meta-stats-header">
        <Activity size={16} />
        <h4>Poneglyph Meta Stats</h4>
      </div>

      <div className="meta-stats-grid">
        <div className="meta-stat-box">
          <span className="stat-label">Win Rate</span>
          <span className={`stat-value ${winRateClass}`}>
            {formatWR(stats.win_rate)}
          </span>
        </div>
        <div className="meta-stat-box">
          <span className="stat-label">Share no Meta</span>
          <span className="stat-value">
            {formatWR(stats.deck_share)}
          </span>
        </div>
        <div className="meta-stat-box">
          <span className="stat-label">Amostra (Decks)</span>
          <span className="stat-value">
            {stats.decks?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {topMatchups.length > 0 && (
        <div className="meta-matchups">
          <div className="meta-matchups-header">
            <Swords size={14} />
            <h5>Principais Matchups</h5>
          </div>
          <div className="matchup-list">
            {topMatchups.map((m) => {
              const oppCard = allCards.find(c => c.card_set_id === m.opponent_card_number);
              const oppName = oppCard ? oppCard.card_name : m.opponent_card_number;
              const mWr = m.win_rate || 0;
              const mClass = mWr >= 0.5 ? 'positive' : 'negative';
              
              return (
                <div key={m.opponent_card_number} className="matchup-item">
                  <span className="matchup-name" title={oppName}>{oppName}</span>
                  <span className={`matchup-wr ${mClass}`}>{formatWR(m.win_rate)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {stats.latest_date && (
        <div className="meta-footer">
          Atualizado em: {stats.latest_date}
        </div>
      )}
    </div>
  );
}
