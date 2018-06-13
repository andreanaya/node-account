const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const handlebars = require('handlebars');

require('./config/passport');

const app = express();

app.use(helmet());

app.use(cookieParser(process.env.TOKEN_SECRET));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());

app.use(passport.initialize());

require('./views')(app)
require('./routes')(app);

module.exports = app;