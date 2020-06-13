'use strict' //poder utilizar nuevas ordenes de js

var mongoose = require('mongoose'); 
var Schema = mongoose.Schema; 

var UserSchema = Schema({
	name: String,
	surname: String,
	email: String,
	password: String,
	role: String, 
	image: String,
	pets: String
});

module.exports = mongoose.model('User', UserSchema); 

