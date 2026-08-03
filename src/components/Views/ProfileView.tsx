import React from 'react';
import { User, Settings2, Moon, ShieldAlert } from 'lucide-react';
import './ProfileView.css';

interface ProfileViewProps {
  onViewBanlist: () => void;
  totalCards: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onViewBanlist, totalCards }) => {
  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div className="profile-avatar">
          <User size={40} />
        </div>
        <div className="profile-info">
          <h2>Jogador OPCG</h2>
          <p>Mestre de Fusões</p>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-title">
          <Settings2 size={20} /> Preferências do App
        </h3>
        
        <div className="setting-row">
          <div className="setting-label">
            Ver Banlist Oficial
          </div>
          <button className="action-btn" onClick={onViewBanlist}>
            <ShieldAlert size={16} /> Ver Lista
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            <Moon size={18} /> Tema Escuro (Glassmorphism)
          </div>
          <div style={{ color: '#00ff80', fontWeight: 'bold' }}>ATIVO</div>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            Versão do Banco de Dados
          </div>
          <span style={{ color: 'var(--text-muted)' }}>v2.0 Poneglyph ({totalCards} Cartas)</span>
        </div>
      </div>

      <footer style={{
        marginTop: '32px',
        textAlign: 'center',
        padding: '16px',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        borderTop: '1px solid var(--border-light)'
      }}>
        Criado com <span style={{ color: 'var(--color-red)' }}>❤️</span> por Maikon Costa<br/>
        OPCG Pro © 2026
      </footer>
    </div>
  );
};
