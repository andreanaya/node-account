const { sanitize } = require('express-validator/filter');
const passport = require('passport');
const { generateToken } = require('../utils/Token');

exports.validate = [
	sanitize('username').trim().escape(),
	sanitize('password').trim().escape()
]

exports.authenticate = (req, res, next) => {
	passport.authenticate('local', function(user, info){
		if(user){
			if(user.active) {
				req.token = generateToken({
					_id: user._id,
					email: user.email,
					username: user.username
				});
				
				next();
			} else {
				next({authentication: 'Email not confirmed'});
			}
		} else {
			next({authentication: 'Invalid username or password'})
		}
	})(req, res);
}

exports.api = {
	post: (req, res) => {
		res.status(200).json({
			success: true,
			token: req.token
		});
	},
	error: (err, req, res, next) => {
		res.status(401).json({
			success: false,
			error: err
		});
	}
}

exports.web = {
	get: (req, res) => {
		res.status(200).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Login.hbs',
				data: {
					title: 'Login'
				}
			}
		});
	},
	post: (req, res) => {
		res.status(200)
		.cookie('token', req.token, { signed: true, secure: true, httpOnly: true})
		.redirect('/account');
	},
	error: (err, req, res, next) => {
		res.status(401).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Login.hbs',
				data: {
					title: 'Login Error',
					username: req.body.username,
					error: err
				}
			}
		});
	}
}

exports.logout = {
	get: (req, res) => {
		res.status(200)
		.cookie('token', '', { expires: new Date(0), secure: true, signed: true, httpOnly: true})
		.render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Login.hbs',
				data: {
					title: 'Login'
				}
			}
		});
	}
}