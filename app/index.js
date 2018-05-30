const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.send('Hello world!');
});

module.exports = app;