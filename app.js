const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dominioRutas = require('./rutas/dominioRutas');
const ping = require('ping');
const Dominio = require('./modelos/Dominio');
const dns = require('dns');
require('dotenv').config();


const baseUrl = process.env.BASE_URL;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/upping')
    .then(() => {
        console.log('Conectado a MongoDB');
        realizarPingATodosLosDominios(); // Llama a la función para hacer ping a todos los dominios
    })
    .catch(err => console.error('No se pudo conectar a MongoDB:', err));



    async function realizarPingATodosLosDominios() {
        try {
            const dominios = await Dominio.find();
            for (const dominio of dominios) {
                if (dominio.activo) {
                    const res = await ping.promise.probe(dominio.nombre);
                    console.log(`Dominio: ${dominio.nombre}, Activo: ${res.alive}, Tiempo: ${res.time} ms`);
    
                    // Medir la pérdida de paquetes
                    const tasaPerdida = await medirPerdidaDePaquetes(dominio.nombre);
                    
                    // Actualizar el estado del dominio en la base de datos
                    dominio.activo = res.alive;
                    dominio.save();
                } else {
                    console.log(`Dominio: ${dominio.nombre} está inactivo, no se realizará ping.`);
                }
            }
        } catch (error) {
            console.error('Error al hacer ping a los dominios:', error);
        }
    }

    async function realizarPingATodosLosDominios() {
        try {
            const dominios = await Dominio.find();
            for (const dominio of dominios) {
                // Solo hacer ping si el dominio está activo
                if (dominio.activo) {
                    const res = await ping.promise.probe(dominio.nombre);
                    console.log(`Dominio: ${dominio.nombre}, Activo: ${res.alive}, Tiempo: ${res.time} ms`);
    
                    dns.lookup(dominio.nombre, (err, ip) => {
                        if (err) {
                            console.error(`Error al resolver IP para ${dominio.nombre}:`, err);
                            dominio.ip = "IP NO ENCONTRADA";
                        } else {
                            dominio.ip = ip;
                        }
                        dominio.activo = res.alive;
                        dominio.save();
                    });
                } else {
                    console.log(`Dominio: ${dominio.nombre} está inactivo, no se realizará ping.`);
                }
            }
    
            // Iniciar el intervalo para verificar el tiempo de respuesta cada 5 segundos
            setInterval(async () => {
                const dominios = await Dominio.find(); // Asegúrate de obtener la lista actualizada de dominios
                for (const dominio of dominios) {
                    // Solo hacer ping si el dominio está activo
                    if (dominio.activo) {
                        const res = await ping.promise.probe(dominio.nombre);
                        console.log(`Dominio: ${dominio.nombre}, Activo: ${res.alive}, Tiempo: ${res.time} ms`);
                        
                        // Actualizar el tiempo de respuesta en la base de datos
                        try {
                            const response = await fetch(`${baseUrl}/api/dominios/${dominio._id}/tiempos`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ tiempo: res.time }), // Envía el tiempo como un número
                            });
    
                            if (!response.ok) {
                                console.error(`Error al registrar tiempo de respuesta para ${dominio.nombre}:`, response.statusText);
                            }
                        } catch (error) {
                            console.error('Error al enviar tiempo de respuesta:', error);
                        }
                    } else {
                        console.log(`Dominio: ${dominio.nombre} está inactivo, no se realizará ping.`);
                    }
                }
            }, 5000); // Ejecuta cada 5 segundos
    
        } catch (error) {
            console.error('Error al hacer ping a los dominios:', error);
        }
    }

app.get('/detalles/:id', (req, res) => {
    res.sendFile(__dirname + '/public/detalle.html');
});

app.get('/dominios', (req, res) => {
    res.sendFile(__dirname + '/public/dominios.html');
});

app.get('/contacto', (req, res) => {
    res.sendFile(__dirname + '/public/contacto.html');
});

app.use('/api', dominioRutas);

app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});