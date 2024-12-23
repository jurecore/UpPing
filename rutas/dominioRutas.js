const express = require('express');
const router = express.Router();
const dominioControlador = require('../controladores/dominioControlador');
const nodemailer = require('nodemailer');
require('dotenv').config();


// Ruta para enviar correo
router.post('/enviar-correo', async (req, res) => {
    const { correo, asunto, mensaje } = req.body;

    // Configura el transportador de nodemailer
    const transporter = nodemailer.createTransport({
        host: 'mail.monobots.ai', // Servidor de salida
        port: 465, // Puerto SMTP
        secure: true, // true para 465, false para otros puertos
        auth: {
            user: process.env.EMAIL_USER, // Usa la variable de entorno
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false // Esto es opcional, pero puede ser necesario si tienes problemas de certificado
        }
    });

    const mailOptions = {
        from: 'matias@monobots.ai',
        to: correo,
        subject: asunto,
        text: mensaje
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Correo enviado' });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).json({ error: 'Error al enviar el correo' });
    }
});

module.exports = router;

// Ruta para agregar un dominio
router.post('/agregar', dominioControlador.agregarDominio);

// Ruta para agregar un tiempo de respuesta a un dominio
router.post('/dominios/:id/tiempos', dominioControlador.agregarTiempoRespuesta);

// Ruta para obtener todos los dominios
router.get('/dominios', dominioControlador.obtenerDominios);

// Ruta para obtener un dominio por ID
router.get('/dominios/:id', dominioControlador.obtenerDominioPorId);

// En rutas/dominioRutas.js
router.post('/dominios/:id/detener', dominioControlador.detenerPing);

// En rutas/dominioRutas.js
router.post('/dominios/:id/activar', dominioControlador.activarPing);


module.exports = router;