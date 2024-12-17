/* Orden jerárquico: 
1. Funciones de verificación
2. Funciones de carga
3. Variables globales
4. Inicialización
*/

/* Funciones de verificación */
async function verificarEstadoDominio(dominio) {
    try {
        const response = await fetch(`${dominio}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Procesar la respuesta
    } catch (error) {
        console.error('Error al verificar el tiempo de respuesta:', error);
        tiempoDiv.innerHTML = `<p>Error al verificar el tiempo de respuesta: ${error.message}</p>`;
    }
}

async function verificarTiempoRespuesta(dominio, dominioId) {
    const tiempoDiv = document.getElementById('tiempoRespuesta');
    setInterval(async () => {
        const start = performance.now();
        try {
            const response = await fetch(`${dominio}`);
            const end = performance.now();
            const tiempo = (end - start).toFixed(2);

            await fetch(`/api/dominios/${dominioId}/tiempos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tiempo: parseFloat(tiempo) }),
            });

            tiemposRespuesta.push(parseFloat(tiempo));
            tiempoDiv.innerHTML = `<p><strong>Último tiempo de respuesta:</strong> ${tiempo} ms</p>`;
        } catch (error) {
            console.error('Error al verificar el tiempo de respuesta:', error);
            tiempoDiv.innerHTML = `<p>Error al verificar el tiempo de respuesta: ${error.message}</p>`;
        }
    }, 2000);
}

/* Funciones de carga */
async function cargarDetalles() {
    const id = window.location.pathname.split('/').pop();
    try {
        const response = await fetch(`/api/dominios/${id}`);
        const dominio = await response.json();

        if (response.ok) {
            const detalleDiv = document.getElementById('detalleDominio');
            detalleDiv.innerHTML = `
                <p><strong>Dominio:</strong> ${dominio.nombre}</p>
                <p><strong>IP:</strong> ${dominio.ip}</p>
                <p><strong>Activo:</strong> ${dominio.activo ? 'Sí' : 'No'}</p>
                <p><strong>Servidores DNS:<br></strong> ${dominio.servidoresDNS.join('<br> ')}</p>
            `;

            document.getElementById('bannerText').innerText = `Detalles del dominio: ${dominio.nombre}`;

            if (dominio.activo) {
                verificarTiempoRespuesta(dominio.nombre, dominio._id);
            } else {
                document.getElementById('tiempoRespuesta').innerHTML = '<p>El dominio está inactivo, no se realizará la verificación del tiempo de respuesta.</p>';
            }
        } else {
            detalleDiv.innerHTML = '<p>Dominio no encontrado.</p>';
        }
    } catch (error) {
        console.error('Error al cargar los detalles del dominio:', error);
        document.getElementById('detalleDominio').innerHTML = '<p>Error al cargar los detalles.</p>';
    }
}

/* Variables globales */
let tiemposRespuesta = [];

// Cargar detalles al iniciar la página
document.addEventListener('DOMContentLoaded', cargarDetalles);