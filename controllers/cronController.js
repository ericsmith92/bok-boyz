const cron = require('node-cron');
const scrapeController = require('../controllers/scrapeController');

exports.runCron = (req, res, next) => {
    console.log('fired');
    cron.schedule(`0,30 * * * *`, () => {
        console.log(`⏲️ RUNNING THE CRON`);
        scrapeController.checkStock(req, res, next);
     });
}
