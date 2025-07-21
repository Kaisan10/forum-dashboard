const cron = require('node-cron');
const appConfig = require('../config/config.json');
const dataCollector = require('./dataCollector');

class Scheduler {
  start() {
    console.log(`⏰ スケジューラー開始: ${appConfig.data.collectInterval}`);
    
    cron.schedule(appConfig.data.collectInterval, async () => {
      await dataCollector.collectData();
    });
  }
}

module.exports = new Scheduler();