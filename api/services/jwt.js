'use strict'

var jwt = require('jwt-simple'); 
var moment = require('moment'); 
var secret = 'clave_secreta_pi_petbook'; //para decifrar el token

exports.createToken = function(user){
	var payload ={
		sub: user._id,
		name: user.name,
		surname: user.surname,
		email: user.email,
		role: user.role,
		pets: user.pets,
		image: user.image,
		iat: moment().unix(),
		exp: moment().add(30, 'days').unix
	};

	return jwt.encode(payload, secret);
};