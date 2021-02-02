"use strict";

const Joi = require("joi");
const {
  verTodo,
  borrarPorId,
  buscarPorId,
} = require("../../repositorios/repositorio-articulos");
const crearErrorJson = require("../errores/crear-error-json");

const schemaId = Joi.number().positive().required();

async function borrarArticuloPorId(req, res) {
  try {
    const { idArticulo } = req.params;
    const id_usuario = req.auth.id;

    await schemaId.validateAsync(idArticulo);
    const articulo = await buscarPorId(parseInt(idArticulo));

    if (!articulo) {
      const error = new Error("Artículo no encontrado");
      error.status = 400;
      throw error;
    }

    if (articulo.id_usuario !== id_usuario) {
      const error = new Error("No tienes permiso para borrar este articulo");
      error.status = 400;
      throw error;
    }

    await borrarPorId(parseInt(idArticulo));

    const articulos = await verTodo();

    res.status(200).send(articulos);
  } catch (err) {
    crearErrorJson(err, res);
  }
}

module.exports = borrarArticuloPorId;
