const express = require('express');
const routes = require('./routes/index');

// create our Express app
const app = express();

app.use('/', routes);

module.exports = app;