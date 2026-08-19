/**
 * Google Cloud & Google Workspace Database Persistence Client
 * Bike One Luanda - Central Multi-User Sync Architecture
 * Account: odimman.2@gmail.com / +244 941 448 677
 */

export interface GoogleCloudConfig {
  accountEmail: string;
  phone: string;
  projectId: string;
  databaseName: string;
  status: 'connected' | 'syncing' | 'error';
  lastSyncedAt?: string;
  autoSync: boolean;
  recordsCount: {
    products?: number;
    services?: number;
    workOrders?: number;
    directSales?: number;
    expenses?: number;
  };
}

const GOOGLE_CONFIG_KEY = 'bikeone_google_cloud_config';

export const DEFAULT_GOOGLE_CONFIG: GoogleCloudConfig = {
  accountEmail: 'odimman.2@gmail.com',
  phone: '+244 941 448 677',
  projectId: 'bike-one-luanda-cloud',
  databaseName: 'bike_one_production_db',
  status: 'connected',
  autoSync: true,
  recordsCount: {
    products: 0,
    services: 0,
    workOrders: 0,
    directSales: 0,
    expenses: 0
  }
};

export function getGoogleCloudConfig(): GoogleCloudConfig {
  try {
    const raw = localStorage.getItem(GOOGLE_CONFIG_KEY);
    if (!raw) return DEFAULT_GOOGLE_CONFIG;
    return { ...DEFAULT_GOOGLE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GOOGLE_CONFIG;
  }
}

export function saveGoogleCloudConfig(updates: Partial<GoogleCloudConfig>): GoogleCloudConfig {
  const current = getGoogleCloudConfig();
  const next = { ...current, ...updates };
  try {
    localStorage.setItem(GOOGLE_CONFIG_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save google cloud config:', e);
  }
  return next;
}

/**
 * Save complete application snapshot to Google Cloud backend
 */
export async function saveToGoogleCloud(appData: any): Promise<boolean> {
  try {
    const config = getGoogleCloudConfig();
    const payload = {
      account: config.accountEmail,
      phone: config.phone,
      projectId: config.projectId,
      timestamp: new Date().toISOString(),
      data: appData
    };

    const res = await fetch('/api/google/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('Google Cloud backend sync responded with status:', res.status);
      return false;
    }

    saveGoogleCloudConfig({
      lastSyncedAt: payload.timestamp,
      status: 'connected',
      recordsCount: {
        products: appData.products?.length || 0,
        services: appData.services?.length || 0,
        workOrders: appData.workOrders?.length || 0,
        directSales: appData.directSales?.length || 0,
        expenses: appData.expenses?.length || 0
      }
    });

    return true;
  } catch (err) {
    console.error('Error auto-saving to Google Cloud:', err);
    return false;
  }
}

/**
 * Pull latest snapshot from Google Cloud backend
 */
export async function pullFromGoogleCloud(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/google/pull');
    if (!res.ok) {
      throw new Error(`Servidor respondeu com status ${res.status}`);
    }
    const json = await res.json();
    if (json && json.data) {
      saveGoogleCloudConfig({
        lastSyncedAt: json.lastSyncedAt || new Date().toISOString(),
        status: 'connected'
      });
      return { success: true, data: json.data };
    }
    return { success: false, error: 'Dados não encontrados' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao carregar do Google Cloud' };
  }
}

/**
 * Check Google Cloud connection health
 */
export async function checkGoogleCloudConnection(): Promise<{ connected: boolean; account: string; lastSyncedAt?: string }> {
  try {
    const res = await fetch('/api/google/status');
    if (res.ok) {
      const json = await res.json();
      return {
        connected: true,
        account: json.account || 'odimman.2@gmail.com',
        lastSyncedAt: json.lastSyncedAt
      };
    }
    return { connected: false, account: 'odimman.2@gmail.com' };
  } catch {
    return { connected: false, account: 'odimman.2@gmail.com' };
  }
}

/**
 * Export portable Google Cloud JSON snapshot file
 */
export function exportGoogleCloudBackupFile(data: any) {
  try {
    const backup = {
      app: 'Bike One Luanda',
      account: 'odimman.2@gmail.com',
      phone: '+244 941 448 677',
      provider: 'Google Cloud Platform',
      exportedAt: new Date().toISOString(),
      data: data || {}
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bike_one_google_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting Google Cloud backup file:', err);
  }
}
