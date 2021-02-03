"use strict";

const Joi = require("joi");
const {
  validarActivacion,
} = require("../../repositorios/repositorio-usuarios");
const crearErrorJson = require("../errores/crear-error-json");

const schema = Joi.string().min(64).max(64).required();

async function activarUsuario(req, res) {
  try {
    const { codigo_verificacion: codigoVerificacion } = req.query;

    if (!codigoVerificacion) {
      const error = new Error("Codigo de verificación invalido");
      error.status = 400;
      throw error;
    }
    await schema.validateAsync(codigoVerificacion);

    const estaActivado = await validarActivacion(codigoVerificacion);

    if (!estaActivado) {
      res.send("Cuenta no creada. El codigo de verificacion ha expirado");
    } else {
      res.send("¡Cuenta creada exitosamente!");
    }
  } catch (err) {
    crearErrorJson(err, res);
  }
}

module.exports = activarUsuario;