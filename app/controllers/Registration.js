const User = require('../models/User');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { generateToken } = require('../utils/Token');
const { password } = require('../utils/RegExp');
const Mail = require('../utils/Mail');

exports.validate = [
	check('username')
		.exists().withMessage('missing')
		.isLength({min: 5}).isAlphanumeric().withMessage('invalid'),
	check('email')
		.exists().withMessage('missing')
		.isEmail().withMessage('invalid'),
	check('password')
		.exists().withMessage('missing')
		.matches(password()).withMessage('invalid'),
	check('passwordConfirmation')
		.exists().withMessage('missing')
		.custom((value, { req }) => value === req.body.password).withMessage('invalid'),
	sanitize('username').trim().escape(),
	sanitize('email').trim(),
	sanitize('password').trim()
];

exports.register = async (req, res, next) => {
	let errors = validationResult(req);
	
	if(errors.isEmpty()) {
		try {
			let model = new User({
				username: req.body.username,
				email: req.body.email,
				password: req.body.password
			});

			let data = await model.save();

			let token = generateToken({
				_id: data._id,
				email: data.email
			});

			let url = 'https://localhost:3000/confirm/'+token;

			Mail.sendMail({
				from: 'hello@andreanaya.com',
				to: data.email,
				subject: 'Please confirm your email',
				text: 'Please click on the link bellow to confirm your email.\n\n'+url+'.',
				html: '<p>Please click on the link bellow to confirm your email</p><a href="'+url+'" target="_blank">'+url+'</a>'
			}, (err, info) => {
				// TO-DO: Log response
				// if(err) console.log(err);
				// if(info) console.log('Email sent', info);
			});

			req.data = {
				title: 'Registration complete',
				email: req.body.email
			}

			next();
		} catch(err) {
			let error = {};

			if(err.code === 11000 && err.message.indexOf('username') > -1) {
				errors.username = 'Username '+req.body.username+' already exist.';
			} else if(err.code === 11000 && err.message.indexOf('email') > -1) {
				errors.email = 'Email '+req.body.email+' already exist.'
			} else {
				errors.server = 'Server error, please try again.';
			}

			console.log(err)

			next(error);
		}
	} else {
		next(errors.array().map((error) => {
			return {
				field: error.param,
				message: error.msg
			}
		}));
	}
}

exports.api = {
	post: (req, res, next) => {
		res.status(200).json({
			success: true,
			data: req.data
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
	form: async (req, res) => {
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
	complete: async (req, res, next) => {
		res.status(200).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/RegistrationComplete.hbs',
				data: req.data
			}
		});
	},
	error: (err, req, res, next) => {
		console.log(err)
		res.status(400).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Register.hbs',
				data: {
					title: 'User registration',
					fields: {
						username: req.body.username,
						email: req.body.email
					},
					errors: err
				}
			}
		});
	}
}