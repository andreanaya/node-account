const jwt = require('express-jwt');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const passport = require('passport');
const { generateToken } = require('../utils/Token');
const {notification} = require('../utils/QueryNotification');

exports.confirm = [
	sanitize('token').trim().escape(),

	async (req, res, next) => {
		let token = req.params.token;

		try {
			let payload = verify(token);

			let model = await User.findById(payload._id);

			if(model.active === false) {
				model.active = true;
				await model.save();

				next();
			} else {
				next({
					type: 'server',
					message: 'Username '+req.body.username+' already active.'
				});
			}
		} catch(err) {
			next({
				type: 'server',
				message: 'server error'
			});
		}
	}
];

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
];

exports.api = {
	login: (req, res) => {
		res.status(200).json({
			success: true,
			token: req.token
		});
	},
	resetPassword: (req, res, next) => {
		res.status(200).json({
			success: true,
			message: 'Password sent to email'
		});
	},
	error: (err, req, res, next) => {
		res.status(400).json({
			success: false,
			error: err
		});
	}
}

exports.view = {
	emailConfirmation: async (req, res, next) => {
		res.status(200).redirect('/login?'+notification('confirmation', 'Registration complete.'));
	},
	login: (req, res) => {
		res.status(200).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Login.hbs',
				data: {
					title: 'Login'
				},
				notification: req.notification
			}
		});
	},
	logged: (req, res) => {
		res.status(200)
		.cookie('token', req.token, { signed: true, secure: true, httpOnly: true})
		.redirect('/account');
	},
	logout: (req, res) => {
		res.status(200)
		.cookie('token', '', { expires: new Date(0), secure: true, signed: true, httpOnly: true})
		.redirect('/login?'+notification('status', 'User logged out.'));
	},
	resetPassword: (req, res) => {
		res.status(200).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/ResetPassword.hbs',
				data: {
					title: 'Reset you password',
					message: 'Please add your registered email to reset your password'
				}
			}
		});
	},
	resetPasswordComplete: (req, res) => {
		res.status(200)
		.redirect('/login?'+notification('confirmation', 'A new password was sent to your email.'));
	},
	error: (err, req, res, next) => {
		res.status(400)
		.redirect('/login?'+notification('error', 'Internal error'));

		// res.status(400).render('base.hbs', {
		// 	model: {
		// 		isDev: process.env.NODE_ENV === 'dev',
		// 		template: 'layouts/ResetPassword.hbs',
		// 		data: {
		// 			title: 'Reset you password',
		// 			message: 'Please add your registered email to reset your password',
		// 			errors: err
		// 		}
		// 	}
		// });
	}
}