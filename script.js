// ============================================
//   JAVASCRIPT DE NUESTRA PÁGINA
//   JavaScript le da "vida" a la página:
//   hace que las cosas reaccionen y se muevan.
// ============================================

// 1) Buscamos los elementos del HTML por su "id"
const boton = document.getElementById("boton");
const mensaje = document.getElementById("mensaje");

// 2) Una lista de frases para mostrar al azar
const frases = [
  "¡Muy bien! 🎉",
  "¡Estás aprendiendo a programar! 👏",
  "¡Sos una leyenda! 🌟",
  "¡Seguí así! 🚀",
  "¡Qué buen clic! 😎",
];

// 3) Cuando se hace clic en el botón, ejecutamos esta función
boton.addEventListener("click", function () {
  // Elegimos una frase al azar de la lista
  const indiceAlAzar = Math.floor(Math.random() * frases.length);

  // La mostramos en el párrafo con id="mensaje"
  mensaje.textContent = frases[indiceAlAzar];
});

// Mensaje de bienvenida en la consola del navegador (F12)
console.log("¡La página cargó correctamente! 🎈");
