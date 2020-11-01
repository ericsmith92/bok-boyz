const express = require('express');
const router = express.Router();
const scrapeController = require('../controllers/scrapeController');
//const cronController = require('../controllers/cronController');

const { catchErrors } = require('../handlers/errorHandlers');

router.get('/scrape', catchErrors(scrapeController.checkStock));

module.exports = router;