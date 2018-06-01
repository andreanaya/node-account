const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');


passport.use(new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password'
	},
	function(username, password, done) {
		User.findOne({ username: username }).then((user) => {
			if (!user) {
				done(false, {
					sucess: false,
					message: 'User not found'
				});
			} else if (!user.validatePassword(password)) {
				done(false, {
					sucess: false,
					message: 'Incorrect password'
				});
			} else {
				done(user);
			}
		});
	}
));