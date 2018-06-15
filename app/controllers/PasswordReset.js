const User = require('../models/User');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const Mail = require('../utils/Mail');

exports.validate = [
	sanitize('email').trim(),
	check('email').isEmail().withMessage('invalid'),
];

exports.reset = async (req, res, next) => {
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

exports.api = {
	post: (req, res, next) => {
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

exports.web = {
	get: (req, res) => {
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
	post: (req, res) => {
		res.status(200).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/ResetPassword.hbs',
				data: {
					title: 'Reset you password',
					message: 'An email was sent with your new password.'
				}
			}
		});
	},
	error: (err, req, res, next) => {
		res.status(400).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/ResetPassword.hbs',
				data: {
					title: 'Reset you password',
					message: 'Please add your registered email to reset your password',
					errors: err
				}
			}
		});
	}
}