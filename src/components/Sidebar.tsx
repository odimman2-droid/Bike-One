import React, { useState } from 'react';
import Logo from './Logo';
import { User } from '../types';
import { 
  Home, 
  ClipboardList, 
  Package, 
  Wrench, 
  TrendingUp, 
  LogOut,
  Menu,
  X,
  UserCheck,
  Coins,
  Settings,
  Cloud
} from 'lucide-react';

interface SidebarProps {
  user: User;
  activeView: string;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  icloudAccount?: string;
  icloudStatus?: string;
  children: React.ReactNode;
}

export default function Sidebar({
  user,
  activeView,
  onNavigate,
  onLogout,
  icloudAccount = 'odilsonn@icloud.com',
  icloudStatus = 'connected',
  children,
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', name: 'Painel Principal', icon: Home },
    { id: 'os', name: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'vendas', name: 'Vendas e Caixa', icon: Coins },
    { id: 'clientes', name: 'Clientes e Equipa', icon: UserCheck },
    { id: 'stock', name: 'Stock e Serviços', icon: Package },
    { id: 'settings', name: 'Configurações', icon: Settings },
  ] as const;

  const handleNavClick = (view: typeof navItems[number]['id']) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col md:flex-row font-sans relative overflow-hidden">
      
      {/* 1. TOP MOBILE HEADER BAR - Hidden during printing */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111216] border-b border-slate-850 z-40 shrink-0 print:hidden">
        {/* Logo in top bar */}
        <Logo size="sm" showText={true} />
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* 2. SLIDEOUT MOBILE NAVIGATION DRAWER - Hidden during printing */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden bg-black/80 backdrop-blur-sm print:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="w-72 max-w-[80vw] h-full bg-[#111216] border-r border-slate-800 p-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <Logo size="md" className="pb-4 border-b border-slate-800" />
              
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                        activeView === item.id
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-extrabold'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-transparent'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2 px-2 text-xs">
                <UserCheck className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-300 truncate">{user.username}</p>
                  <p className="text-[10px] text-slate-500">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-950/20 rounded-xl text-xs font-bold transition-all text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PERMANENT DESKTOP SIDEBAR MENU - Hidden during printing */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#111216] border-r border-slate-800 shrink-0 p-6 z-10 print:hidden">
        <div className="space-y-8">
          {/* Logo in lateral menu */}
          <Logo size="md" />

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all text-left cursor-pointer border ${
                    activeView === item.id
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-black'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-transparent'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Block and Logout */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          {/* iCloud Status Badge */}
          <div 
            onClick={() => onNavigate('settings')}
            className="flex items-center justify-between px-3 py-2 bg-sky-950/30 hover:bg-sky-950/50 border border-sky-500/25 rounded-xl text-xs cursor-pointer transition-all group"
            title="Base de Dados iCloud Conectada"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
              </span>
              <Cloud className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-sky-200 truncate leading-none">iCloud Base</p>
                <p className="text-[9px] text-sky-400/80 truncate mt-0.5">{icloudAccount}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Auto
            </span>
          </div>

          <div className="flex items-center gap-3.5 px-3 py-2 bg-[#0a0b0d]/50 border border-slate-850 rounded-xl text-xs">
            <UserCheck className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-extrabold text-slate-200 truncate leading-tight">{user.username}</p>
              <p className="text-[10px] text-slate-500 font-medium">{user.role}</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 rounded-xl text-xs font-bold transition-all text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Terminar Sessão
          </button>
        </div>
      </aside>

      {/* 4. MAIN CONTENT AREA - Expands on print */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0b0d] relative overflow-y-auto">
        {/* Atmospheric Background Overlay */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full"></div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full z-10 print:p-0 print:mx-0 print:max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
}
