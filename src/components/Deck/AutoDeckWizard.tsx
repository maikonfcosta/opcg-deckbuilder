import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight, ChevronLeft, Check, Wand2 } from 'lucide-react';
import { BANNED_CARDS, RESTRICTED_CARDS } from '../../data/banlist';
import './AutoDeckWizard.css';

interface AutoDeckWizardProps {
  allCards: any[];
  onClose: () => void;
  onComplete: (deckName: string, cards: Record<string, number>) => void;
}

const COLORS = [
  { id: 'Red', name: 'Vermelho', hex: '#ff4b4b' },
  { id: 'Blue', name: 'Azul', hex: '#4b7bff' },
  { id: 'Green', name: 'Verde', hex: '#4bff4b' },
  { id: 'Yellow', name: 'Amarelo', hex: '#ffd54b' },
  { id: 'Black', name: 'Preto', hex: '#333333' }
];

const PLAYSTYLES = [
  { id: 'aggro', name: 'Agressivo (Aggro)', desc: 'Focado em atacar rápido com cartas de baixo custo.' },
  { id: 'balanced', name: 'Equilibrado (Midrange)', desc: 'Ataque e defesa balanceados, adaptável a qualquer situação.' },
  { id: 'control', name: 'Controle (Control)', desc: 'Focado em defender e dominar o fim do jogo com cartas pesadas.' }
];

export function AutoDeckWizard({ allCards, onClose, onComplete }: AutoDeckWizardProps) {
  const [step, setStep] = useState(1);
  const [deckName, setDeckName] = useState('Meu Deck Automático');
  const [selectedColor, setSelectedColor] = useState('Red');
  const [selectedLeader, setSelectedLeader] = useState<any>(null);
  const [playstyle, setPlaystyle] = useState('balanced');
  const [isGenerating, setIsGenerating] = useState(false);

  const [format, setFormat] = useState('standard');

  const availableLeaders = useMemo(() => {
    const filtered = allCards.filter(c => {
      if (c.card_type !== 'Leader' || !c.card_color?.includes(selectedColor)) return false;
      
      if (format === 'standard') {
        if (BANNED_CARDS.includes(c.card_set_id)) return false;
        const prefix = c.card_set_id.split('-')[0];
        const ROTATED_PREFIXES = [
          'OP01', 'OP02', 'OP03', 'OP04', 
          'ST01', 'ST02', 'ST03', 'ST04', 'ST05', 
          'ST06', 'ST07', 'ST08', 'ST09', 'ST10'
        ];
        if (ROTATED_PREFIXES.includes(prefix)) return false;
      }
      return true;
    });

    // Sort leaders by set id (chronological proxy)
    return filtered.sort((a, b) => a.card_set_id.localeCompare(b.card_set_id));
  }, [allCards, selectedColor, format]);

  // Se trocar a cor e o líder selecionado não for mais dessa cor, reseta
  React.useEffect(() => {
    if (selectedLeader && !selectedLeader.card_color?.includes(selectedColor)) {
      setSelectedLeader(null);
    }
  }, [selectedColor, selectedLeader]);

  const generateDeck = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const cards: Record<string, number> = {};
      
      // 1. Adiciona Líder (apenas 1)
      cards[selectedLeader.card_set_id] = 1;

      // 2. Definir formato Standard vs Extra
      // Em One Piece TCG, Standard futuramente rotacionará coleções antigas.
      // Por enquanto, Extra Regulation aceita TUDO, Standard bloqueia cartas banidas.
      let validPool = allCards;
      if (format === 'standard') {
        const ROTATED_PREFIXES = [
          'OP01', 'OP02', 'OP03', 'OP04', 
          'ST01', 'ST02', 'ST03', 'ST04', 'ST05', 
          'ST06', 'ST07', 'ST08', 'ST09', 'ST10'
        ];
        
        validPool = validPool.filter(c => {
          if (BANNED_CARDS.includes(c.card_set_id)) return false;
          // Rotacionar Bloco 1
          const prefix = c.card_set_id.split('-')[0];
          if (ROTATED_PREFIXES.includes(prefix)) return false;
          return true;
        });
      }

      // Pool de cartas permitidas (da cor do líder e não líderes)
      // Em OPCG as cartas do deck DEGUEM ter uma cor que esteja no Líder.
      // A API retorna cores duplas separadas por espaço (Ex: 'Blue Purple' ou 'Red Green')
      const leaderColors = selectedLeader.card_color.split(/[\s/]+/); 
      const isCardColorValid = (cardColor: string) => {
        if (!cardColor) return false;
        // O card precisa compartilhar pelo menos uma cor com o líder
        return leaderColors.some((lc: string) => cardColor.includes(lc.trim()));
      };

      const pool = validPool.filter(c => isCardColorValid(c.card_color) && c.card_type !== 'Leader');
      
      // 3. Adicionar Cartas de Counter/Combo (Aproximadamente 10-14 cartas com +2000 Counter)
      const counter2kPool = pool.filter(c => c.counter_amount === 2000 || String(c.counter_amount) === '2000' || String(c.counter_amount) === '+2000');
      
      let cardsAdded = 0;

      // Adiciona 12 cartas de 2k counter (3 playstes de 4 cópias)
      if (counter2kPool.length > 0) {
        for (let i = 0; i < 3; i++) {
          if (counter2kPool.length > 0) {
            const rIndex = Math.floor(Math.random() * counter2kPool.length);
            const c = counter2kPool[rIndex];
            cards[c.card_set_id] = 4;
            cardsAdded += 4;
            counter2kPool.splice(rIndex, 1); // remove from pool to avoid duplicate picking
          }
        }
      }

      // Remover as já adicionadas do pool normal
      const normalPool = pool.filter(c => !cards[c.card_set_id]);

      // Separar por custo (card_cost)
      const byCost = (costVal: number) => normalPool.filter(c => {
        const cNum = parseInt(c.card_cost);
        if (isNaN(cNum)) return false;
        if (costVal >= 5) return cNum >= 5;
        return cNum === costVal;
      });

      const cost1 = byCost(1);
      const cost2 = byCost(2);
      const cost3 = byCost(3);
      const cost4 = byCost(4);
      const cost5Plus = byCost(5);

      // Curvas (quantas CARTAS totais de cada custo para atingir 38 faltantes, pois 12 já foram pros 2k counter)
      const curves: Record<string, number[]> = {
        aggro: [12, 10, 8, 6, 2], // Foca no early game
        balanced: [8, 8, 8, 8, 6],
        control: [4, 8, 8, 8, 10] // Foca no late game
      };

      const targetCurve = curves[playstyle] || curves.balanced;
      const pools = [cost1, cost2, cost3, cost4, cost5Plus];

      for (let i = 0; i < pools.length; i++) {
        let needed = targetCurve[i];
        const currentPool = [...pools[i]];
        
        while (needed > 0 && currentPool.length > 0 && cardsAdded < 50) {
          const rIndex = Math.floor(Math.random() * currentPool.length);
          const card = currentPool[rIndex];
          
          const maxAllowed = format === 'standard' && RESTRICTED_CARDS.includes(card.card_set_id) ? 1 : 4;
          const maxAdd = Math.min(maxAllowed, needed, 50 - cardsAdded);
          
          cards[card.card_set_id] = (cards[card.card_set_id] || 0) + maxAdd;
          needed -= maxAdd;
          cardsAdded += maxAdd;
          
          // Remove from pool
          currentPool.splice(rIndex, 1);
        }
      }

      // Se sobrou espaço (falta carta na cor?), preenche com o que der
      const fallbackPool = [...normalPool];
      while (cardsAdded < 50 && fallbackPool.length > 0) {
        const rIndex = Math.floor(Math.random() * fallbackPool.length);
        const card = fallbackPool[rIndex];
        const currentQty = cards[card.card_set_id] || 0;
        
        const maxAllowed = format === 'standard' && RESTRICTED_CARDS.includes(card.card_set_id) ? 1 : 4;
        
        if (currentQty < maxAllowed) {
          const addAmt = Math.min(maxAllowed - currentQty, 50 - cardsAdded);
          cards[card.card_set_id] = currentQty + addAmt;
          cardsAdded += addAmt;
        }
        fallbackPool.splice(rIndex, 1);
      }

      onComplete(deckName, cards);
    }, 2000);
  };

  const nextStep = () => {
    if (step === 1 && !deckName.trim()) return;
    if (step === 3 && !selectedLeader) return;
    if (step < 4) setStep(s => s + 1);
    else generateDeck();
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
        <button className="wizard-close" onClick={onClose} disabled={isGenerating}>
          <X size={24} />
        </button>

        {isGenerating ? (
          <div className="wizard-generating">
            <Wand2 size={64} className="spin-wand" />
            <h2>Montando o seu deck ideal...</h2>
            <p>Analisando combos, ajustando a curva de custo e separando as melhores cartas.</p>
            <div className="wizard-progress-bar">
              <motion.div 
                className="wizard-progress-fill"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="wizard-header">
              <Sparkles className="wizard-icon" size={28} />
              <h2>Assistente de Deck Inteligente</h2>
              <div className="wizard-steps-indicator">
                {[1, 2, 3, 4].map(num => (
                  <div key={num} className={`step-dot ${step >= num ? 'active' : ''}`} />
                ))}
              </div>
            </div>

            <div className="wizard-body">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="wizard-step">
                    <h3>1. Formato e Nome do Deck</h3>
                    <div className="wizard-format-toggle" style={{ display: 'flex', gap: '16px', marginBottom: '16px', justifyContent: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="format" value="standard" checked={format === 'standard'} onChange={() => setFormat('standard')} />
                        <span style={{ color: 'var(--text)' }}>Standard (Padrão)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="format" value="extra" checked={format === 'extra'} onChange={() => setFormat('extra')} />
                        <span style={{ color: 'var(--text)' }}>Extra Regulation</span>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      className="wizard-input" 
                      value={deckName} 
                      onChange={e => setDeckName(e.target.value)}
                      placeholder="Ex: Mono Red Zoro"
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
                      {availableLeaders.map((leader, index) => (
                        <div 
                          key={`${leader.card_set_id}-${index}`} 
                          className={`wizard-leader-card ${selectedLeader?.card_set_id === leader.card_set_id ? 'active' : ''}`}
                          onClick={() => setSelectedLeader(leader)}
                        >
                          <img 
                            src={leader.card_image}
                            alt={leader.card_name}
                            loading="lazy"
                          />
                          {selectedLeader?.card_set_id === leader.card_set_id && <div className="selected-check"><Check size={16} /></div>}
                          <div className="wizard-leader-name">{leader.card_name}</div>
                          <div className="wizard-leader-color">{leader.card_color}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {step === 4 && (
                  <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="wizard-step">
                    <h3>4. Qual o seu estilo de jogo?</h3>
                    <div className="wizard-playstyles">
                      {PLAYSTYLES.map(p => (
                        <div 
                          key={p.id}
                          className={`wizard-playstyle-card ${playstyle === p.id ? 'active' : ''}`}
                          onClick={() => setPlaystyle(p.id)}
                        >
                          <h4>{p.name}</h4>
                          <p>{p.desc}</p>
                        </div>
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
                {step === 4 ? 'Gerar Deck' : 'Próximo'} {step < 4 && <ChevronRight size={20} />}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
