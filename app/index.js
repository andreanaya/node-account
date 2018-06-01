const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
var passport = require('passport');

require('./config/passport');

const app = express();

app.use(bodyParser.json());                                     
app.use(bodyParser.urlencoded({extended: true}));               
app.use(bodyParser.text());                                    
app.use(bodyParser.json({ type: 'application/json'}));

app.use(passport.initialize());

require('./routes')(app);

module.exports = app;