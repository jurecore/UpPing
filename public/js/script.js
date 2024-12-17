

const modal = document.getElementById("formModal");
const openModalButton = document.getElementById("openModal");
const closeModalButton = document.getElementById("closeModal");

// Abrir el modal
openModalButton.onclick = function() {
    modal.style.display = "block";
}

// Cerrar el modal
closeModalButton.onclick = function() {
    modal.style.display = "none";
}

// Cerrar el modal si se hace clic fuera del contenido del modal
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

async function cargarDominios() {
    try {
        const response = await fetch('/api/dominios');
        const dominios = await response.json();
        console.log(dominios); // Verifica que los dominios se carguen correctamente
        const lista = document.getElementById('listaDominios').getElementsByTagName('tbody')[0];
        lista.innerHTML = ''; // Limpiar la lista antes de agregar nuevos elementos

        dominios.forEach(dominio => {
            const row = lista.insertRow();
            row.innerHTML = `
                <td>
                    ${dominio.nombre}

                </td>
                <td>${dominio.alias}</td>
                <td>${dominio.ip}</td>
                <td><span class="estado ${dominio.activo ? 'activo' : 'inactivo'}"></span> ${dominio.activo ? 'Activo' : 'Inactivo'} </td>
                <td>${moment(dominio.fechaCreacion).tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ssZ')}</td>
                <td>
                    <button class="detalles" onclick="window.location.href='/detalles/${dominio._id}'">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!dominio.activo ? `<button class="eliminar" data-id="${dominio._id}">Eliminar</button>` : ''}
                </td>
                
            `;
        });

        // Inicializar DataTables
        $('#listaDominios').DataTable();
    } catch (error) {
        console.error('Error al cargar dominios:', error);
    }
}


document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('eliminar')) {
        const dominioId = e.target.getAttribute('data-id');

        // Usar SweetAlert2 para la confirmación
        const { value: confirmacion } = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d14529',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminarlo!',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion) {
            try {
                const response = await fetch(`/api/dominios/${dominioId}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                Swal.fire({
                    title: 'Eliminado!',
                    text: data.message,
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
                cargarDominios(); // Recargar la lista de dominios
            } catch (error) {
                console.error('Error al eliminar el dominio:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Error al eliminar el dominio',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        }
    }
});

// Manejar el envío del formulario para agregar un dominio
async function agregarDominio(nombreDominio) {
    try {
        const response = await fetch('/api/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre: nombreDominio })
        });

        if (response.ok) {
            // Usar SweetAlert2 para mostrar un mensaje de éxito
            Swal.fire({
                title: 'Éxito!',
                text: 'Dominio agregado exitosamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
            cargarDominios(); // Recargar la lista de dominios
            document.getElementById('formAgregarDominio').reset(); // Limpiar el formulario
        } else {
            const errorData = await response.json();
            // Usar SweetAlert2 para mostrar un mensaje de error
            Swal.fire({
                title: 'Error!',
                text: 'Error al agregar el dominio: ' + errorData.error,
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error al agregar dominio:', error);
        // Usar SweetAlert2 para mostrar un mensaje de error
        Swal.fire({
            title: 'Error!',
            text: 'Ocurrió un error al intentar agregar el dominio',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Cargar dominios al iniciar la página
document.addEventListener('DOMContentLoaded', cargarDominios);

// Manejar el envío del formulario para agregar un dominio
// Manejar el envío del formulario para agregar un dominio o una IP
document.getElementById('formAgregarDominio').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    const nombreDominio = document.getElementById('nombreDominio').value;
    const aliasDominio = document.getElementById('aliasDominio').value; // Obtener el alias
    
    // Verificar si es una IP
    const isIp = (ip) => {
        const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    };

    try {
        if (isIp(nombreDominio)) {
            // Si es una IP, agregar directamente
            const response = await fetch('/api/agregar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre: nombreDominio, ip: nombreDominio, alias: aliasDominio }) // Asegúrate de enviar el alias
            });

            if (response.ok) {
                Swal.fire({
                    title: 'Éxito!',
                    text: 'IP agregada exitosamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
                cargarDominios(); // Recargar la lista de dominios
                document.getElementById('formAgregarDominio').reset(); // Limpiar el formulario
            } else {
                const errorData = await response.json();
                Swal.fire({
                    title: 'Error!',
                    text: 'Error al agregar la IP: ' + errorData.error,
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        } else {
            // Si no es una IP, se asume que es un dominio
            const response = await fetch('/api/agregar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre: nombreDominio, alias: aliasDominio }) // Asegúrate de enviar el alias
            });

            if (response.ok) {
                Swal.fire({
                    title: 'Éxito!',
                    text: 'Dominio agregado exitosamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
                cargarDominios(); // Recargar la lista de dominios
                document.getElementById('formAgregarDominio').reset(); // Limpiar el formulario
            } else {
                const errorData = await response.json();
                Swal.fire({
                    title: 'Error!',
                    text: 'Error al agregar el dominio: ' + errorData.error,
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        }
    } catch (error) {
        console.error('Error al agregar dominio o IP:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Ocurrió un error al intentar agregar el dominio o IP',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
    modal.style.display = "none"; // Cierra el modal
    document.getElementById('formAgregarDominio').reset();
});



// Manejar el envío de otro formulario (si es necesario)
document.getElementById('dominioForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre').value;

    try {
        await agregarDominio(nombre);
    } catch (error) {
        document.getElementById('mensaje').innerText = 'Error al agregar dominio';
    }
});