const jwt = require('express-jwt');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const passport = require('passport');
const { generateToken } = require('../utils/Token');

exports.authenticate = [
	sanitize('username').trim().escape(),
	sanitize('password').trim().escape(),
	(req, res, next) => {
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
]

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

exports.reset = [
	sanitize('email').trim(),
	check('email').isEmail().withMessage('invalid'),

	async (req, res, next) => {
		let errors = validationResult(req);

		if(errors.isEmpty()) {
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
		} else {
			next(errors.array().reduce((list, error) => {
				list[error.param] = error.msg;
				return list
			}, {}))
		}
	}
]