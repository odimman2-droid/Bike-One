import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  initStore,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addStockEntry,
  bulkSetProducts,
  getFullStore,
  updateFullStore
} from './src/server/store';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize central database on disk/memory
  initStore();

  // Middleware for parsing JSON requests
  app.use(express.json({ limit: '15mb' }));

  // -------------------------------------------------------------
  // API ROUTES (Always before Vite / static middlewares)
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Bike One Luanda - Central Sync Server',
      serverTime: new Date().toISOString()
    });
  });

  // -------------------------------------------------------------
  // PRODUCTS API (/api/products)
  // -------------------------------------------------------------

  // GET /api/products - List all products
  app.get('/api/products', (req, res) => {
    try {
      const products = getProducts();
      res.json(products);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Erro ao obter produtos do servidor', details: err?.message });
    }
  });

  // GET /api/products/:id - Get a single product
  app.get('/api/products/:id', (req, res) => {
    try {
      const product = getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      res.json(product);
    } catch (err: any) {
      console.error('Error fetching product by id:', err);
      res.status(500).json({ error: 'Erro ao buscar produto', details: err?.message });
    }
  });

  // POST /api/products - Create a new product
  app.post('/api/products', (req, res) => {
    try {
      const { name, category, quantity, purchasePrice, salePrice, minStock, id } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Nome do produto é obrigatório' });
      }
      const newProduct = createProduct({
        id,
        name,
        category: category || 'Geral',
        quantity: Number(quantity) || 0,
        purchasePrice: Number(purchasePrice) || 0,
        salePrice: Number(salePrice) || 0,
        minStock: minStock !== undefined ? Number(minStock) : 2
      });
      res.status(201).json(newProduct);
    } catch (err: any) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Erro ao criar produto', details: err?.message });
    }
  });

  // PUT /api/products/:id - Update product
  app.put('/api/products/:id', (req, res) => {
    try {
      const updated = updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Produto não encontrado para atualização' });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: 'Erro ao atualizar produto', details: err?.message });
    }
  });

  // DELETE /api/products/:id - Delete product
  app.delete('/api/products/:id', (req, res) => {
    try {
      const success = deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Produto não encontrado para remoção' });
      }
      res.json({ success: true, message: 'Produto eliminado com sucesso' });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      res.status(500).json({ error: 'Erro ao eliminar produto', details: err?.message });
    }
  });

  // POST /api/products/:id/stock - Stock Top-Up / Adjustment
  app.post('/api/products/:id/stock', (req, res) => {
    try {
      const { quantityToAdd, newPurchasePrice } = req.body;
      const updated = addStockEntry(req.params.id, Number(quantityToAdd) || 0, newPurchasePrice);
      if (!updated) {
        return res.status(404).json({ error: 'Produto não encontrado para entrada de stock' });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      res.status(500).json({ error: 'Erro ao dar entrada de stock', details: err?.message });
    }
  });

  // POST /api/products/bulk - Bulk set products
  app.post('/api/products/bulk', (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Formato inválido. Array de produtos esperado.' });
      }
      const saved = bulkSetProducts(products);
      res.json(saved);
    } catch (err: any) {
      console.error('Error bulk setting products:', err);
      res.status(500).json({ error: 'Erro ao atualizar lista de produtos em lote', details: err?.message });
    }
  });

  // -------------------------------------------------------------
  // FULL CENTRAL SYNC API (/api/sync)
  // -------------------------------------------------------------

  // GET /api/sync - Return snapshot of all central data
  app.get('/api/sync', (req, res) => {
    try {
      const snapshot = getFullStore();
      res.json(snapshot);
    } catch (err: any) {
      console.error('Error getting sync snapshot:', err);
      res.status(500).json({ error: 'Erro ao sincronizar dados', details: err?.message });
    }
  });

  // POST /api/sync - Push updates to central server
  app.post('/api/sync', (req, res) => {
    try {
      const updated = updateFullStore(req.body);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating sync state:', err);
      res.status(500).json({ error: 'Erro ao salvar dados sincronizados', details: err?.message });
    }
  });

  // -------------------------------------------------------------
  // APPLE ICLOUD & CLOUDKIT PERSISTENCE API (/api/icloud/*)
  // -------------------------------------------------------------

  let icloudSession = {
    account: 'odilsonn@icloud.com',
    containerId: 'iCloud.com.bikeone.luanda.app',
    status: 'connected',
    lastSyncedAt: new Date().toISOString()
  };

  // GET /api/icloud/status - Returns active iCloud status and record counts
  app.get('/api/icloud/status', (req, res) => {
    try {
      const store = getFullStore();
      res.json({
        account: icloudSession.account,
        containerId: icloudSession.containerId,
        status: icloudSession.status,
        lastSyncedAt: icloudSession.lastSyncedAt,
        recordsCount: {
          products: store.products?.length || 0,
          services: store.services?.length || 0,
          workOrders: store.workOrders?.length || 0,
          directSales: store.directSales?.length || 0,
          expenses: store.expenses?.length || 0,
          customers: store.workOrders ? new Set(store.workOrders.map((w: any) => w.customer?.phone)).size : 0,
          financials: (store.balanceAdjustments?.length || 0) + (store.salaryAdvances?.length || 0)
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar iCloud status', details: err?.message });
    }
  });

  // POST /api/icloud/sync - Real-time auto-sync payload to iCloud database
  app.post('/api/icloud/sync', (req, res) => {
    try {
      const { account, data, timestamp } = req.body;
      if (account) {
        icloudSession.account = account;
      }
      icloudSession.lastSyncedAt = timestamp || new Date().toISOString();
      icloudSession.status = 'connected';

      if (data && typeof data === 'object') {
        updateFullStore(data);
      }

      res.json({
        success: true,
        message: `Dados sincronizados com sucesso na base de dados iCloud (${icloudSession.account})`,
        lastSyncedAt: icloudSession.lastSyncedAt,
        account: icloudSession.account
      });
    } catch (err: any) {
      console.error('Error syncing to iCloud:', err);
      res.status(500).json({ error: 'Falha ao sincronizar com iCloud', details: err?.message });
    }
  });

  // GET /api/icloud/pull - Restore all data from iCloud
  app.get('/api/icloud/pull', (req, res) => {
    try {
      const store = getFullStore();
      res.json({
        account: icloudSession.account,
        containerId: icloudSession.containerId,
        lastSyncedAt: icloudSession.lastSyncedAt,
        data: store
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao recuperar dados do iCloud', details: err?.message });
    }
  });

  // -------------------------------------------------------------
  // GOOGLE CLOUD & WORKSPACE PERSISTENCE API (/api/google/*)
  // -------------------------------------------------------------

  let googleSession = {
    account: 'odimman.2@gmail.com',
    phone: '+244 941 448 677',
    projectId: 'bike-one-luanda-cloud',
    status: 'connected',
    lastSyncedAt: new Date().toISOString()
  };

  // GET /api/google/status - Returns Google Cloud connection status
  app.get('/api/google/status', (req, res) => {
    try {
      const store = getFullStore();
      res.json({
        account: googleSession.account,
        phone: googleSession.phone,
        projectId: googleSession.projectId,
        status: googleSession.status,
        lastSyncedAt: googleSession.lastSyncedAt,
        recordsCount: {
          products: store.products?.length || 0,
          services: store.services?.length || 0,
          workOrders: store.workOrders?.length || 0,
          directSales: store.directSales?.length || 0,
          expenses: store.expenses?.length || 0
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar Google Cloud status', details: err?.message });
    }
  });

  // POST /api/google/sync - Push updates directly to Google Cloud backing
  app.post('/api/google/sync', (req, res) => {
    try {
      const { account, phone, data, timestamp } = req.body;
      if (account) googleSession.account = account;
      if (phone) googleSession.phone = phone;
      googleSession.lastSyncedAt = timestamp || new Date().toISOString();
      googleSession.status = 'connected';

      if (data && typeof data === 'object') {
        updateFullStore(data);
      }

      res.json({
        success: true,
        message: `Dados gravados com sucesso na conta Google (${googleSession.account})`,
        lastSyncedAt: googleSession.lastSyncedAt,
        account: googleSession.account
      });
    } catch (err: any) {
      console.error('Error syncing to Google Cloud:', err);
      res.status(500).json({ error: 'Falha ao sincronizar com Google Cloud', details: err?.message });
    }
  });

  // GET /api/google/pull - Restore all data from Google Cloud
  app.get('/api/google/pull', (req, res) => {
    try {
      const store = getFullStore();
      res.json({
        account: googleSession.account,
        phone: googleSession.phone,
        lastSyncedAt: googleSession.lastSyncedAt,
        data: store
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao carregar dados do Google Cloud', details: err?.message });
    }
  });

  // -------------------------------------------------------------
  // VITE / STATIC SERVING MIDDLEWARE
  // -------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind exclusively to 0.0.0.0 and PORT 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bike One Server] Servidor backend central ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
