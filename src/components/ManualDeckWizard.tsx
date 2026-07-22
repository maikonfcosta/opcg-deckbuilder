import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import './AutoDeckWizard.css'; // Reusing styles

interface ManualDeckWizardProps {
  allCards: any[];
  onClose: () => void;
  onComplete: (deckName: string, leaderCard: any) => void;
}

const COLORS = [
  { id: 'Red', name: 'Vermelho', hex: '#ff4b4b' },
  { id: 'Blue', name: 'Azul', hex: '#4b7bff' },
  { id: 'Green', name: 'Verde', hex: '#4bff4b' },
  { id: 'Yellow', name: 'Amarelo', hex: '#ffd54b' },
  { id: 'Black', name: 'Preto', hex: '#333333' }
];

export function ManualDeckWizard({ allCards, onClose, onComplete }: ManualDeckWizardProps) {
  const [step, setStep] = useState(1);
  const [deckName, setDeckName] = useState('Novo Deck');
  const [selectedColor, setSelectedColor] = useState('Red');
  const [selectedLeader, setSelectedLeader] = useState<any>(null);

  const availableLeaders = useMemo(() => {
    return allCards.filter(c => c.card_type === 'Leader' && c.card_color?.includes(selectedColor));
  }, [allCards, selectedColor]);

  React.useEffect(() => {
    if (selectedLeader && !selectedLeader.card_color?.includes(selectedColor)) {
       
      setSelectedLeader(null);
    }
  }, [selectedColor, selectedLeader]);

  const nextStep = () => {
    if (step === 1 && !deckName.trim()) return;
    if (step === 3 && !selectedLeader) return;
    
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      onComplete(deckName, selectedLeader);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(s => s - 1);
  };

  return (
    <div className="wizard-overlay">
      <motion.div 
        className="wizard-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button className="wizard-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="wizard-header">
          <Sparkles className="wizard-icon" size={28} />
          <h2>Assistente de Criação de Deck</h2>
          <div className="wizard-steps-indicator">
            {[1, 2, 3].map(num => (
              <div key={num} className={`step-dot ${step >= num ? 'active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="wizard-body">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="wizard-step">
                <h3>1. Dê um nome ao seu Deck</h3>
                <input 
                  type="text" 
                  className="wizard-input" 
                  value={deckName} 
                  onChange={e => setDeckName(e.target.value)}
                  placeholder="Ex: Mono Red Goku"
                  autoFocus
                />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="wizard-step">
                <h3>2. Qual será a cor do deck?</h3>
                <div className="wizard-colors">
                  {COLORS.map(c => (
                    <button 
                      key={c.id} 
                      className={`wizard-color-btn ${selectedColor === c.id ? 'active' : ''}`}
                      style={{ '--color': c.hex } as any}
                      onClick={() => setSelectedColor(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="wizard-step">
                <h3>3. Escolha o seu Líder</h3>
                <div className="wizard-leaders-grid">
                  {availableLeaders.map(leader => (
                    <motion.div 
                      key={leader.id} 
                      className={`wizard-leader-card ${selectedLeader?.id === leader.id ? 'active' : ''}`}
                      onClick={() => setSelectedLeader(leader)}
                    >
                      <img 
                        src={leader.card_image}
                        alt={leader.card_name}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/icon.jpg'; }}
                      />
                      {selectedLeader?.id === leader.id && <div className="selected-check"><Check size={16} /></div>}
                      <div className="wizard-leader-name">{leader.card_name}</div>
                      <div className="wizard-leader-color">{leader.card_color}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="wizard-footer">
          <button className="btn-secondary" onClick={prevStep} style={{ visibility: step > 1 ? 'visible' : 'hidden' }}>
            <ChevronLeft size={20} /> Voltar
          </button>
          
          <button 
            className="btn-primary" 
            onClick={nextStep}
            disabled={(step === 1 && !deckName.trim()) || (step === 3 && !selectedLeader)}
          >
            {step === 3 ? 'Começar a Construir' : 'Próximo'} {step < 3 && <ChevronRight size={20} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
