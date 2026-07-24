// Buscamos el botón por su id
let botonInscribirse = document.getElementById("botonInscribirse");

// Buscamos la imagen que está DENTRO del botón
let imagenBoton = botonInscribirse.querySelector("img");

// Lista de "vueltas de color" (en grados de la rueda cromática).
// Como la imagen es ROJA (0°), rotamos el tono para conseguir otros colores:
//   0°   -> 🔴 rojo (el original)
//   120° -> 🟢 verde
//   240° -> 🔵 azul
let colores = [0, 120, 240];

// Guardamos en qué color estamos (empieza en el 0 = rojo)
let colorActual = 0;

// Esta función se ejecuta cada vez que hacemos clic en el botón
function Boton()
{
    // Pasamos al siguiente color de la lista.
    // El "% colores.length" hace que después del último vuelva al primero.
    colorActual = (colorActual + 1) % colores.length;

    // Aplicamos el filtro que rota el tono de la imagen
    imagenBoton.style.filter = "hue-rotate(" + colores[colorActual] + "deg)";
}
