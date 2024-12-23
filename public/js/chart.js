let chart; // Variable para almacenar la instancia del gráfico
const UMBRAL_PICO = 50;

// Función principal para cargar el gráfico
async function cargarGrafico(data) {
    if (chart) {
        chart.series[0].setData(data, true); // Actualiza los datos si el gráfico ya existe
        chart.xAxis[0].setExtremes(data[data.length - 1][0] - 60000, data[data.length - 1][0]);
    } else {
        chart = Highcharts.stockChart('container', {
            chart: { height: 400 },
            title: { text: 'Tiempo de Respuesta del Dominio' },
            subtitle: { text: 'Visualización del tiempo de respuesta en milisegundos' },
            rangeSelector: { selected: 1 },
            series: [{
                name: 'Tiempo de Respuesta (ms)',
                data: data,
                type: 'area',
                threshold: null,
                tooltip: { valueDecimals: 2 }
            }],
            responsive: {
                rules: [{
                    condition: { maxWidth: 500 },
                    chartOptions: {
                        chart: { height: 300 },
                        subtitle: { text: null },
                        navigator: { enabled: false }
                    }
                }]
            }
        });
    }
}

// Función para obtener y procesar los datos del dominio
async function obtenerDatosYActualizarGrafico(dominioId) {
    try {
        const dominio = await obtenerDominio(dominioId);
        const tiemposRespuesta = procesarTiemposRespuesta(dominio.tiemposRespuesta);
        cargarGrafico(tiemposRespuesta);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
    }
}

// Función para obtener el dominio desde la API
async function obtenerDominio(dominioId) {
    const response = await fetch(`/api/dominios/${dominioId}`);
    if (!response.ok) {
        throw new Error('Error al obtener el dominio');
    }
    return await response.json();
}

// Función para procesar los tiempos de respuesta
function procesarTiemposRespuesta(tiempos) {
    const tiemposRespuesta = tiempos.map(tiempo => [new Date(tiempo.fecha).getTime(), tiempo.tiempo]);
    tiemposRespuesta.sort((a, b) => a[0] - b[0]); // Ordenar por fecha
    return tiemposRespuesta;
}

// Inicializar el gráfico al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const dominioId = window.location.pathname.split('/').pop();
    obtenerDatosYActualizarGrafico(dominioId);
});


// Inicializar el gráfico al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const dominioId = window.location.pathname.split('/').pop();
    obtenerDatosYActualizarGrafico(dominioId);

    // Configurar un intervalo para actualizar el gráfico cada 1 segundo
    setInterval(() => {
        obtenerDatosYActualizarGrafico(dominioId);
    }, 500); // Actualiza cada 1000 ms (1 segundo)
});