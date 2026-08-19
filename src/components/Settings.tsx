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
  Copy,
  CloudRain,
  CloudLightning,
  CopyCheck,
  Play
} from 'lucide-react';
import { checkServerHealth } from '../lib/api';
import { getICloudConfig, saveICloudConfig, checkICloudConnection, exportICloudBackupFile, ICloudConfig } from '../lib/icloud';
import { checkSupabaseConnection, SUPABASE_SETUP_SQL, SupabaseSyncStatus } from '../lib/supabase';

interface SettingsProps {
  baseBalance: number;
  onUpdateBaseBalance: (newBalance: number) => void;
  onResetAllData: () => void;
  onResetBalanceOnly: () => void;
  onPullFromSupabase?: () => Promise<boolean>;
  onPushToSupabase?: () => Promise<boolean>;
  serverOnline?: boolean;
  lastServerSync?: Date;
  onPullFromServer?: () => Promise<boolean>;
  onPushToServer?: () => Promise<boolean>;
  icloudConfig?: ICloudConfig;
  lastICloudSync?: Date;
  onPullFromICloud?: () => Promise<boolean>;
  onPushToICloud?: () => Promise<boolean>;
  allAppData?: any;
}

export default function SettingsView({
  baseBalance,
  onUpdateBaseBalance,
  onResetAllData,
  onResetBalanceOnly,
  onPullFromSupabase,
  onPushToSupabase,
  serverOnline = true,
  lastServerSync,
  onPullFromServer,
  onPushToServer,
  icloudConfig,
  lastICloudSync,
  onPullFromICloud,
  onPushToICloud,
  allAppData
}: SettingsProps) {
  const [balanceInput, setBalanceInput] = useState(baseBalance.toString());
  const [shopName, setShopName] = useState(() => localStorage.getItem('bikeone_shop_name') || 'BIKE ONE');
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem('bikeone_shop_phone') || '+244 923 000 000');
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
    setSaveSuccess('Todos os dados foram resetados com sucesso!');
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
          <h1 className="text-2xl font-sans font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-amber-500" />
            Configurações do Sistema
          </h1>
          <p className="text-xs text-slate-400">
            Gerencie as credenciais, dados da oficina, e efetue resets gerais do sistema.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-800/30 p-4 rounded-xl"
        >
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{saveSuccess}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SHOP INFO CONFIG */}
        <div className="bg-[#111216]/60 border border-slate-800/60 p-6 rounded-3xl space-y-6">
          <h3 className="text-sm font-extrabold text-slate-350 uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
            <Store className="h-4 w-4 text-amber-500" />
            Dados Identificativos da Loja
          </h3>
          
          <form onSubmit={handleSaveShopInfo} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Nome da Oficina / Loja</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Contacto Telefónico</label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">NIF Contribuinte</label>
                <input
                  type="text"
                  value={shopNif}
                  onChange={(e) => setShopNif(e.target.value)}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Saldo Inicial de Caixa (Kz)</label>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Morada Física</label>
              <textarea
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500/20 h-20 resize-none"
              />
            </div>

            <button
              id="save-shop-settings-btn"
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-black rounded-full cursor-pointer transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Save className="h-4 w-4" />
              Guardar Configurações
            </button>
          </form>
        </div>

        {/* SECURITY & LOGIN */}
        <div className="bg-[#111216]/60 border border-slate-800/60 p-6 rounded-3xl space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-350 uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
              <Shield className="h-4 w-4 text-amber-500" />
              Credenciais de Acesso Único
            </h3>

            <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-3.5 mt-4 text-xs font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Nome de utilizador:</span>
                <span className="font-extrabold text-slate-100">Bike One</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Palavra-passe padrão:</span>
                <span className="font-mono font-bold text-amber-500 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded">bikeone2026</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 leading-relaxed">
                Por motivos de segurança e integridade das contas de faturamento em Angola, o utilizador e palavra-passe são estáticos para garantir que o painel permaneça seguro.
              </p>
            </div>
          </div>

          {/* DANGER SYSTEM ACTIONS */}
          <div className="bg-rose-950/10 border border-rose-950/30 p-5 rounded-2xl mt-4 space-y-4">
            <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Zona de Perigo / Ações Críticas
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Reset balance */}
              <button
                id="reset-balance-only-btn"
                type="button"
                onClick={handleResetBalanceClick}
                className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-900/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Coins className="h-4 w-4 shrink-0 text-rose-500" />
                Resetar o Saldo
              </button>

              {/* Reset Everything */}
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

      {/* 1. APPLE ICLOUD & CLOUDKIT PERMANENT DATABASE PANEL */}
      <ICloudSyncPanel
        config={icloudConfig}
        lastSync={lastICloudSync}
        onPullFromICloud={onPullFromICloud}
        onPushToICloud={onPushToICloud}
        allData={allAppData}
      />

      {/* 2. CENTRAL SERVER BACKEND PERSISTENCE PANEL */}
      <CentralServerPanel
        serverOnline={serverOnline}
        lastServerSync={lastServerSync}
        onPullFromServer={onPullFromServer}
        onPushToServer={onPushToServer}
      />

      {/* 3. SUPABASE CLOUD SYNC PANEL */}
      <SupabaseSyncPanel
        onPullFromSupabase={onPullFromSupabase}
        onPushToSupabase={onPushToSupabase}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponent: Apple iCloud & CloudKit Database Panel
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
            <p className="text-xs text-slate-400 mt-0.5">
              Sincronização automática em tempo real para guardar permanentemente todos os registos na sua conta iCloud.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckConnection}
            disabled={syncing !== null}
            className="px-3.5 py-2 bg-sky-950/40 hover:bg-sky-900/50 text-sky-200 text-xs font-bold border border-sky-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-sky-400 ${syncing === 'check' ? 'animate-spin' : ''}`} />
            {syncing === 'check' ? 'A testar...' : 'Verificar Conexão'}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`text-xs p-3.5 rounded-xl flex items-center gap-2.5 border ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
            : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Connected Account */}
        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Conta iCloud Vinculada</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400"></span>
              </span>
              <span className="text-sm font-black text-sky-200 truncate">
                {config.accountEmail || 'odilsonn@icloud.com'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-400" />
              Sessão autenticada e persistente
            </p>
          </div>
          <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Container:</span>
            <span className="font-mono text-slate-300 text-[9px]">{config.containerId}</span>
          </div>
        </div>

        {/* Card 2: Real-time Auto-Sync Status */}
        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Auto-Save iCloud</span>
            <button
              onClick={handleToggleAutoSync}
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                autoSyncEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {autoSyncEnabled ? 'Ativo (Tempo Real)' : 'Pausado'}
            </button>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-200 block">
              {autoSyncEnabled ? 'Qualquer alteração é salva no iCloud' : 'Sincronização automática desativada'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Última gravação: {lastSync ? lastSync.toLocaleTimeString('pt-AO') : 'Agora'}
            </span>
          </div>

          <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-850">
            Produtos, Ordens de Serviço e Caixa guardados automaticamente a cada modificação.
          </p>
        </div>

        {/* Card 3: Cloud Database Stats */}
        <div className="bg-[#0a0b0d]/70 p-4 border border-slate-850 rounded-2xl space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Registos na Base de Dados iCloud
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Produtos</span>
              <span className="font-bold text-sky-300 text-sm">{config.recordsCount.products || 'Todos'}</span>
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

// ----------------------------------------------------------------------
// Subcomponent: Supabase Sync Panel
// ----------------------------------------------------------------------
interface SupabaseSyncPanelProps {
  onPullFromSupabase?: () => Promise<boolean>;
  onPushToSupabase?: () => Promise<boolean>;
}

function SupabaseSyncPanel({ onPullFromSupabase, onPushToSupabase }: SupabaseSyncPanelProps) {
  const [syncStatus, setSyncStatus] = useState<SupabaseSyncStatus>({ status: 'disconnected' });
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState<'pull' | 'push' | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const runConnectionCheck = async () => {
    setChecking(true);
    try {
      const res = await checkSupabaseConnection();
      setSyncStatus(res);
    } catch (e: any) {
      setSyncStatus({ status: 'error', errorMessage: e.message || 'Erro ao contactar Supabase' });
    } finally {
      setChecking(false);
    }
  };

  React.useEffect(() => {
    runConnectionCheck();
  }, []);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePull = async () => {
    if (!onPullFromSupabase) return;
    setSyncing('pull');
    setFeedbackMsg('');
    const success = await onPullFromSupabase();
    if (success) {
      setFeedbackMsg('Dados descarregados com sucesso do Supabase para o navegador!');
    } else {
      setFeedbackMsg('Erro ao descarregar dados. Verifique a consola do programador ou se a tabela existe.');
    }
    setSyncing(null);
    runConnectionCheck();
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  const handlePush = async () => {
    if (!onPushToSupabase) return;
    setSyncing('push');
    setFeedbackMsg('');
    const success = await onPushToSupabase();
    if (success) {
      setFeedbackMsg('Dados enviados e persistidos com sucesso no Supabase Cloud!');
    } else {
      setFeedbackMsg('Erro ao enviar dados para o Supabase. Certifique-se de que a tabela foi criada.');
    }
    setSyncing(null);
    runConnectionCheck();
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  return (
    <div className="bg-[#111216]/60 border border-slate-800/60 p-6 rounded-3xl space-y-6" id="supabase-sync-panel">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Cloud className="h-5 w-5 text-amber-500 animate-pulse" />
            Sincronização Cloud (Supabase)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Persistência segura em tempo real na nuvem utilizando a infraestrutura Supabase.
          </p>
        </div>

        <button
          onClick={runConnectionCheck}
          disabled={checking}
          className="px-4 py-1.5 bg-[#0a0b0d]/80 hover:bg-slate-900 text-slate-300 text-xs font-bold border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-2 self-start"
        >
          <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin text-amber-500' : ''}`} />
          {checking ? 'A verificar...' : 'Testar Ligação'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Indicator */}
        <div className="bg-[#0a0b0d]/50 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Estado da Ligação</span>
          
          <div className="flex items-center gap-3 py-1">
            {syncStatus.status === 'connected' && (
              <>
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-slate-100 block">Sincronizado</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Pronto para guardar</span>
                </div>
              </>
            )}

            {syncStatus.status === 'table_missing' && (
              <>
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-slate-100 block">Ação Necessária</span>
                  <span className="text-[10px] text-amber-400 font-medium">Tabela ausente</span>
                </div>
              </>
            )}

            {syncStatus.status === 'error' && (
              <>
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-slate-100 block">Falha de Conexão</span>
                  <span className="text-[10px] text-rose-400 font-medium leading-tight block">{syncStatus.errorMessage || 'Erro de Credenciais'}</span>
                </div>
              </>
            )}

            {syncStatus.status === 'disconnected' && (
              <>
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-600"></span>
                </span>
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-slate-100 block">Desconectado</span>
                  <span className="text-[10px] text-slate-500 font-medium">Sem rede</span>
                </div>
              </>
            )}
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed">
            As alterações feitas nos clientes, vendas, serviços e faturas são sincronizadas para que fiquem salvas.
          </p>
        </div>

        {/* Credentials */}
        <div className="bg-[#0a0b0d]/50 p-4 border border-slate-850 rounded-2xl space-y-3 md:col-span-2">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Credenciais Ativas do Projeto</span>
          <div className="space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 bg-[#0d0e12]/80 border border-slate-900 rounded-xl font-mono text-[11px]">
              <span className="text-slate-450 font-bold shrink-0">SUPABASE_URL:</span>
              <span className="text-slate-300 break-all select-all text-right sm:max-w-xs md:max-w-md">https://betbzfxesnczypzvrqnd.supabase.co</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 bg-[#0d0e12]/80 border border-slate-900 rounded-xl font-mono text-[11px]">
              <span className="text-slate-450 font-bold shrink-0">ANON_KEY:</span>
              <span className="text-amber-500 font-bold break-all select-all text-right sm:max-w-xs md:max-w-md">sb_publishable_eh2Urq...</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
            Esta ligação direta assegura que os seus dados de caixa e stock de peças estejam sempre salvaguardados em nuvem angolana e resilientes a limpezas de cookies do navegador.
          </p>
        </div>
      </div>

      {/* Manual Commands */}
      <div className="bg-[#0d0e12]/40 p-5 rounded-2xl border border-slate-850 space-y-4">
        <h4 className="text-[10px] font-extrabold text-slate-350 uppercase tracking-wider">Ações de Sincronismo</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handlePull}
            disabled={syncing !== null || checking}
            className="py-3 px-4 bg-[#0a0b0d]/80 hover:bg-slate-900 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            <CloudRain className={`h-4 w-4 text-sky-400 ${syncing === 'pull' ? 'animate-bounce' : ''}`} />
            Descarregar Cloud (PULL)
          </button>

          <button
            onClick={handlePush}
            disabled={syncing !== null || checking}
            className="py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            <CloudLightning className={`h-4 w-4 text-amber-400 ${syncing === 'push' ? 'animate-pulse animate-bounce' : ''}`} />
            Enviar Dados Locais (PUSH)
          </button>
        </div>

        {feedbackMsg && (
          <div className="text-center text-xs font-bold text-amber-400 bg-amber-950/20 border border-amber-900/20 p-2.5 rounded-xl">
            {feedbackMsg}
          </div>
        )}
      </div>

      {/* SQL Script / Setup instruction if table is missing or requested */}
      {syncStatus.status === 'table_missing' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-950/10 border border-amber-500/20 p-5 rounded-2xl space-y-4"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Criar Tabela no Supabase
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Para que a nuvem consiga guardar as informações, copie o código abaixo, aceda ao painel do Supabase, clique em <strong>SQL Editor</strong> &gt; <strong>New Query</strong>, cole o código e prima <strong>Run</strong>.
              </p>
            </div>

            <button
              onClick={handleCopySQL}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/35 text-amber-400 text-[10px] font-extrabold rounded-lg border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer shrink-0 uppercase tracking-wider"
            >
              {copied ? <CopyCheck className="h-3 w-3 text-emerald-400 animate-bounce" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copiado!' : 'Copiar SQL'}
            </button>
          </div>

          <pre className="p-4 bg-[#050608] text-[#9cdcfe] font-mono text-[10px] rounded-xl border border-slate-900 overflow-x-auto max-h-48 leading-relaxed">
            {SUPABASE_SETUP_SQL}
          </pre>
        </motion.div>
      )}
    </div>
  );
}

