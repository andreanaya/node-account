const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const handlebars = require('handlebars');
const HBSHelpers = require('../utils/HBSHelpers.js');

module.exports = function (app) {
	Object.keys(HBSHelpers).forEach(function(key) {
		handlebars.registerHelper(key, HBSHelpers[key]);
	});

	let basedir = path.resolve('./app/views');
	
	chokidar.watch(basedir+'/**/**.hbs', {
		ignored: /base\.hbs/,
		cwd: './app/views'
	})
	.on('add', function(filePath, event) {
		handlebars.registerPartial(filePath, fs.readFileSync(basedir+'/'+filePath, 'utf8'));
	})
	.on('change', function(filePath, event) {
		handlebars.registerPartial(filePath, fs.readFileSync(basedir+'/'+filePath, 'utf8'));
	})
	.on('unlink', function(filePath, event) {
		handlebars.unregisterPartial(filePath);
	});

	let templates = {};

	app.engine('hbs', function (filePath, options, callback) {
		if(templates[filePath] === undefined) {
			templates[filePath] = handlebars.compile(fs.readFileSync(filePath, 'utf8'));
		}

		return callback(null, templates[filePath](options.model));
	});
	app.set('views', './app/views');
	app.set('view engine', 'hbs');
}