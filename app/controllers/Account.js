const {notification} = require('../utils/QueryNotification');

exports.create = {
	get: (req, res) => {
		var options = {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/Register.hbs',
				data: {
					title: 'User registration'
				},
				notification: req.notification
			}
		};
		
		res.render('base.hbs', options);
	},
	post: [
		(req, res, next) => {
			res.status(200)
			.redirect('/login?'+notification('alert', 'Please confirm your email address to complete your registration.'));
		},
		(err, req, res, next) => {
			var options = {
				model: {
					isDev: process.env.NODE_ENV === 'dev',
					template: 'layouts/Register.hbs',
					data: {
						title: 'User registration',
						fields: {
							username: req.body.username,
							email: req.body.email
						}
					}
				}
			}
			if(err.type == 'validation') {
				options.model.data.errors = err.errors;
			} else if(err.type == 'server') {
				options.model.data.errors = {
					server: err.message
				}
			} else {
				options.model.notification = {
					type: error,
					message: err.message
				};
			}

			res.status(400).render('base.hbs', options);
		}
	]
}

exports.confirm = {
	get: async (req, res, next) => {
		res.status(200).redirect('/login?'+notification('confirmation', 'Registration complete.'));
	}
}

exports.login = {
	get: (req, res) => {
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
	post: (req, res) => {
		res.status(200)
		.cookie('token', req.token, { signed: true, secure: true, httpOnly: true})
		.redirect('/account');
	}
}

exports.logout = {
	get: (req, res) => {
		res.status(200)
		.cookie('token', '', { expires: new Date(0), secure: true, signed: true, httpOnly: true})
		.redirect('/login?'+notification('status', 'User logged out.'));
	}
}

exports.recover = {
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
	post: [
		(req, res) => {
			res.status(200)
			.redirect('/login?'+notification('confirmation', 'A new password was sent to your email.'));
		},
		(err, req, res, next) => {
			console.log(err)
			let options = {
				model: {
					isDev: process.env.NODE_ENV === 'dev',
					template: 'layouts/ResetPassword.hbs',
					data: {
						title: 'Reset you password',
						message: 'Please add your registered email to reset your password',
						fields: {
							email: req.body.email
						}
					}
				}
			};

			if(err.type == 'validation') {
				options.model.data.errors = err.errors;
			} else if(err.type == 'server') {
				options.model.data.errors = {
					server: err.message
				}
			} else {
				options.model.notification = {
					type: error,
					message: err.message
				};
			}

			res.status(400).render('base.hbs', options);
		}
	]
}

exports.account = {
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
				},
				notification: req.notification
			}
		});
	}
}

exports.update = {
	get: (req, res) => {
		res.status(200)
		.render('base.hbs', {
			model: {
				isDev: process.env.NODE_ENV === 'dev',
				template: 'layouts/UpdateDetails.hbs',
				data: {
					title: 'Account',
					fields: {
						username: req.user.username,
						email: req.user.email
					}
				}
			}
		});
	},
	post: [
		(req, res) => {
			res.status(200)
			.cookie('token', req.token, { signed: true, secure: true, httpOnly: true})
			.redirect('/account?'+notification('status', 'Account updated'));
		},
		(err, req, res, next) => {
			var options = {
				model: {
					isDev: process.env.NODE_ENV === 'dev',
					template: 'layouts/UpdateDetails.hbs',
					data: {
						title: 'Account',
						fields: {
							username: req.body.username,
							email: req.body.email
						}
					}
				}
			}

			if(err.type == 'validation') {
				options.model.data.errors = err.errors;
			} else if(err.type == 'server') {
				options.model.data.errors = {
					server: err.message
				}
			} else {
				options.model.notification = {
					type: error,
					message: err.message
				};
			}

			res.status(400).render('base.hbs', options);
		}
	]
}

exports.delete = {
	post: (req, res) => {
		res.status(200)
		.cookie('token', req.token, { signed: true, secure: true, httpOnly: true})
		.redirect('/register?'+notification('confirmation', 'Account deleted'));
	}
};

exports.error = (err, req, res, next) => {
	res.status(400)
	.redirect('/login?'+notification('error', err.message || 'Internal error'));

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