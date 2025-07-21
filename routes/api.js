const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const appConfig = require('../config/config.json');
const axios = require('axios');

const router = express.Router();

// 現在の統計データ取得
router.get('/stats', async (req, res) => {
  try {
    const statsPath = path.join(appConfig.data.dataPath, 'stats.json');
    const data = await fs.readFile(statsPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// ユーザーデータ取得
router.get('/users', async (req, res) => {
  try {
    const usersPath = path.join(appConfig.data.dataPath, 'users.json');
    const data = await fs.readFile(usersPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'ユーザーデータの取得に失敗しました' });
  }
});

// 履歴データ取得
router.get('/history', async (req, res) => {
  try {
    const historyPath = path.join(appConfig.data.dataPath, 'history.json');
    const data = await fs.readFile(historyPath, 'utf8');
    const history = JSON.parse(data);
    
    // 最新30件のデータを返す
    const recent = history.slice(-30);
    res.json(recent);
  } catch (error) {
    res.status(500).json({ error: '履歴データの取得に失敗しました' });
  }
});

// 設定情報取得
router.get('/config', (req, res) => {
  res.json({
    title: appConfig.ui.title,
    refreshInterval: appConfig.ui.refreshInterval,
    forumUrl: appConfig.forum.baseUrl
  });
});

// 詳細情報取得
router.get('/about', async (req, res) => {
  try {
    const forumUrl = appConfig.forum.baseUrl;
    const endpoint = appConfig.forum.apiEndpoints.about;

    const response = await axios.get(`${forumUrl}${endpoint}`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ /api/about エラー:', error.message);
    res.status(500).json({ error: 'フォーラム情報の取得に失敗しました' });
  }
});

module.exports = router;
