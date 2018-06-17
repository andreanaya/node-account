const jwt = require('express-jwt');
const validator = require('validator');
const passport = require('passport');
const User = require('../models/User');
const { generateToken, verify } = require('../utils/Token');
const Mail = require('../utils/Mail');

console.log(generateToken({
	email: 'andre.anaya@gmail.com'
}))

exports.authorize = [
	jwt({
		secret: process.env.TOKEN_SECRET,
		userProperty: 'payload',
		credentialsRequired: false,
		getToken: (req) => {
			if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
				return req.headers.authorization.split(' ')[1];
			} else if (req.signedCookies && req.signedCookies.token) {
				return req.signedCookies.token;
			}
			return null;
		}
	}),
	(err, req, res, next) => {
		if (err) {
			if(err.name === 'UnauthorizedError') {
				next({
					type: 'authentication',
					message: 'Invalid token'
				});
			}
		} else {
			if (!req.payload || !req.payload._id) {
				next({
					type: 'authentication',
					message: 'Unauthorized access'
				});
			} else {
				next();
			}
		}
	},
	async (req, res, next) => {
		try {
			let user = await User.findById(req.payload._id);
			
			if(user) {
				if(user.created <= req.payload.iat) {
					req.user = user;

					next();
				} else {
					next({
						type: 'authentication',
						message: 'Token revoked'
					});
				}
			} else {
				next({
					type: 'server',
					message: 'User not found'
				});
			}
		} catch(error) {
			next({
				type: 'server',
				message: 'Server error'
			});
		}
	}
];

exports.create = [
	(req, res, next) => {
		let errors = {};

		let username = validator.trim(req.body.username || '');
		let email = validator.trim(req.body.email || '');
		let password = validator.trim(req.body.password || '');
		let passwordConfirmation = validator.trim(req.body.passwordConfirmation || '');

		if(validator.isEmpty(username)) {
			errors.username = 'missing';
		} else if(!validator.isLength(username, {min: 5}) || !validator.isAlphanumeric(username) ) {
			errors.username = 'invalid';
		}

		if(validator.isEmpty(email)) {
			errors.email = 'missing';
		} else if(!validator.isEmail(email) ) {
			errors.email = 'invalid'
		}

		if(validator.isEmpty(password)) {
			errors.password = 'missing';
		} else if( !validator.matches(password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/) ) {
			errors.password = 'invalid'
		} else if(validator.isEmpty(passwordConfirmation)) {
			errors.passwordConfirmation = 'missing';
		} else if( password !== passwordConfirmation ) {
			errors.passwordConfirmation = 'invalid';
		}

		if(Object.keys(errors).length === 0) {
			req.body.username = username;
			req.body.email = email;
			req.body.password = password;

			next();
		} else {
			next({
				type: 'validation',
				errors: errors
			});
		}
	},

	async (req, res, next) => {
		try {
			let model = new User({
				username: req.body.username,
				email: req.body.email,
				password: req.body.password
			});

			let user = await model.save();

			let token = generateToken({
				_id: user._id,
				email: user.email
			});

			let url = 'https://localhost:3000/confirm/'+token;

			Mail.sendMail({
				from: 'hello@andreanaya.com',
				to: user.email,
				subject: 'Please confirm your email',
				text: 'Please click on the link bellow to confirm your email.\n\n'+url+'.',
				html: '<p>Please click on the link bellow to confirm your email</p><a href="'+url+'" target="_blank">'+url+'</a>'
			}, (err, info) => {
				// TO-DO: Log response
				// if(err) console.log(err);
				// if(info) console.log('Email sent', info);
			});

			req.user = user;

			next();
		} catch(err) {
			let error = { type: 'server' };

			if(err.code === 11000 && err.message.indexOf('username') > -1) {
				error.message = 'Username '+req.body.username+' already exist.';
			} else if(err.code === 11000 && err.message.indexOf('email') > -1) {
				error.message = 'Email '+req.body.email+' already exist.'
			} else {
				error.message = 'Server error';
			}

			next(error);
		}
	}
];

exports.confirm = [
	async (req, res, next) => {
		let token = req.params.token;

		try {
			let payload = verify(token);

			let model = await User.findById(payload._id);

			if(model) {
				if(model.active === false) {
					model.active = true;
					await model.save();

					next();
				} else {
					next({
						type: 'server',
						message: 'User already active.'
					});
				}
			} else {
				next({
					type: 'server',
					message: 'User not found'
				});
			}
		} catch(err) {
			if(err.name && err.name === 'JsonWebTokenError') {
				next({
					type: 'authentication',
					message: 'Invalid token'
				});
			} else {
				next({
					type: 'server',
					message: 'Server error'
				});
			}
		}
	}
];

exports.login = [
	(req, res, next) => {
		let username = validator.trim(req.body.username || '');
		let password = validator.trim(req.body.password || '');

		req.body.username = username;
		req.body.password = password;

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
					next({
						type: 'authentication',
						message: 'Email not confirmed'
					});
				}
			} else {
				next({
					type: 'authentication',
					message: 'Invalid username or password'
				});
			}
		})(req, res);
	}
];

exports.recover = [
	(req, res, next) => {
		let errors = {};

		let email = validator.trim(req.body.email || '');

		if(!validator.isEmpty(email) && !validator.isEmail(email) ) {
			errors.email = 'invalid'
		}

		if(Object.keys(errors).length === 0) {
			req.body.email = email;

			next();
		} else {
			next({
				type: 'validation',
				errors: errors
			});
		}
	},

	async (req, res, next) => {
		try {
			let model = await User.findOne({email: req.body.email});

			if(model.active) {
				let password = Math.random().toString(36).slice(-8);

				model.password = password;

				await model.save();

				Mail.sendMail({
					from: 'hello@andreanaya.com',
					to: model.email,
					subject: 'Password reset',
					html: '<p>Your new password is: '+password+'</p>'
				}, (err, info) => {
					// if(err) console.log(err);
					// if(info) console.log('Email sent');
				});

				next();
			} else {
				next({
					type: 'server',
					message: 'User not active'
				})
			}
		} catch(error) {
			next({
				type: 'server',
				message: 'Email not found'
			})
		}
	}
];

exports.update = [
	(req, res, next) => {
		let errors = {};

		let username = validator.trim(req.body.username || '');
		let email = validator.trim(req.body.email || '');
		let password = validator.trim(req.body.password || '');
		let passwordConfirmation = validator.trim(req.body.passwordConfirmation || '');

		if(!validator.isEmpty(username) && (!validator.isLength(username, {min: 5}) || !validator.isAlphanumeric(username)) ) {
			errors.username = 'invalid';
		}

		if(!validator.isEmpty(email) && !validator.isEmail(email) ) {
			errors.email = 'invalid'
		}

		if(!validator.isEmpty(password) && !validator.matches(password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/) ) {
			errors.password = 'invalid'
		}

		if( !validator.isEmpty(password) && password !== passwordConfirmation ) {
			errors.passwordConfirmation = 'invalid';
		}

		if(Object.keys(errors).length === 0) {
			req.body.username = username;
			req.body.email = email;
			req.body.password = password;

			next();
		} else {
			next({
				type: 'validation',
				errors: errors
			});
		}
	},

	async (req, res, next) => {
		try {
			if(req.body.username != '') req.user.username = req.body.username;
			if(req.body.email != '') req.user.email = req.body.email;
			if(req.body.password != '') req.user.password = req.body.password;

			await req.user.save();

			req.token = generateToken({
				_id: req.user._id,
				username: req.user.username,
				email: req.user.email
			});

			next()
		} catch(error) {
			next({
				type: 'server',
				message: 'Server error'
			});
		}
	}
];

exports.delete = async (req, res, next) => {
	try {
		await req.user.remove();

		next();
	} catch(error) {
		next({
			type: 'server',
			message: 'Server error'
		});
	}
}