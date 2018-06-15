const User = require('../models/User');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { generateToken } = require('../utils/Token');
const { password } = require('../utils/RegExp');
const Mail = require('../utils/Mail');

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
			let error = { type: 'server' };

			if(err.code === 11000 && err.message.indexOf('username') > -1) {
				error.message = 'Username '+req.body.username+' already exist.';
			} else if(err.code === 11000 && err.message.indexOf('email') > -1) {
				error.message = 'Email '+req.body.email+' already exist.'
			} else {
				error.message = 'Server error, please try again.';
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