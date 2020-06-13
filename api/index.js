'use strict'

var mongoose = require('mongoose'); 
var app = require('./app'); 
var port = 3800; 


//conexion a la db
mongoose.Promise = global.Promise; 
mongoose.connect('mongodb://localhost:27017/pi_petbook',{useMongoClient: true})
	.then(() => {
		console.log('La conexión a la bd petbook se ha realizado correctamente');
	
		//crear servidor
		app.listen(port, () => {
			console.log("Servidor corriendo en http://localhost:3800");
		});
	})
	.catch(err => console.log(err));
