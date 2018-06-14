const User = require('../models/User');
const { sanitize } = require('express-validator/filter');
const { verify } = require('../utils/Token');

exports.validate = [
	sanitize('token').trim().escape()
]

exports.web = {
	get: async (req, res, next) => {
		let token = req.params.token;

		try {
			let payload = verify(token);

			let model = await User.findById(payload._id);

			if(model.active === false) {
				model.active = true;
				await model.save();

				res.status(200).render('base.hbs', {
					model: {
						isDev: process.env.NODE_ENV === 'dev',
						template: 'layouts/Login.hbs',
						data: {
							title: 'Email confirmed',
							message: 'Your account is now active. Please login to view your details.'
						}
					}
				});
			} else {
				next({
					template: 'layouts/Login.hbs',
					message: 'Your account is already active. Please login to view your details.'
				});
			}
		} catch(err) {
			console.log(err)
			next({
				template: 'layouts/Register.hbs',
				message: 'Your email could not be confirmed, please register again with a different email.'
			})
		}
	},
	error: (err, req, res, next) => {
		res.status(200).render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: err.template,
				data: {
					title: 'Login',
					message: err.message
				}
			}
		});
	}
}