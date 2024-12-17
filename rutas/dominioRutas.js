const express = require('express');
const router = express.Router();
const dominioControlador = require('../controladores/dominioControlador');

// Ruta para agregar un dominio
router.post('/agregar', dominioControlador.agregarDominio);


// Ruta para agregar un tiempo de respuesta a un dominio
router.post('/dominios/:id/tiempos', dominioControlador.agregarTiempoRespuesta);

// Ruta para obtener todos los dominios
router.get('/dominios', dominioControlador.obtenerDominios);

// Ruta para obtener un dominio por ID
router.get('/dominios/:id', dominioControlador.obtenerDominioPorId);

// Ruta para eliminar dominios inactivos
// Ruta para eliminar un dominio por ID
router.delete('/dominios/:id', dominioControlador.eliminarDominioPorId);


module.exports = router;