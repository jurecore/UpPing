const Dominio = require('../modelos/Dominio');
const dns = require('dns');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');

/*
1. Funciones de validación
2. Funciones de manejo de dominios0
3. Funciones de manejo de tiempos de respuesta
4. Funciones de eliminación
*/

/* Funciones de validación */
const isValidDomain = (domain) => {
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
};

const isValidIp = (ip) => {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
};

/* Funciones de manejo de dominios */
exports.agregarDominio = async (req, res) => {
    let { nombre, alias } = req.body;
    console.log('Nombre del dominio o IP recibido:', nombre);
    
    if (isValidIp(nombre)) {
        const ipExistente = await Dominio.findOne({ ip: nombre });
        if (ipExistente) {
            return res.status(400).json({ error: 'La IP ya existe' });
        }

        const nuevoDominio = new Dominio({
            nombre,
            alias,
            ip: nombre,
            activo: true,
            servidoresDNS: []
        });

        try {
            await nuevoDominio.save();
            return res.status(200).json(nuevoDominio);
        } catch (err) {
            console.error('Error al guardar la IP:', err);
            return res.status(500).json({ error: 'Error al agregar la IP' });
        }
    } else {
        if (!isValidDomain(nombre)) {
            return res.status(400).json({ error: 'Dominio no válido' });
        }

        const dominioExistente = await Dominio.findOne({ nombre });
        if (dominioExistente) {
            return res.status(400).json({ error: 'El dominio ya existe' });
        }

        dns.lookup(nombre, async (err, ip) => {
            const activo = !err;
            const ipAddress = err ? "IP NO ENCONTRADA" : ip;

            const dominioAsociado = await Dominio.findOne({ ip: ipAddress });
            if (dominioAsociado) {
                return res.status(400).json({ error: 'El dominio ya está asociado a la IP existente' });
            }

            let addresses = [];
            if (activo) {
                dns.resolve(nombre, 'NS', async (err, resolvedAddresses) => {
                    if (!err) {
                        addresses = resolvedAddresses;
                    }

                    const nuevoDominio = new Dominio({
                        nombre,
                        alias,
                        ip: ipAddress,
                        activo,
                        servidoresDNS: addresses
                    });

                    try {
                        await nuevoDominio.save();
                        res.status(200).json(nuevoDominio);
                    } catch (err) {
                        console.error('Error al guardar el dominio:', err);
                        res.status(500).json({ error: 'Error al agregar el dominio' });
                    }
                });
            } else {
                const nuevoDominio = new Dominio({
                    nombre,
                    alias,
                    ip: ipAddress,
                    activo,
                    servidoresDNS: []
                });

                try {
                    await nuevoDominio.save();
                    res.status(200).json(nuevoDominio);
                } catch (err) {
                    console.error('Error al guardar el dominio:', err);
                    res.status(500).json({ error: 'Error al agregar el dominio' });
                }
            }
        });
    }
};

// En controladores/dominioControlador.js
exports.activarPing = async (req, res) => {
    const dominioId = req.params.id;

    try {
        const dominio = await Dominio.findById(dominioId);
        if (!dominio) {
            return res.status(404).json({ error: 'Dominio no encontrado' });
        }

        // Activar el pingueo
        dominio.activo = true; // Cambiar el estado a activo
        await dominio.save();

        // Enviar correo al desactivar el dominio
        await enviarCorreoActivo(dominio.nombre);        

        res.status(200).json({ message: 'Pingueo activado exitosamente', activo: true });
    } catch (err) {
        console.error('Error al activar el pingueo:', err);
        res.status(500).json({ error: 'Error al activar el pingueo' });
    }
};

exports.detenerPing = async (req, res) => {
    const dominioId = req.params.id;

    try {
        const dominio = await Dominio.findById(dominioId);
        if (!dominio) {
            return res.status(404).json({ error: 'Dominio no encontrado' });
        }

        // Desactivar el pingueo
        dominio.activo = false; // Cambiar el estado a inactivo
        await dominio.save();

        // Enviar correo al desactivar el dominio
        await enviarCorreoDesactivacion(dominio.nombre);

        res.status(200).json({ message: 'Pingueo detenido exitosamente', activo: false });
    } catch (err) {
        console.error('Error al detener el pingueo:', err);
        res.status(500).json({ error: 'Error al detener el pingueo' });
    }
};


async function enviarCorreoActivo(dominioNombre) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'matiasjure298@gmail.com',
        subject: `Dominio o host Activado: ${dominioNombre}`,
        html: `El dominio ${dominioNombre} ha sido activado. <br> atte. Soporte de UpPing`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado sobre la desactivación del dominio: ${dominioNombre}`);
    } catch (error) {
        console.error('Error al enviar el correo de desactivación:', error);
    }
}

async function enviarCorreoDesactivacion(dominioNombre) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'matiasjure298@gmail.com',
        subject: `Dominio o host Desactivado: ${dominioNombre}`,
        html: `El dominio ${dominioNombre} ha sido desactivado. <br> atte. Soporte de UpPing`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado sobre la desactivación del dominio: ${dominioNombre}`);
    } catch (error) {
        console.error('Error al enviar el correo de desactivación:', error);
    }
}

exports.agregarIpODominio = async (req, res) => {
    const { nombre, ip } = req.body;

    if (!isValidDomain(nombre)) {
        return res.status(400).json({ error: 'Dominio no válido' });
    }

    const dominioExistente = await Dominio.findOne({ nombre });
    if (dominioExistente) {
        return res.status(400).json({ error: 'El dominio ya existe' });
    }

    const nuevoDominio = new Dominio({
        nombre,
        ip,
        activo: true,
        servidoresDNS: []
    });

    try {
        await nuevoDominio.save();
        res.status(200).json(nuevoDominio);
    } catch (err) {
        console.error('Error al guardar el dominio:', err);
        res.status(500).json({ error: 'Error al agregar el dominio' });
    }
};

exports.agregarDominioOIp = async (req, res) => {
    const { tipo, nombre } = req.body;

    if (tipo === 'dominio' && !isValidDomain(nombre)) {
        return res.status(400).json({ error: 'Dominio no válido' });
    }

    const dominioExistente = await Dominio.findOne({ nombre });
    if (dominioExistente) {
        return res.status(400).json({ error: 'El dominio o IP ya existe' });
    }

    const nuevoDominio = new Dominio({
        nombre,
        ip: tipo === 'ip' ? nombre : undefined,
        activo: true,
        servidoresDNS: []
    });

    try {
        await nuevoDominio.save();
        res.status(200).json(nuevoDominio);
    } catch (err) {
        console.error('Error al guardar el dominio o IP:', err);
        res.status(500).json({ error: 'Error al agregar el dominio o IP' });
    }
};

/* Funciones de manejo de tiempos de respuesta */
exports.obtenerDominios = async (req, res) => {
    try {
        const dominios = await Dominio.find();
        res.status(200).json(dominios);
    } catch (err) {
        console.error('Error al obtener dominios:', err);
        res.status(500).json({ error: 'Error al obtener dominios' });
    }
};

exports.obtenerDominioPorId = async (req, res) => {
    const dominioId = req.params.id;
    try {
        const dominio = await Dominio.findById(dominioId);
        if (!dominio) {
            return res.status(404).json({ error: 'Dominio no encontrado' });
        }

        const tiemposRespuesta = dominio.tiemposRespuesta.map(tiempo => ({
            tiempo: tiempo.tiempo,
            fecha: moment(tiempo.fecha).tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        }));

        res.status(200).json(dominio);
    } catch (err) {
        console.error('Error al obtener el dominio:', err);
        res.status(500).json({ error: 'Error al obtener el dominio' });
    }
};

exports.agregarTiempoRespuesta = async (req, res) => {
    const dominioId = req.params.id;
    const { tiempo } = req.body;

    try {
        const dominio = await Dominio.findById(dominioId);
        if (!dominio) {
            return res.status(404).json({ error: 'Dominio no encontrado' });
        }

        dominio.tiemposRespuesta.push({ tiempo: tiempo, fecha: moment().utc(3).toDate() });

        await dominio.save();
        res.status(200).json(dominio);
    } catch (err) {
        console.error('Error al agregar tiempo de respuesta:', err);
        res.status(500).json({ error: 'Error al agregar tiempo de respuesta' });
    }
};
