const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const config = require('./config/config.json');
const dataCollector = require('./utils/dataCollector');
const scheduler = require('./utils/scheduler');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = config.server.port;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// データディレクトリ初期化
async function initializeDataDir() {
  try {
    await fs.mkdir(config.data.dataPath, { recursive: true });
    
    const files = ['users.json', 'stats.json', 'history.json'];
    for (const file of files) {
      const filePath = path.join(config.data.dataPath, file);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, JSON.stringify([]));
      }
    }
  } catch (error) {
    console.error('データディレクトリの初期化に失敗:', error);
  }
}

// APIルート
app.use('/api', apiRoutes);

// メインページ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバー起動
async function startServer() {
  await initializeDataDir();
  
  // 初回データ収集
  await dataCollector.collectData();
  
  // スケジューラー開始
  scheduler.start();
  
  app.listen(PORT, () => {
    console.log(`🚀 フォーラムダッシュボードが起動しました: http://localhost:${PORT}`);
  });
}

startServer();