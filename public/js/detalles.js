/*
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

document.getElementById('detenerPing').addEventListener('click', async () => {
    const dominioId = window.location.pathname.split('/').pop(); // Obtener el ID del dominio

    try {
        const response = await fetch(`/api/dominios/${dominioId}/detener`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            Swal.fire({
                title: 'Éxito!',
                text: data.message,
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            // Actualizar el estado del dominio en la interfaz
            document.getElementById('detenerPing').disabled = true; // Deshabilitar el botón
            document.getElementById('estadoDominio').innerText = 'Estado: Inactivo'; // Actualizar el estado
        } else {
            const errorData = await response.json();
            Swal.fire({
                title: 'Error!',
                text: 'Error al detener el ping: ' + errorData.error,
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error al detener el ping:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Ocurrió un error al intentar detener el ping',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
});

// En public/js/detalles.js
document.getElementById('activarPing').addEventListener('click', async () => {
    const dominioId = window.location.pathname.split('/').pop(); // Obtener el ID del dominio

    try {
        const response = await fetch(`/api/dominios/${dominioId}/activar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            Swal.fire({
                title: 'Éxito!',
                text: data.message,
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            // Actualizar el estado del dominio en la interfaz
            document.getElementById('activarPing').disabled = true; // Deshabilitar el botón
            document.getElementById('detenerPing').disabled = false; // Habilitar el botón de detener ping
            document.getElementById('estadoDominio').innerText = 'Estado: Activo'; // Actualizar el estado
        } else {
            const errorData = await response.json();
            Swal.fire({
                title: 'Error!',
                text: 'Error al activar el ping: ' + errorData.error,
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error al activar el ping:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Ocurrió un error al intentar activar el ping',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
});

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