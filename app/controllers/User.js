const User = require('../models/User');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { generateToken } = require('../utils/Token');
const { password } = require('../utils/RegExp');
const Mail = require('../utils/Mail');
const {notification} = require('../utils/QueryNotification');

exports.create = [
	check('username')
		.exists().withMessage('missing')
		.isLength({min: 5}).isAlphanumeric().withMessage('invalid'),
	sanitize('username').trim().escape(),

	check('email')
		.exists().withMessage('missing')
		.isEmail().withMessage('invalid'),
	sanitize('email').trim(),
	
	check('password')
		.exists().withMessage('missing')
		.matches(password()).withMessage('invalid'),
	check('passwordConfirmation')
		.exists().withMessage('missing')
		.custom((value, { req }) => value === req.body.password).withMessage('invalid'),
	sanitize('password').trim(),

	async (req, res, next) => {
		try {
			let model = new User({
				username: req.body.username,
				email: req.body.email,
				password: req.body.password
			});

			let user = await model.save();

			let token = generateToken({
				_id: data._id,
				email: data.email
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

exports.update = [
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
		.custom((value, { req }) => req.body.password !== undefined && req.body.password !== '' ? value === req.body.password : true).withMessage('invalid'),

	async (req, res, next) => {
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

exports.api = 	{
	register: (req, res, next) => {
		res.status(200).json({
			success: true,
			data: {
				status: 'Pending confimation',
				email: req.user.email
			}
		});
	},
	account: (req, res, next) => {
		res.status(200).json({
			success: true,
			data: {
				username: req.user.username,
				email: req.user.email
			}
		});
	},
	update: (req, res) => {
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
				status: 'User deleted',
				email: req.user.username
			}
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
	register: (req, res) => {
		var options = {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Register.hbs',
				data: {
					title: 'User registration'
				}
			}
		};
		
		res.render('base.hbs', options);
	},
	registrationComplete: (req, res, next) => {
		res.status(200)
		.redirect('/login'+notification('Aler', 'Please confirm your email address to complete your registration.'));
	},
	account: (req, res) => {
		res.status(200)
		.render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Account.hbs',
				data: {
					title: 'Account',
					username: req.user.username,
					email: req.user.email
				},
				notification: req.notification
			}
		});
	},
	update: (req, res) => {
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
	updateComplete: (req, res) => {
		res.status(200)
		.cookie('token', req.token, { signed: true, secure: true, httpOnly: true})
		.redirect('/account?'+notification('status', 'Account updated'));
	},
	delete: (req, res) => {
		res.status(200)
		.cookie('token', req.token, { signed: true, secure: true, httpOnly: true})
		.redirect('/register?'+notification('confirmation', 'Account deleted'));
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