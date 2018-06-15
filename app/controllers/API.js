exports.register = (req, res, next) => {
	res.status(200).json({
		success: true,
		data: {
			status: 'Pending confimation',
			email: req.user.email
		}
	});
}

exports.login = (req, res) => {
	res.status(200).json({
		success: true,
		token: req.token
	});
}

exports.resetPassword = (req, res, next) => {
	res.status(200).json({
		success: true,
		message: 'Password sent to email'
	});
}

exports.account = (req, res, next) => {
	res.status(200).json({
		success: true,
		data: {
			username: req.user.username,
			email: req.user.email
		}
	});
}

exports.update = (req, res) => {
	res.status(200).json({
		success: true,
		data: {
			username: req.user.username,
			email: req.user.email
		},
		token: req.token
	});
}

exports.delete = (req, res) => {
	res.status(200).json({
		success: true,
		data: {
			status: 'User deleted',
			email: req.user.username
		}
	});
}

exports.error = (err, req, res, next) => {
	res.status(400).json({
		success: false,
		error: err
	});
}