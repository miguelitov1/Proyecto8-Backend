"use strict";

const Joi = require("joi");
const bcrypt = require("bcryptjs");
const cryptoRandomString = require("crypto-random-string");
const repositorioUsuarios = require("../../repositorios/repositorio_usuarios");
const { enviarEmailDeRegistro } = require("../../email/sendgrid");
const crearErrorJson = require("../errores/crear_error_json");

const schema = Joi.object().keys({
  nombre: Joi.string().alphanum().max(30).required(),
  apellidos: Joi.string().alphanum().max(30).required(),
  email: Joi.string().email().required(),
  contrasenha: Joi.string().min(8).max(20).optional(),
  repetirContrasenha: Joi.ref("contrasenha"),
  nombreUsuario: Joi.string().alphanum().min(3).max(30).required(),
  localidad: Joi.string(),
});

const schemaPassword = Joi.object().keys({
  contrasenha: Joi.string().min(8).max(30).required(),
  repetirContrasenha: Joi.ref("contrasenha"),
});

async function actualizarUsuario(req, res) {
  try {
    const idUsuario = req.auth.id;

    await schema.validateAsync(req.body);
    const {
      nombre,
      apellidos,
      email,
      contrasenha,
      repetirContrasenha,
      nombreUsuario,
      localidad,
    } = req.body;

    const usuarioPorId = repositorioUsuarios.buscarUsuarioPorId(idUsuario);
    const usuarioEmail = await repositorioUsuarios.buscarUsuarioPorEmail(email);
    const usuarioNombreUsuario = await repositorioUsuarios.buscarUsuarioPorNombreUsuario(
      nombreUsuario
    );

    if (usuarioEmail && usuarioEmail.id !== idUsuario) {
      const error = new Error("Ya existe un usuario con ese email");
      error.status = 409;
      throw error;
    }

    if (usuarioNombreUsuario && usuarioNombreUsuario.id !== idUsuario) {
      const error = new Error("Ya existe un usuario con ese nombre de usuario");
      error.status = 409;
      throw error;
    }

    let actualizarContrasenha = usuarioPorId.contrasenha;
    if (contrasenha) {
      await schemaPassword.validateAsync({ contrasenha, repetirContrasenha });
      const passwordHash = await bcrypt.hash(contrasenha, 12);
      actualizarContrasenha = passwordHash;
    }

    if (email != usuarioPorId.email) {
      const codigoDeVerificacion = cryptoRandomString({ length: 64 });
      await enviarEmailDeRegistro(nombre, email, codigoDeVerificacion);
      await repositorioUsuarios.borrarViejoCodigoDeVerificacion(idUsuario);
      await repositorioUsuarios.agregarCodigoDeVerificacion(
        idUsuario,
        codigoDeVerificacion
      );
    }

    await repositorioUsuarios.actualizarUsuarioPorId({
      idUsuario,
      nombre,
      apellidos,
      email,
      contrasenha: actualizarContrasenha,
      nombreUsuario,
      localidad,
    });

    res.send({ idUsuario, nombre, apellidos, email, nombreUsuario, localidad });
  } catch (err) {
    crearErrorJson(err, res);
  }
}

module.exports = actualizarUsuario;
