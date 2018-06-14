const User = require('../models/User');
const { check, validationResult } = require('express-validator/check');
const { generateToken } = require('../utils/Token');
const { sanitize } = require('express-validator/filter');
const { password } = require('../utils/RegExp');

exports.validate = [
	check('username')
		.optional({checkFalsy: true})
		.isLength({min: 5}).withMessage('invalid'),
	check('email')
		.optional({checkFalsy: true})
		.isEmail().withMessage('invalid'),
	check('password')
		.optional({checkFalsy: true})
		.matches(password()).withMessage('invalid'),
	check('passwordConfirmation')
		.custom((value, { req }) => req.body.password !== undefined && req.body.password !== '' ? value === req.body.password : true).withMessage('invalid')
];

exports.user = {
	get: async (req, res, next) => {
		try {
			let user = await User.findById(req.payload._id);
			
			if(user) {
				if(user.created <= req.payload.iat) {
					req.user = user;

					next();
				} else {
					next({authentication: 'Token revoked'});
				}
			} else {
				next({server: 'User not found'});
			}
		} catch(error) {
			next({server: 'Server error'});
		}
	},
	update: async (req, res, next) => {
		let errors = validationResult(req);

		if(errors.isEmpty()) {
			try {
				if(req.body.username && req.body.username != '') req.user.username = req.body.username;
				if(req.body.email && req.body.email != '') req.user.email = req.body.email;
				if(req.body.password && req.body.password != '') req.user.password = req.body.password;

				await req.user.save();

				req.token = generateToken({
					_id: req.user._id,
					username: req.user.username,
					email: req.user.email
				});

				next()
			} catch(error) {
				next({server: 'Server error'});
			}
		} else {
			next(errors.array().map((error) => {
				return {
					field: error.param,
					message: error.msg
				}
			}))
		}
	},
	delete: async (req, res, next) => {
		try {
			await req.user.remove();

			next();
		} catch(error) {
			next({server: 'Server error'});
		}
	}
}

exports.api = {
	get: (req, res) => {
		res.status(200).json({
			success: true,
			data: {
				username: req.user.username,
				email: req.user.email
			}
		});
	},
	put: (req, res) => {
		res.status(200).json({
			success: true,
			data: {
				username: req.user.username,
				email: req.user.email
			},
			token: req.token
		});
	},
	delete: (req, res) => {
		res.status(200).json({
			success: true,
			data: {
				username: req.user.username,
				email: req.user.email
			}
		});
	},
	error: (err, req, res, next) => {
		console.log(err)
		res.status(401).json({
			success: false,
			error: err
		});
	}
}

exports.web = {
	get: (req, res) => {
		res.status(200)
		.render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Account.hbs',
				data: {
					title: 'Account',
					username: req.user.username,
					email: req.user.email
				}
			}
		});
	},
	form: (req, res) => {
		res.status(200)
		.render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/UpdateDetails.hbs',
				data: {
					title: 'Account',
					username: req.user.username,
					email: req.user.email
				}
			}
		});
	},
	post: (req, res) => {
		res.status(200)
		.cookie('token', req.token, { signed: true, secure: true, httpOnly: true})
		.render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Account.hbs',
				data: {
					title: 'Account',
					message: 'Your details were updated.',
					username: req.user.username,
					email: req.user.email
				}
			}
		});
	},
	delete: (req, res) => {
		res.status(200).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Register.hbs',
				data: {
					title: 'User registration',
					confirm: 'Your account was removed.'
				}
			}
		});
	},
	error: (err, req, res, next) => {
		res.status(401).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Login.hbs',
				data: {
					title: 'Login',
					error: err
				}
			}
		});

		// res.status(400).render('base.hbs', {
		// 	model: {
		// 		isDev: process.env.NODE_ENV === 'dev',
		// 		template: 'layouts/UpdateDetails.hbs',
		// 		data: {
		// 			title: 'Account',
		// 			fields: {
		// 				username: req.body.username,
		// 				email: req.body.email
		// 			},
		// 			errors: errors.array().reduce((list, error) => {
		// 				list[error.param] = error.msg;
		// 				return list
		// 			}, {})
		// 		}
		// 	}
		// });
	}
}