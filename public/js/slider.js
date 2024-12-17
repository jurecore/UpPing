const radioButtons = document.querySelectorAll('input[type=radio]');
let currentIndex = 0; // Índice del radio button actual

const slideShow = () => {
  setInterval(() => {
    // Desmarcar el radio button actual
    radioButtons[currentIndex].checked = false;

    // Incrementar el índice
    currentIndex = (currentIndex + 1) % radioButtons.length; // Volver al inicio si se llega al final

    // Marcar el siguiente radio button
    radioButtons[currentIndex].checked = true;
  }, 3000); // Cambiar cada 3 segundos
}

slideShow();

console.log('Hello');