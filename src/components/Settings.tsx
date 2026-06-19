import React, { useState } from 'react';
import { Sparkles, Key, Check } from 'lucide-react';
import type { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (apiKey: string) => void;
}

export default function Settings({ settings, onSaveSettings }: SettingsProps) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:px-6 md:py-10 animate-fade-in pb-24">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Ajustes da IA
        </h1>
        <p className="text-sm text-slate-500">Gerencie as integrações e chaves de inteligência artificial.</p>
      </div>

      <div className="glass-panel-neon-purple p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-600">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Google Gemini API</h3>
            <p className="text-xs text-slate-500">Configuração de chave do AI Studio</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Para realizar as análises estratégicas do deck (avaliando curvas de Don!!, counters de defesa e sinergias) e receber sugestões de substituições de cartas, este webapp conecta-se de forma direta à API do Gemini usando a sua própria chave pessoal.
          <br /><br />
          Sua chave é armazenada de forma estrita no <code className="text-xs text-blue-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">localStorage</code> do seu navegador e nunca passa por servidores intermediários.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Key size={14} className="text-purple-600" />
              Chave da API do Gemini
            </label>
            <input 
              type="password" 
              placeholder="Cole sua API Key aqui (começa com AIza...)" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="form-input"
            />
            <span className="text-[10px] text-slate-500 mt-2 block">
              Não possui uma chave? Crie uma de forma gratuita no{' '}
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                Google AI Studio (aistudio.google.com)
              </a>.
            </span>
          </div>

          <button 
            type="submit" 
            className="btn btn-neon-purple w-full py-3"
          >
            {saved ? (
              <span className="flex items-center gap-1">
                <Check size={18} /> Configuração Salva!
              </span>
            ) : (
              'Salvar Chave'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
