const mongoose = require('mongoose');

// Esquema para el tiempo de respuesta
const tiempoRespuestaSchema = new mongoose.Schema({
    tiempo: { type: Number, required: true }, // Tiempo de respuesta en milisegundos
    fecha: { type: Date, default: Date.now } // Fecha y hora del registro
});

// Esquema para el dominio
const dominioSchema = new mongoose.Schema({
    alias: {type: String, require: true},
    nombre: { type: String, required: true },
    ip: { type: String, required: false },
    activo: { type: Boolean, required: true },
    tiemposRespuesta: { type: [tiempoRespuestaSchema], default: [] }, // Array de objetos de tiempo de respuesta
    servidoresDNS: { type: [String], default: [] },
    fechaCreacion: { type: Date, default: Date.now }
     // Asegúrate de que este campo esté aquí
});

module.exports = mongoose.model('Dominio', dominioSchema);