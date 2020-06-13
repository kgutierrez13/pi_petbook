'use strict'
var bcrypt = require('bcrypt-nodejs');
var moongosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

var User = require('../models/user'); 
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');

//Metodos de prueba
function home(req,res){
	res.status(200).send({
		message: "Hola mundo"
	});
}

function pruebas(req,res){
	res.status(200).send({
		message: "Hola mundo uwu"
	});
}

//Registro de usuarios
function saveUser(req, res){
	var params = req.body; 
	var user = new User();

	if(params.name && params.surname && 
	   params.password && params.email){

		user.name = params.name; 
		user.surname = params.surname; 
		user.password = params.password; 
		user.email = params.email; 
		user.role = 'ROLE_USER';
		user.image = null;
		user.pets = null;

		//Controlar usuarios duplicados
		User.find({email: user.email.toLowerCase()}).exec((err, users)=>{
			if(err) return res.status(500).send({message: "Error en la petición de usuarios."});

			if(users && users.length >= 1){
				return res.status(200).send({message: "El usuario que intentas registrar, ya existe."})
			}else{
				//Cifrar contraseña y guarda datos
				bcrypt.hash(params.password, null, null, (err, hash)=>{
					user.password = hash;

					user.save((err, userStored)=> {
						if(err) return res.status(500).send({message: "Error al guardar el usuario."});

						if(userStored){
							res.status(200).send({user: userStored}); 
						}else{
							res.status(404).send({message: 'No se ha registrado el usuario.'});
						}
					});
				});
			}
		});
		/* User.findOne({$or: [{email: user.email.toLowerCase()},
							   {nick: user.nick.toLowerCaso()}
						]}).exec((err, users)=>{
							if(err) return res.status(500).send({message: "Error en la petición de usuarios."});

							if(users && users.length >= 1){
								return res.status(200).send({message: "El usuario que intentas registrar, ya existe."})
							}
						});  En caso de que tuviera que validar alguna otra variable*/

	} else {
		res.status(200).send({
			message: 'Todos los campos son necesarios para el registro.'
		}); 
	}
}

//Login
function loginUser(req, res){
	var params = req.body; 

	var email = params.email; 
	var password = params.password; 

	User.findOne({email: email}, (err,user)=> {
		if(err) return res.status(500).send({message: "Error en la petición."}); 

		if(user){
			bcrypt.compare(password, user.password, (err, check)=>{
				if(check){
					//devolver datos de usuario
					if(params.gettoken){
						//generar y devolver token
						return res.status(200).send({
							token: jwt.createToken(user)
						});
					}else{
						//devolver datos de usuario
						user.password = undefined; 
						return res.status(200).send({user});
					}
				} else{
					return res.status(404).send({message: "El usuario no se ha podido identificar."});
				}
			}); //password del form y de la bd
		} else {
			return res.status(404).send({message: "El usuario no se ha podido identificar!!"});
		}
	});
	//find one = where, email , password = and.
}

//Conseguir datos de un usuario y a quienes sigue
function getUser(req, res){
	var userId = req.params.id;

	User.findById(userId, (err, user) => {
		if(err) return res.status(500).send({message: "Error en la petición."});

		if(!user) return res.status(404).send({message: "El usuario no existe."}); 


		followThisUser(req.user.sub, userId).then((value) => {
			console.log(userId.followed);
			return res.status(200).send({
				user,
				following: value.following,
				followed: value.followed
			}); 
		});
	});
}

//funcion asíncrona y se puede ejecutar en cualquier otro método, devuelve una promesa
async function followThisUser(identity_user_id, user_id){
	//console.log(identity_user_id); 
	//console.log(user_id);

	var following = await Follow.findOne({"user":identity_user_id, "followed":user_id}).exec().then((follow) => {
			return follow; 
		}).catch((err) => {
			return handleError(err);
		});

	var followed = await Follow.findOne({"user":user_id, "followed":identity_user_id}).exec().then((follow) => {
			return follow; 
		}).catch((err) => {
			return handleError(err);
		});

	return {
		following: following,
		followed: followed
	}
}


//Devolver un listado de usuarios paginados
function getUsers(req, res){
	var identity_user_id = req.user.sub; 

	var page= 1;
	if(req.params.page){
		page= req.params.page; 
	}

	var itemsPerPage = 5; 

	User.find().sort('_id').paginate(page, itemsPerPage, (err,users, total) => {
		if(err) return res.status(500).send({message: "Error en la petición."}); 

		if(!users) return res.status(404).send({message: "No hay usuarios disponibles."}); 

		followedUserIds(identity_user_id).then((value) => {

			return res.status(200).send({
				users,
				users_following: value.following,   //Se interpreta que users está dentro de la propiedad users del objeto.
				users_follow_me: value.followed,
				total,
				pages: Math.ceil(total/itemsPerPage)
			});
		});
	});
}

async function followedUserIds(user_id){
	var following = await Follow.find({"user":user_id}).select({'_id':0,'__v':0,'user':0}).exec().then((follows) => {
		var follows_clean = [];

		follows.forEach((follow) =>{
			console.log(follow.followed);
			follows_clean.push(follow.followed); 
		});

		return follows_clean;
	}); 

	var followed = await Follow.find({"followed":user_id}).select({'_id':0,'__v':0,'followed':0}).exec().then((follows) => {
		var follows_clean = [];

		follows.forEach((follow) =>{
			follows_clean.push(follow.user); 
		});

		return follows_clean;
	}); 

	return {
		following: following,
		followed: followed
	}
}

function getCounters(req, res){
	var userId = req.user.sub;
	if(req.params.id){
		userId = req.params.id;
	}

	getCountFollow(userId).then((value) =>{
			return res.status(200).send(value);
		});
}

async function getCountFollow(user_id){
	var following = await Follow.countDocuments({"user":user_id}).exec().then((count) => {
		return count;
	}).catch((err) =>{
		return handleError(err);
	});

	var followed = await Follow.countDocuments({"followed":user_id}).exec().then((count) =>{
		return count;
	}).catch((err) =>{
		return handleError(err);
	});

	var publications = await Publication.countDocuments({"user":user_id}).exec().then((count) => {

		return count; 

		}).catch((err) =>{
			return handleError(err);
	});

	return {
		following: following,
		followed: followed,
		publications: publications
	}
}

//Edición de datos de usuario 
function updateUser(req, res){
	var userId = req.params.id; 
	var update = req.body; 

	//borrar la propiedad password
	delete update.password; 

	if(userId != req.user.sub){
		return res.status(500).send({message: 'No tienes permiso para actualizar los datos.'}); 
	}
	
	User.find({email: update.email.toLowerCase()}).exec().then((users) => {
		
		var user_isset = false;
		users.forEach((user) => {
			if(user && user._id != userId) user_isset = true;
		});

		if(user_isset) return res.status(500).send({message: 'Los datos ya están en uso'});

		User.findByIdAndUpdate(userId, update, {new:true}, (err,userUpdated) => {  //new:true regresa el objeto actualizado
			if(err) return res.status(500).send({message: "Error en la petición"});
	
			if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario.'}); 
	
			return res.status(200). send({user: userUpdated});
		});
	}).catch((err) => {
		
	});

}

//subir archivos de imagen/avatar de usuario
function uploadImage(req, res){
	var userId = req.params.id;

	if(req.files){
		var file_path = req.files.image.path;
		console.log(file_path);
		var file_split = file_path.split('\\');
		console.log(file_split);

		var file_name = file_split[2]; 
		console.log(file_name);

		var ext_split = file_name.split('\.');
		console.log(ext_split);
		var file_ext = ext_split[1];
		console.log(file_ext);

		if(userId != req.user.sub){
			return removeFilesOfUploads(res, file_path,'No tienes permiso para actualizar los datos.');
		}

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext=='jpeg' || file_ext=='gif'){

			//actualizar documento de usuario logueado			
			User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdated)=>{
				if(err) return res.status(500).send({message: "Error en la petición."});

				if(!userUpdated) return res.status(500).send({message: "No se ha podido actualizar el usuario."});

				return res.status(200).send({user: userUpdated});
				});
		}else{
			return removeFilesOfUploads(res, file_path, 'Extensión no válida');
		}

	}else{
		return res.status(200).send({message: 'No se ha subido la imagen.'});
	}
}

function removeFilesOfUploads(res, file_path, message){
	fs.unlink(file_path, (err)=>{
			return res.status(200).send({message: message});
		});
}

function getImageFile(req, res){
	var image_file = req.params.imageFile; 
	var path_file = './uploads/users/'+image_file;

	fs.exists(path_file, (exists)=> {
		if(exists){
			res.sendFile(path.resolve(path_file)); 
		}else{
			res.status(200).send({message: 'No existe la imagen.'});
		}
	}); 
}

module.exports = {
	home, 
	pruebas,
	saveUser,
	loginUser, 
	getUser,
	getUsers,
	getCounters,
	updateUser,
	uploadImage,
	getImageFile,
}