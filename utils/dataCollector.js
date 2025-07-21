const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const appConfig = require('../config/config.json');

class DataCollector {
  async collectData() {
    try {
      console.log('📊 データ収集開始...');
      
      const aboutData = await this.fetchAboutData();
      const usersData = await this.fetchUsersData();

      // ここでデータ内容を確認
      console.log('aboutData:', JSON.stringify(aboutData, null, 2));
      console.log('usersData:', JSON.stringify(usersData, null, 2));
      
      await this.saveCurrentData(aboutData, usersData);
      await this.saveHistoryData(aboutData);
      
      console.log('✅ データ収集完了');
    } catch (error) {
      console.error('❌ データ収集エラー:', error.message);
    }
  }

  async fetchAboutData() {
    const url = appConfig.forum.baseUrl + appConfig.forum.apiEndpoints.about;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  }

  async fetchUsersData() {
    const url = appConfig.forum.baseUrl + appConfig.forum.apiEndpoints.users;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data.directory_items || [];
  }

  async saveCurrentData(aboutData, usersData) {
    const statsPath = path.join(appConfig.data.dataPath, 'stats.json');
    const usersPath = path.join(appConfig.data.dataPath, 'users.json');

    await fs.writeFile(statsPath, JSON.stringify(aboutData, null, 2));
    await fs.writeFile(usersPath, JSON.stringify(usersData, null, 2));
  }

async saveHistoryData(aboutData) {
    const historyPath = path.join(appConfig.data.dataPath, 'history.json');
    
    let history = [];
    try {
      const data = await fs.readFile(historyPath, 'utf8');
      history = JSON.parse(data);
    } catch (error) {
      console.log('履歴ファイルを新規作成します');
    }

    const timestamp = new Date().toISOString();
    // 修正ポイント: statsの取得方法
    const stats = (aboutData.about && aboutData.about.stats) ? aboutData.about.stats : (aboutData.stats || {});

    const entry = {
      timestamp,
      topics_count: stats.topics_count || 0,
      posts_count: stats.posts_count || 0,
      users_count: stats.users_count || 0,
      likes_count: stats.likes_count || 0,
      active_users_30_days: stats.active_users_30_days || 0,
      chat_messages_count: stats.chat_messages_count || 0
    };

    history.push(entry);

    // 古いデータを削除
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - appConfig.data.historyRetentionDays);
    
    history = history.filter(entry => new Date(entry.timestamp) > retentionDate);

    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
}
}

module.exports = new DataCollector();