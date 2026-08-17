import React, { useState } from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';
import { User } from '../types';
import { Lock, UserCheck, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'Bike One' && password === 'bikeone2026') {
      onLogin({ username: 'Bike One', role: 'Administrador' });
    } else {
      setError('Nome de utilizador ou palavra-passe incorretos!');
    }
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center bg-[#0a0b0d] px-4 py-12 text-slate-100 overflow-hidden"
      id="login-screen"
    >
      {/* Decorative bike-themed circular background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full border-[1px] border-slate-900/30 pointer-events-none animate-[spin_60s_linear_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full border-[1px] border-slate-900/30 pointer-events-none animate-[spin_80s_linear_infinite]" />

      {/* Atmospheric Background Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#111216]/95 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-4" />
          <p className="text-sm text-slate-400 text-center mt-2 font-medium">
            Sistema Integrado de Gestão de Oficina & Loja
          </p>
          <div className="mt-2 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] rounded-full font-extrabold uppercase tracking-widest border border-amber-500/25">
            Angola · Kz
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
              Nome de Utilizador
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <UserCheck className="h-4 w-4" />
              </span>
              <input
                id="username"
                type="text"
                placeholder="Ex: Bike One"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-200 placeholder-slate-500 text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
              Palavra-passe
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Insira a sua palavra-passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-200 placeholder-slate-500 text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/30 p-3 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-full text-xs shadow-lg shadow-amber-500/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            Entrar no Painel Bike One
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-600">
            © {new Date().getFullYear()} Bike One · Todos os direitos reservados.
          </p>
          <p className="text-[10px] text-amber-500/40 font-bold mt-1 uppercase tracking-wider">
            Reparação Profissional & Acessórios Premium
          </p>
        </div>
      </motion.div>
    </div>
  );
}
