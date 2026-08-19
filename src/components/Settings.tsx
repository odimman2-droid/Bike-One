import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Shield, 
  RefreshCw, 
  Trash2, 
  Coins, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Store, 
  Server, 
  ArrowDownToLine, 
  ArrowUpToLine, 
  Cloud, 
  Download, 
  Lock, 
  Check, 
  Layers,
  Phone,
  Mail,
  HardDrive
} from 'lucide-react';
import { checkServerHealth } from '../lib/api';
import { getICloudConfig, saveICloudConfig, checkICloudConnection, exportICloudBackupFile, ICloudConfig } from '../lib/icloud';
import { getGoogleCloudConfig, saveGoogleCloudConfig, checkGoogleCloudConnection, exportGoogleCloudBackupFile, GoogleCloudConfig } from '../lib/googleCloud';

interface SettingsProps {
  baseBalance: number;
  onUpdateBaseBalance: (newBalance: number) => void;
  onResetAllData: () => void;
  onResetBalanceOnly: () => void;
  serverOnline?: boolean;
  lastServerSync?: Date;
  onPullFromServer?: () => Promise<boolean>;
  onPushToServer?: () => Promise<boolean>;
  icloudConfig?: ICloudConfig;
  lastICloudSync?: Date;
  onPullFromICloud?: () => Promise<boolean>;
  onPushToICloud?: () => Promise<boolean>;
  googleConfig?: GoogleCloudConfig;
  lastGoogleSync?: Date;
  onPullFromGoogle?: () => Promise<boolean>;
  onPushToGoogle?: () => Promise<boolean>;
  allAppData?: any;
}

export default function SettingsView({
  baseBalance,
  onUpdateBaseBalance,
  onResetAllData,
  onResetBalanceOnly,
  serverOnline = true,
  lastServerSync,
  onPullFromServer,
  onPushToServer,
  icloudConfig,
  lastICloudSync,
  onPullFromICloud,
  onPushToICloud,
  googleConfig,
  lastGoogleSync,
  onPullFromGoogle,
  onPushToGoogle,
  allAppData
}: SettingsProps) {
  const [balanceInput, setBalanceInput] = useState(baseBalance.toString());
  const [shopName, setShopName] = useState(() => localStorage.getItem('bikeone_shop_name') || 'BIKE ONE');
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem('bikeone_shop_phone') || '+244 941 448 677');
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem('bikeone_shop_address') || 'Avenida Pedro de Castro Van-Dúnem Loy, Luanda');
  const [shopNif, setShopNif] = useState(() => localStorage.getItem('bikeone_shop_nif') || '500123456');

  const [saveSuccess, setSaveSuccess] = useState('');

  const handleSaveShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bikeone_shop_name', shopName);
    localStorage.setItem('bikeone_shop_phone', shopPhone);
    localStorage.setItem('bikeone_shop_address', shopAddress);
    localStorage.setItem('bikeone_shop_nif', shopNif);

    const parsedBalance = parseFloat(balanceInput);
    if (!isNaN(parsedBalance) && parsedBalance >= 0) {
      onUpdateBaseBalance(parsedBalance);
    }

    setSaveSuccess('Configurações salvas com sucesso!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleResetAllClick = () => {
    onResetAllData();
    setBalanceInput('0');
    setSaveSuccess('Todos os dados foram reiniciados com sucesso!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleResetBalanceClick = () => {
    onResetBalanceOnly();
    setBalanceInput('0');
    setSaveSuccess('O saldo disponível foi zerado com sucesso!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // Currency helper
  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  return (
    <div className="space-y-8" id="settings-view">
      {/* 1. Header */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5 tracking-tight">
            <Settings className="h-7 w-7 text-amber-500" />
            Configurações & Base de Dados
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persistência permanente central, contas Google & iCloud, e definições da loja.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3"
        >
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{saveSuccess}</span>
        </motion.div>
      )}

      {/* 2. Top Grid: Shop Info & Financial Adjustments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Dados da Loja */}
        <div className="bg-[#111216]/60 border border-slate-800/80 p-6 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
                Dados da Oficina & Loja
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Informações impressas em faturas e ordens de serviço.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveShopInfo} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                Nome Comercial
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 font-bold"
                placeholder="Ex: BIKE ONE"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  Contacto Telefónico / WhatsApp
                </label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono"
                  placeholder="+244 941 448 677"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  NIF Fiscal
                </label>
                <input
                  type="text"
                  value={shopNif}
                  onChange={(e) => setShopNif(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono"
                  placeholder="500123456"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                Endereço / Localização
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
                placeholder="Avenida Pedro de Castro Van-Dúnem Loy, Luanda"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20"
              >
                <Save className="h-4 w-4" />
                Salvar Informações da Loja
              </button>
            </div>
          </form>
        </div>

        {/* Right: Saldo Base & Ações Perigosas */}
        <div className="bg-[#111216]/60 border border-slate-800/80 p-6 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
                  Fundo de Maneio & Base Financeira
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ajuste o valor inicial de abertura ou reinicie contadores.
                </p>
              </div>
            </div>

            <div className="bg-[#0a0b0d]/50 p-4 border border-slate-850 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Saldo Base Cadastrado
                </span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {formatKz(baseBalance)}
                </span>
              </div>
              <div className="w-40">
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Novo Saldo Base (Kz)</label>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-full bg-[#111216] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-rose-950/10 border border-rose-950/30 p-5 rounded-2xl space-y-3">
            <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Ações de Limpeza de Dados
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                id="reset-balance-only-btn"
                type="button"
                onClick={handleResetBalanceClick}
                className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-900/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Coins className="h-4 w-4 shrink-0 text-rose-500" />
                Zerar Saldo
              </button>

              <button
                id="reset-all-system-data-btn"
                type="button"
                onClick={handleResetAllClick}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-lg shadow-rose-950/35"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Resetar Tudo
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. GOOGLE CLOUD PERSISTENCE PANEL (odimman.2@gmail.com / 941448677) */}
      <GoogleCloudSyncPanel
        config={googleConfig}
        lastSync={lastGoogleSync}
        onPullFromGoogle={onPullFromGoogle}
        onPushToGoogle={onPushToGoogle}
        allData={allAppData}
      />

      {/* 4. APPLE ICLOUD & CLOUDKIT PERMANENT DATABASE PANEL (odilsonn@icloud.com) */}
      <ICloudSyncPanel
        config={icloudConfig}
        lastSync={lastICloudSync}
        onPullFromICloud={onPullFromICloud}
        onPushToICloud={onPushToICloud}
        allData={allAppData}
      />

      {/* 5. CENTRAL SERVER BACKEND PERSISTENCE PANEL */}
      <CentralServerPanel
        serverOnline={serverOnline}
        lastServerSync={lastServerSync}
        onPullFromServer={onPullFromServer}
        onPushToServer={onPushToServer}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponent: Google Cloud Database Panel (odimman.2@gmail.com / 941448677)
// ----------------------------------------------------------------------
interface GoogleCloudSyncPanelProps {
  config?: GoogleCloudConfig;
  lastSync?: Date;
  onPullFromGoogle?: () => Promise<boolean>;
  onPushToGoogle?: () => Promise<boolean>;
  allData?: any;
}

function GoogleCloudSyncPanel({
  config: initialConfig,
  lastSync,
  onPullFromGoogle,
  onPushToGoogle,
  allData
}: GoogleCloudSyncPanelProps) {
  const [config, setConfig] = useState<GoogleCloudConfig>(() => initialConfig || getGoogleCloudConfig());
  const [syncing, setSyncing] = useState<'pull' | 'push' | 'check' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSync ?? true);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleCheckConnection = async () => {
    setSyncing('check');
    try {
      const res = await checkGoogleCloudConnection();
      if (res.connected) {
        setFeedback({
          type: 'success',
          msg: `Google Cloud conectado com sucesso à conta ${res.account}!`
        });
        setConfig(getGoogleCloudConfig());
      } else {
        setFeedback({
          type: 'error',
          msg: 'Falha ao verificar conexão com o Google Cloud.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        msg: 'Erro ao contactar o serviço Google Cloud.'
      });
    } finally {
      setSyncing(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handlePush = async () => {
    if (!onPushToGoogle) return;
    setSyncing('push');
    try {
      const ok = await onPushToGoogle();
      if (ok) {
        setFeedback({
          type: 'success',
          msg: 'Todos os dados locais foram salvos com sucesso na conta Google (odimman.2@gmail.com)!'
        });
        setConfig(getGoogleCloudConfig());
      } else {
        setFeedback({
          type: 'error',
          msg: 'Não foi possível completar o envio para o Google Cloud.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        msg: 'Erro durante o envio para o Google Cloud.'
      });
    } finally {
      setSyncing(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handlePull = async () => {
    if (!onPullFromGoogle) return;
    setSyncing('pull');
    try {
      const ok = await onPullFromGoogle();
      if (ok) {
        setFeedback({
          type: 'success',
          msg: 'Dados restaurados da base de dados Google Cloud com sucesso!'
        });
        setConfig(getGoogleCloudConfig());
      } else {
        setFeedback({
          type: 'error',
          msg: 'Nenhum dado recuperado ou erro ao carregar do Google Cloud.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        msg: 'Erro ao carregar dados do Google Cloud.'
      });
    } finally {
      setSyncing(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSyncEnabled;
    setAutoSyncEnabled(nextVal);
    saveGoogleCloudConfig({ autoSync: nextVal });
    setFeedback({
      type: 'success',
      msg: nextVal 
        ? 'Auto-Save Google Cloud Ativado: Qualquer alteração será guardada em tempo real.'
        : 'Auto-Save Google Cloud Pausado.'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleExportBackup = () => {
    exportGoogleCloudBackupFile(allData);
    setFeedback({
      type: 'success',
      msg: 'Ficheiro de backup JSON Google Cloud gerado e descarregado com sucesso!'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="bg-[#111216]/80 border-2 border-emerald-500/40 p-6 rounded-3xl space-y-6 shadow-xl shadow-emerald-950/20" id="google-cloud-database-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-850 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 text-emerald-400 border border-emerald-500/30 rounded-2xl shadow-inner">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-black text-slate-100 uppercase tracking-tight">
                Google Cloud Database - Persistência Permanente
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                Oficial & Ativo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Guarda permanente em nuvem central vinculada à conta Google e número da loja.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCheckConnection}
            disabled={syncing !== null}
            className="px-3.5 py-2 bg-[#0a0b0d] hover:bg-slate-900 text-slate-200 text-xs font-bold border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${syncing === 'check' ? 'animate-spin' : ''}`} />
            {syncing === 'check' ? 'A verificar...' : 'Testar Conexão Google'}
          </button>

          <button
            onClick={handleToggleAutoSync}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
              autoSyncEnabled 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoSyncEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            {autoSyncEnabled ? 'Auto-Save Ativo' : 'Auto-Save Pausado'}
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />}
          <span>{feedback.msg}</span>
        </motion.div>
      )}

      {/* Connection Info & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-800/80 rounded-2xl space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conta Google Vinculada</span>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-100 font-bold truncate">
            <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate">{config.accountEmail}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
            <Phone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>{config.phone}</span>
          </div>
          <p className="text-[10px] text-slate-500 pt-1">
            Garante que múltiplos utilizadores visualizem sempre a versão mais recente em tempo real.
          </p>
        </div>

        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-800/80 rounded-2xl space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado da Base de Dados</span>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-slate-100">Permanente & Sincronizado</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Último salvamento: {lastSync ? lastSync.toLocaleTimeString('pt-AO') : (config.lastSyncedAt ? new Date(config.lastSyncedAt).toLocaleTimeString('pt-AO') : 'Agora')}
          </p>
        </div>

        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-800/80 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resumo de Registos</span>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Stock Peças</span>
              <span className="font-bold text-slate-100 text-sm">{config.recordsCount.products || 'Todos'}</span>
            </div>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Ordens de Serviço</span>
              <span className="font-bold text-emerald-300 text-sm">{config.recordsCount.workOrders || 'Todas'}</span>
            </div>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Vendas Diretas</span>
              <span className="font-bold text-amber-300 text-sm">{config.recordsCount.directSales || 'Todas'}</span>
            </div>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Movimentos Caixa</span>
              <span className="font-bold text-purple-300 text-sm">{config.recordsCount.expenses || 'Ativos'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handlePush}
          disabled={syncing !== null}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <ArrowUpToLine className={`h-4 w-4 ${syncing === 'push' ? 'animate-bounce' : ''}`} />
          {syncing === 'push' ? 'A gravar no Google Cloud...' : 'Forçar Gravação Imediata no Google Cloud'}
        </button>

        <button
          onClick={handlePull}
          disabled={syncing !== null}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
        >
          <ArrowDownToLine className={`h-4 w-4 text-emerald-400 ${syncing === 'pull' ? 'animate-bounce' : ''}`} />
          {syncing === 'pull' ? 'A descarregar...' : 'Recarregar Dados do Google Cloud'}
        </button>

        <button
          onClick={handleExportBackup}
          className="px-4 py-2.5 bg-[#0a0b0d] hover:bg-slate-900 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-800 ml-auto"
        >
          <Download className="h-4 w-4 text-slate-400" />
          Exportar Backup Google (.json)
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponent: Apple iCloud & CloudKit Database Panel (odilsonn@icloud.com)
// ----------------------------------------------------------------------
interface ICloudSyncPanelProps {
  config?: ICloudConfig;
  lastSync?: Date;
  onPullFromICloud?: () => Promise<boolean>;
  onPushToICloud?: () => Promise<boolean>;
  allData?: any;
}

function ICloudSyncPanel({
  config: initialConfig,
  lastSync,
  onPullFromICloud,
  onPushToICloud,
  allData
}: ICloudSyncPanelProps) {
  const [config, setConfig] = useState<ICloudConfig>(() => initialConfig || getICloudConfig());
  const [syncing, setSyncing] = useState<'pull' | 'push' | 'check' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSync ?? true);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleCheckConnection = async () => {
    setSyncing('check');
    try {
      const res = await checkICloudConnection();
      if (res.connected) {
        setFeedback({
          type: 'success',
          msg: `iCloud conectado com sucesso à conta ${res.account}!`
        });
        setConfig(getICloudConfig());
      } else {
        setFeedback({
          type: 'error',
          msg: 'Falha ao verificar conexão com o iCloud.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        msg: 'Erro ao contactar o serviço iCloud.'
      });
    } finally {
      setSyncing(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handlePush = async () => {
    if (!onPushToICloud) return;
    setSyncing('push');
    try {
      const ok = await onPushToICloud();
      if (ok) {
        setFeedback({
          type: 'success',
          msg: 'Todos os dados locais foram salvos com sucesso na sua conta iCloud!'
        });
        setConfig(getICloudConfig());
      } else {
        setFeedback({
          type: 'error',
          msg: 'Não foi possível completar o envio para o iCloud.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        msg: 'Erro durante o envio para o iCloud.'
      });
    } finally {
      setSyncing(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handlePull = async () => {
    if (!onPullFromICloud) return;
    setSyncing('pull');
    try {
      const ok = await onPullFromICloud();
      if (ok) {
        setFeedback({
          type: 'success',
          msg: 'Dados restaurados da base de dados iCloud com sucesso!'
        });
        setConfig(getICloudConfig());
      } else {
        setFeedback({
          type: 'error',
          msg: 'Nenhum dado recuperado ou erro ao carregar do iCloud.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        msg: 'Erro ao carregar dados do iCloud.'
      });
    } finally {
      setSyncing(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSyncEnabled;
    setAutoSyncEnabled(nextVal);
    saveICloudConfig({ autoSync: nextVal });
    setFeedback({
      type: 'success',
      msg: nextVal 
        ? 'Auto-Save iCloud Ativado: Qualquer alteração será persistida automaticamente.'
        : 'Auto-Save iCloud Pausado.'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleExportBackup = () => {
    exportICloudBackupFile(allData);
    setFeedback({
      type: 'success',
      msg: 'Ficheiro de backup JSON do iCloud gerado e descarregado com sucesso!'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="bg-[#111216]/80 border-2 border-sky-500/40 p-6 rounded-3xl space-y-6 shadow-xl shadow-sky-950/20" id="icloud-database-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-850 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 border border-sky-500/30 rounded-2xl shadow-inner">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-black text-slate-100 uppercase tracking-tight">
                Apple iCloud CloudKit - Base de Dados Permanente
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-md">
                Oficial
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Base de dados permanente da Apple sincronizada em tempo real (odilsonn@icloud.com).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCheckConnection}
            disabled={syncing !== null}
            className="px-3.5 py-2 bg-[#0a0b0d] hover:bg-slate-900 text-slate-200 text-xs font-bold border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-sky-400 ${syncing === 'check' ? 'animate-spin' : ''}`} />
            {syncing === 'check' ? 'A verificar...' : 'Testar Conexão'}
          </button>

          <button
            onClick={handleToggleAutoSync}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
              autoSyncEnabled 
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoSyncEnabled ? 'bg-sky-400 animate-ping' : 'bg-slate-500'}`} />
            {autoSyncEnabled ? 'Auto-Save Ativo' : 'Auto-Save Pausado'}
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />}
          <span>{feedback.msg}</span>
        </motion.div>
      )}

      {/* Connection Info & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-800/80 rounded-2xl space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conta iCloud Vinculada</span>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-100 font-bold truncate">
            <Lock className="h-4 w-4 text-sky-400 shrink-0" />
            <span className="truncate">{config.accountEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Layers className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{config.containerId}</span>
          </div>
          <p className="text-[10px] text-slate-500 pt-1">
            Sincronização persistente para qualquer alteração efetuada na loja.
          </p>
        </div>

        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-800/80 rounded-2xl space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado do Servidor iCloud</span>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-slate-100">Base Ativa & Sincronizada</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Último registo: {lastSync ? lastSync.toLocaleTimeString('pt-AO') : (config.lastSyncedAt ? new Date(config.lastSyncedAt).toLocaleTimeString('pt-AO') : 'Agora')}
          </p>
        </div>

        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-800/80 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resumo de Registos iCloud</span>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Stock Peças</span>
              <span className="font-bold text-slate-100 text-sm">{config.recordsCount.products || 'Todos'}</span>
            </div>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Ordens de Serviço</span>
              <span className="font-bold text-emerald-300 text-sm">{config.recordsCount.workOrders || 'Todas'}</span>
            </div>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Vendas Diretas</span>
              <span className="font-bold text-amber-300 text-sm">{config.recordsCount.directSales || 'Todas'}</span>
            </div>
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Movimentos Caixa</span>
              <span className="font-bold text-purple-300 text-sm">{config.recordsCount.expenses || 'Ativos'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handlePush}
          disabled={syncing !== null}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
        >
          <ArrowUpToLine className={`h-4 w-4 ${syncing === 'push' ? 'animate-bounce' : ''}`} />
          {syncing === 'push' ? 'A gravar no iCloud...' : 'Forçar Gravação Imediata no iCloud'}
        </button>

        <button
          onClick={handlePull}
          disabled={syncing !== null}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
        >
          <ArrowDownToLine className={`h-4 w-4 text-sky-400 ${syncing === 'pull' ? 'animate-bounce' : ''}`} />
          {syncing === 'pull' ? 'A descarregar...' : 'Recarregar Dados do iCloud'}
        </button>

        <button
          onClick={handleExportBackup}
          className="px-4 py-2.5 bg-[#0a0b0d] hover:bg-slate-900 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-800 ml-auto"
        >
          <Download className="h-4 w-4 text-slate-400" />
          Exportar Backup iCloud (.json)
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponent: Central Backend Server Panel (/api/products & /api/sync)
// ----------------------------------------------------------------------
interface CentralServerPanelProps {
  serverOnline: boolean;
  lastServerSync?: Date;
  onPullFromServer?: () => Promise<boolean>;
  onPushToServer?: () => Promise<boolean>;
}

function CentralServerPanel({
  serverOnline,
  lastServerSync,
  onPullFromServer,
  onPushToServer
}: CentralServerPanelProps) {
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState<'pull' | 'push' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isLive, setIsLive] = useState(serverOnline);

  useEffect(() => {
    setIsLive(serverOnline);
  }, [serverOnline]);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const ok = await checkServerHealth();
      setIsLive(ok);
      if (ok) {
        setFeedback('Servidor Central operacional (/api/products & /api/sync)!');
      } else {
        setFeedback('Não foi possível contactar o servidor backend.');
      }
    } catch {
      setIsLive(false);
      setFeedback('Erro ao contactar o servidor.');
    } finally {
      setChecking(false);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  const handlePull = async () => {
    if (!onPullFromServer) return;
    setSyncing('pull');
    const ok = await onPullFromServer();
    if (ok) {
      setFeedback('Dados descarregados do Servidor Central com sucesso!');
    } else {
      setFeedback('Falha ao descarregar dados do servidor.');
    }
    setSyncing(null);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handlePush = async () => {
    if (!onPushToServer) return;
    setSyncing('push');
    const ok = await onPushToServer();
    if (ok) {
      setFeedback('Dados locais enviados e persistidos no Servidor Central!');
    } else {
      setFeedback('Falha ao enviar dados para o servidor.');
    }
    setSyncing(null);
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="bg-[#111216]/60 border border-amber-500/30 p-6 rounded-3xl space-y-6" id="central-server-panel">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-850 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Servidor Central & Persistência Multi-Dispositivos (/api/products)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sincronização em tempo real para múltiplos computadores, telemóveis e tablets na oficina.
            </p>
          </div>
        </div>

        <button
          onClick={checkHealth}
          disabled={checking}
          className="px-4 py-2 bg-[#0a0b0d] hover:bg-slate-900 text-slate-200 text-xs font-bold border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-2 self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-amber-500 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'A verificar...' : 'Testar Servidor'}
        </button>
      </div>

      {feedback && (
        <div className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status */}
        <div className="bg-[#0a0b0d]/60 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Estado do Servidor</span>
          <div className="flex items-center gap-3 py-1">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isLive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <div>
              <span className="text-xs font-black text-slate-100 block">
                {isLive ? 'Conectado & Sincronizado' : 'Servidor Offline'}
              </span>
              <span className="text-[10px] text-slate-400">
                Última sincronização: {lastServerSync ? lastServerSync.toLocaleTimeString('pt-AO') : 'Agora'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Atualização periódica automática ativa a cada 6s e sempre que retornar à página.
          </p>
        </div>

        {/* Endpoints */}
        <div className="bg-[#0a0b0d]/60 p-4 border border-slate-850 rounded-2xl space-y-2 font-mono text-[11px] md:col-span-2">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-sans block mb-1">
            Rotas REST Centrais Ativas
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-900/50 border border-slate-850 rounded-lg flex items-center justify-between">
              <span className="text-emerald-400 font-bold">GET/POST</span>
              <span className="text-slate-300">/api/products</span>
            </div>
            <div className="p-2 bg-slate-900/50 border border-slate-850 rounded-lg flex items-center justify-between">
              <span className="text-amber-400 font-bold">PUT/DELETE</span>
              <span className="text-slate-300">/api/products/:id</span>
            </div>
            <div className="p-2 bg-slate-900/50 border border-slate-850 rounded-lg flex items-center justify-between">
              <span className="text-blue-400 font-bold">POST</span>
              <span className="text-slate-300">/api/products/:id/stock</span>
            </div>
            <div className="p-2 bg-slate-900/50 border border-slate-850 rounded-lg flex items-center justify-between">
              <span className="text-purple-400 font-bold">GET/POST</span>
              <span className="text-slate-300">/api/sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={handlePull}
          disabled={syncing !== null}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowDownToLine className={`h-4 w-4 text-amber-500 ${syncing === 'pull' ? 'animate-bounce' : ''}`} />
          {syncing === 'pull' ? 'A descarregar...' : 'Forçar Atualização do Servidor Central'}
        </button>

        <button
          onClick={handlePush}
          disabled={syncing !== null}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowUpToLine className={`h-4 w-4 ${syncing === 'push' ? 'animate-bounce' : ''}`} />
          {syncing === 'push' ? 'A enviar...' : 'Enviar Dados Locais para o Servidor Central'}
        </button>
      </div>
    </div>
  );
}
