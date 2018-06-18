const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const HBSHelpers = require('../utils/HBSHelpers.js');

const readFiles = (cwd, dir, ignore) => {
	let files = [];

	fs.readdirSync(dir).forEach(file => {
		let filePath = dir+'/'+file;
		if(fs.statSync(filePath).isDirectory()) {
			readFiles(cwd, filePath, ignore);
		} else if(file.indexOf('hbs') != -1) {
			let path = filePath.substr(cwd.length+1);

			if(!ignore || ignore.indexOf(path) == -1) {
				handlebars.registerPartial(path, fs.readFileSync(filePath, 'utf8'));
			}
		}
	});

	return files;
}

Object.keys(HBSHelpers).forEach(function(key) {
	handlebars.registerHelper(key, HBSHelpers[key]);
});

let basedir = path.resolve('./app/views');

readFiles(basedir, basedir, ['base.hbs']);

let templates = {};

exports.templates = templates;

exports.init = function (app) {
	app.engine('hbs', function (filePath, options, callback) {
		if(templates[filePath] === undefined) {
			templates[filePath] = handlebars.compile(fs.readFileSync(filePath, 'utf8'));
		}

		return callback(null, templates[filePath](options.model));
	});
	app.set('views', './app/views');
	app.set('view engine', 'hbs');
}