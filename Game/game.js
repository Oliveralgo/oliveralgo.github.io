// ============================================
//   LA EXPEDICIÓN DE EL DORADO
//   Juego tipo clicker / tycoon.
//   La idea: haces clic para conseguir oro,
//   y con el oro contratas gente que consigue
//   oro por vos mientras no haces nada.
// ============================================


// --------------------------------------------
// 1) DATOS DEL JUEGO
// --------------------------------------------

// Todo lo que el jugador va acumulando vive aquí dentro.
let partida =
{
  oro: 0,           // oro disponible para gastar
  oroTotal: 0,      // oro conseguido en toda la partida (para el progreso)
  reliquias: 0,     // souvenirs raros que aparecen de vez en cuando
  clics: 0,
  etapa: 0,
  ultimaVez: 0,     // marca de tiempo del último guardado (para el progreso offline)
};

// Miembros de la expedición: producen oro por segundo.
// "cantidad" es cuántos llevamos comprados.
const generadores =
[
  { id: "portador",   icono: "🎒", nombre: "Porteador",        precioBase: 15,      produccion: 0.2,  cantidad: 0, descripcion: "Carga el equipo y encuentra pepitas en el camino." },
  { id: "explorador", icono: "🧭", nombre: "Explorador",       precioBase: 100,     produccion: 1,    cantidad: 0, descripcion: "Abre nuevas rutas dentro de la selva." },
  { id: "canoa",      icono: "🛶", nombre: "Canoa del río",    precioBase: 1100,    produccion: 8,    cantidad: 0, descripcion: "Remonta el Amazonas buscando afluentes de oro." },
  { id: "campamento", icono: "⛺", nombre: "Campamento base",  precioBase: 12000,   produccion: 47,   cantidad: 0, descripcion: "Permite excavar durante toda la noche." },
  { id: "cartografo", icono: "🗺️", nombre: "Cartógrafo",       precioBase: 130000,  produccion: 260,  cantidad: 0, descripcion: "Dibuja el mapa que nadie más supo leer." },
  { id: "templo",     icono: "🏛️", nombre: "Templo excavado",  precioBase: 1400000, produccion: 1400, cantidad: 0, descripcion: "Cada sala escondida está llena de ofrendas." },
];

// Mejoras: suman al oro que da cada clic. Se compran una sola vez.
const mejoras =
[
  { id: "machete",  icono: "🔪", nombre: "Machete afilado",    precio: 50,     bonus: 1,   comprada: false, descripcion: "+1 de oro por clic." },
  { id: "linterna", icono: "🔦", nombre: "Linterna",           precio: 500,    bonus: 4,   comprada: false, descripcion: "+4 de oro por clic." },
  { id: "pico",     icono: "⛏️", nombre: "Pico de acero",      precio: 5000,   bonus: 20,  comprada: false, descripcion: "+20 de oro por clic." },
  { id: "diario",   icono: "📖", nombre: "Diario del capitán", precio: 60000,  bonus: 120, comprada: false, descripcion: "+120 de oro por clic." },
  { id: "amuleto",  icono: "🪬", nombre: "Amuleto muisca",     precio: 750000, bonus: 900, comprada: false, descripcion: "+900 de oro por clic." },
];

// Etapas del viaje: se desbloquean según el oro TOTAL conseguido.
const etapas =
[
  { nombre: "Etapa 1: El puerto de Cartagena",      meta: 100 },
  { nombre: "Etapa 2: Río arriba por el Magdalena", meta: 2500 },
  { nombre: "Etapa 3: La selva cerrada",            meta: 50000 },
  { nombre: "Etapa 4: La laguna de Guatavita",      meta: 900000 },
  { nombre: "Etapa 5: Las escaleras de piedra",     meta: 15000000 },
  { nombre: "Etapa 6: Las puertas de El Dorado",    meta: 250000000 },
];

const frasesDeClic =
[
  "Brilla algo entre las raíces… ✨",
  "Una pepita de oro en el barro. 💧",
  "Los loros gritan sobre tu cabeza. 🦜",
  "Huellas de jaguar cerca del río. 🐆",
  "Una piedra tallada con símbolos. 🗿",
  "El guía sonríe: vamos bien. 🙂",
];

const CLAVE_GUARDADO = "expedicionElDorado";
const VERSION_GUARDADO = 1;

// Cuántas horas de producción como máximo se regalan al volver al juego
const HORAS_OFFLINE_MAX = 8;


// --------------------------------------------
// 2) ELEMENTOS DEL HTML
// --------------------------------------------

const elOro = document.getElementById("oro");
const elOroPorSegundo = document.getElementById("oroPorSegundo");
const elOroPorClic = document.getElementById("oroPorClic");
const elReliquias = document.getElementById("reliquias");
const elMensaje = document.getElementById("mensaje");
const elDiario = document.getElementById("diario");
const elEtapa = document.getElementById("etapaActual");
const elBarra = document.getElementById("barraProgreso");
const elTextoProgreso = document.getElementById("textoProgreso");
const elListaGeneradores = document.getElementById("listaGeneradores");
const elListaMejoras = document.getElementById("listaMejoras");
const elCodigo = document.getElementById("codigoPartida");
const botonExplorar = document.getElementById("botonExplorar");
const botonGuardar = document.getElementById("botonGuardar");
const botonReiniciar = document.getElementById("botonReiniciar");
const botonExportar = document.getElementById("botonExportar");
const botonImportar = document.getElementById("botonImportar");


// --------------------------------------------
// 3) CÁLCULOS
// --------------------------------------------

// Cuánto oro da cada clic (1 de base + las mejoras compradas)
function oroPorClic()
{
  let total = 1;

  for (const mejora of mejoras)
  {
    if (mejora.comprada)
    {
      total = total + mejora.bonus;
    }
  }

  return total;
}

// Cuánto oro produce sola la expedición cada segundo
function oroPorSegundo()
{
  let total = 0;

  for (const generador of generadores)
  {
    total = total + generador.produccion * generador.cantidad;
  }

  return total;
}

// El precio sube un 15% por cada unidad comprada.
// Así el juego nunca se vuelve demasiado fácil.
function precioDe(generador)
{
  return Math.ceil(generador.precioBase * Math.pow(1.15, generador.cantidad));
}

// Escribe los números grandes de forma corta: 1.2K, 3.4M…
function formatearNumero(numero)
{
  const sufijos = ["", "K", "M", "B", "T"];
  let indice = 0;

  while (numero >= 1000 && indice < sufijos.length - 1)
  {
    numero = numero / 1000;
    indice = indice + 1;
  }

  const decimales = (indice === 0) ? 0 : 1;
  return numero.toFixed(decimales) + sufijos[indice];
}


// --------------------------------------------
// 4) ACCIONES DEL JUGADOR
// --------------------------------------------

function explorar(evento)
{
  const ganancia = oroPorClic();

  partida.oro = partida.oro + ganancia;
  partida.oroTotal = partida.oroTotal + ganancia;
  partida.clics = partida.clics + 1;

  mostrarOroFlotante(evento, ganancia);

  // Cada 10 clics soltamos una frase de ambiente
  if (partida.clics % 10 === 0)
  {
    const alAzar = Math.floor(Math.random() * frasesDeClic.length);
    elMensaje.textContent = frasesDeClic[alAzar];
  }

  // 2% de posibilidad de encontrar una reliquia
  if (Math.random() < 0.02)
  {
    partida.reliquias = partida.reliquias + 1;
    escribirEnDiario("🏺 ¡Encontraste una reliquia! Ya tienes " + partida.reliquias + ".");
  }
}

function comprarGenerador(generador)
{
  const precio = precioDe(generador);

  // Nunca deshabilitamos el botón (eso hace que se pierdan clics),
  // así que aquí avisamos si todavía no alcanza.
  if (partida.oro < precio)
  {
    elMensaje.textContent = "Te faltan " + formatearNumero(precio - partida.oro) + " de oro para eso.";
    return;
  }

  partida.oro = partida.oro - precio;
  generador.cantidad = generador.cantidad + 1;

  escribirEnDiario(generador.icono + " Se une un " + generador.nombre.toLowerCase() + " (llevas " + generador.cantidad + ").");
}

function comprarMejora(mejora)
{
  if (mejora.comprada)
  {
    return;
  }

  if (partida.oro < mejora.precio)
  {
    elMensaje.textContent = "Te faltan " + formatearNumero(mejora.precio - partida.oro) + " de oro para eso.";
    return;
  }

  partida.oro = partida.oro - mejora.precio;
  mejora.comprada = true;

  escribirEnDiario(mejora.icono + " Equipas: " + mejora.nombre + ".");
}


// --------------------------------------------
// 5) DIBUJAR LA PANTALLA
// --------------------------------------------
// Regla importante: el HTML de la tienda se crea UNA sola vez.
// Después solo cambiamos el texto que de verdad cambió.
// Si reconstruyéramos el HTML en cada fotograma, el navegador
// destruiría el botón justo mientras lo estás apretando y se
// perderían los clics.

function crearTarjeta(datos, alPulsar)
{
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "item";

  boton.innerHTML =
    '<span class="item-icono"></span>' +
    '<span class="item-texto">' +
      '<span class="item-nombre"></span>' +
      '<span class="item-detalle"></span>' +
    '</span>' +
    '<span class="item-precio"></span>' +
    '<span class="item-cantidad"></span>';

  // Guardamos referencias a las partes que van a cambiar
  datos.vista =
  {
    boton: boton,
    precio: boton.querySelector(".item-precio"),
    cantidad: boton.querySelector(".item-cantidad"),
    alcanza: null,   // recordamos el último estado para no tocar el DOM de más
    ultimoPrecio: null,
    ultimaCantidad: null,
  };

  boton.querySelector(".item-icono").textContent = datos.icono;
  boton.querySelector(".item-nombre").textContent = datos.nombre;
  boton.addEventListener("click", alPulsar);

  return boton;
}

function crearTienda()
{
  for (const generador of generadores)
  {
    const boton = crearTarjeta(generador, function () { comprarGenerador(generador); });
    boton.querySelector(".item-detalle").textContent =
      generador.descripcion + " (+" + generador.produccion + " oro/s)";
    elListaGeneradores.appendChild(boton);
  }

  for (const mejora of mejoras)
  {
    const boton = crearTarjeta(mejora, function () { comprarMejora(mejora); });
    boton.querySelector(".item-detalle").textContent = mejora.descripcion;
    boton.querySelector(".item-cantidad").remove();
    mejora.vista.cantidad = null;
    elListaMejoras.appendChild(boton);
  }
}

// Cambia el texto de un elemento solo si hace falta
function ponerTexto(elemento, texto)
{
  if (elemento && elemento.textContent !== texto)
  {
    elemento.textContent = texto;
  }
}

function actualizarPantalla()
{
  ponerTexto(elOro, formatearNumero(Math.floor(partida.oro)));
  ponerTexto(elOroPorSegundo, formatearNumero(oroPorSegundo()));
  ponerTexto(elOroPorClic, formatearNumero(oroPorClic()));
  ponerTexto(elReliquias, String(partida.reliquias));

  for (const generador of generadores)
  {
    const vista = generador.vista;
    const precio = precioDe(generador);

    if (vista.ultimoPrecio !== precio)
    {
      vista.ultimoPrecio = precio;
      ponerTexto(vista.precio, "💰 " + formatearNumero(precio));
    }

    if (vista.ultimaCantidad !== generador.cantidad)
    {
      vista.ultimaCantidad = generador.cantidad;
      ponerTexto(vista.cantidad, String(generador.cantidad));
    }

    marcarSiAlcanza(vista, partida.oro >= precio);
  }

  for (const mejora of mejoras)
  {
    const vista = mejora.vista;

    if (mejora.comprada)
    {
      ponerTexto(vista.precio, "✔️ Listo");
      marcarSiAlcanza(vista, true);
      vista.boton.classList.add("comprada");
    }
    else
    {
      ponerTexto(vista.precio, "💰 " + formatearNumero(mejora.precio));
      marcarSiAlcanza(vista, partida.oro >= mejora.precio);
    }
  }

  actualizarProgreso();
}

// En vez de "disabled" usamos una clase: el botón se ve apagado
// pero sigue recibiendo el clic (y respondiendo con un aviso).
function marcarSiAlcanza(vista, alcanza)
{
  if (vista.alcanza === alcanza)
  {
    return;
  }

  vista.alcanza = alcanza;
  vista.boton.classList.toggle("no-alcanza", !alcanza);
}

function actualizarProgreso()
{
  // ¿Alcanzamos la meta de la etapa actual?
  while (partida.etapa < etapas.length && partida.oroTotal >= etapas[partida.etapa].meta)
  {
    partida.etapa = partida.etapa + 1;

    if (partida.etapa < etapas.length)
    {
      escribirEnDiario("🧭 ¡Nueva etapa! " + etapas[partida.etapa].nombre);
    }
    else
    {
      escribirEnDiario("🏆 ¡Encontraste El Dorado! La leyenda era cierta.");
      elMensaje.textContent = "🏆 ¡El Dorado es tuyo! Puedes seguir jugando.";
    }
  }

  if (partida.etapa >= etapas.length)
  {
    ponerTexto(elEtapa, "🏆 El Dorado descubierto");
    elBarra.style.width = "100%";
    ponerTexto(elTextoProgreso, "Oro total reunido: " + formatearNumero(Math.floor(partida.oroTotal)));
    return;
  }

  const etapa = etapas[partida.etapa];
  const inicio = (partida.etapa === 0) ? 0 : etapas[partida.etapa - 1].meta;
  const avance = (partida.oroTotal - inicio) / (etapa.meta - inicio) * 100;

  ponerTexto(elEtapa, etapa.nombre);
  elBarra.style.width = Math.min(100, Math.max(0, avance)).toFixed(1) + "%";
  ponerTexto(elTextoProgreso,
    formatearNumero(Math.floor(partida.oroTotal)) + " / " + formatearNumero(etapa.meta) + " de oro total reunido");
}

function escribirEnDiario(texto)
{
  const linea = document.createElement("li");
  linea.textContent = texto;
  elDiario.prepend(linea);

  // Solo guardamos las últimas 30 entradas
  while (elDiario.children.length > 30)
  {
    elDiario.lastElementChild.remove();
  }
}

// Muestra el "+5" que sube desde donde hiciste clic
function mostrarOroFlotante(evento, cantidad)
{
  const numero = document.createElement("span");
  numero.className = "oro-flotante";
  numero.textContent = "+" + formatearNumero(cantidad);
  numero.style.left = evento.pageX + "px";
  numero.style.top = evento.pageY - 20 + "px";

  document.body.appendChild(numero);

  // Lo borramos cuando la animación del CSS termina
  numero.addEventListener("animationend", function () { numero.remove(); });
}


// --------------------------------------------
// 6) GUARDAR, CARGAR, EXPORTAR E IMPORTAR
// --------------------------------------------

// Empaqueta la partida en un objeto sencillo.
// Guardamos solo lo que cambia: el resto (precios,
// nombres, iconos) ya está aquí en el código.
function empaquetar()
{
  partida.ultimaVez = Date.now();

  return {
    version: VERSION_GUARDADO,
    partida: partida,
    generadores: generadores.map(function (g) { return { id: g.id, cantidad: g.cantidad }; }),
    mejoras: mejoras.filter(function (m) { return m.comprada; }).map(function (m) { return m.id; }),
  };
}

// Vuelca un paquete sobre el estado actual del juego
function desempaquetar(datos)
{
  if (!datos || datos.version !== VERSION_GUARDADO)
  {
    throw new Error("El código de partida no es válido.");
  }

  partida = Object.assign(partida, datos.partida);

  for (const generador of generadores)
  {
    const guardado = datos.generadores.find(function (g) { return g.id === generador.id; });
    generador.cantidad = guardado ? guardado.cantidad : 0;
  }

  for (const mejora of mejoras)
  {
    mejora.comprada = datos.mejoras.includes(mejora.id);
  }
}

function guardar(avisar)
{
  try
  {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(empaquetar()));

    if (avisar)
    {
      elMensaje.textContent = "💾 Partida guardada.";
    }
  }
  catch (error)
  {
    // Puede fallar si el navegador bloquea el almacenamiento
    // (modo incógnito, permisos, disco lleno…)
    console.warn("No se pudo guardar:", error);

    if (avisar)
    {
      elMensaje.textContent = "⚠️ Este navegador no deja guardar la partida.";
    }
  }
}

function cargar()
{
  let texto = null;

  try
  {
    texto = localStorage.getItem(CLAVE_GUARDADO);
  }
  catch (error)
  {
    console.warn("No se pudo leer la partida guardada:", error);
    return;
  }

  if (!texto)
  {
    return;
  }

  try
  {
    desempaquetar(JSON.parse(texto));
    escribirEnDiario("💾 Partida cargada. La expedición continúa.");
    calcularProduccionOffline();
  }
  catch (error)
  {
    console.warn("La partida guardada estaba dañada:", error);
    escribirEnDiario("⚠️ No se pudo leer la partida guardada.");
  }
}

// La expedición sigue trabajando mientras la pestaña está cerrada
function calcularProduccionOffline()
{
  if (!partida.ultimaVez)
  {
    return;
  }

  const segundos = Math.min((Date.now() - partida.ultimaVez) / 1000, HORAS_OFFLINE_MAX * 3600);

  if (segundos < 60)
  {
    return;
  }

  const ganancia = oroPorSegundo() * segundos;

  if (ganancia <= 0)
  {
    return;
  }

  partida.oro = partida.oro + ganancia;
  partida.oroTotal = partida.oroTotal + ganancia;

  const minutos = Math.floor(segundos / 60);
  escribirEnDiario("⏳ Mientras no estabas, la expedición reunió " + formatearNumero(ganancia) + " de oro (" + minutos + " min).");
}

// Exportar: convertimos la partida en un texto que se puede copiar.
// btoa() lo pasa a base64 para que no se rompa al copiar y pegar.
function exportar()
{
  const json = JSON.stringify(empaquetar());
  elCodigo.value = btoa(unescape(encodeURIComponent(json)));
  elCodigo.select();
  elMensaje.textContent = "📋 Copia ese código y guárdalo en un sitio seguro.";
}

function importar()
{
  const codigo = elCodigo.value.trim();

  if (!codigo)
  {
    elMensaje.textContent = "Pega primero un código de partida en el recuadro.";
    return;
  }

  if (!confirm("Importar sustituye tu partida actual. ¿Continuar?"))
  {
    return;
  }

  try
  {
    const json = decodeURIComponent(escape(atob(codigo)));
    desempaquetar(JSON.parse(json));

    guardar(false);
    actualizarPantalla();
    escribirEnDiario("📥 Partida importada correctamente.");
    elMensaje.textContent = "📥 ¡Bienvenido de vuelta, explorador!";
  }
  catch (error)
  {
    console.warn("Código inválido:", error);
    elMensaje.textContent = "⚠️ Ese código no es válido.";
  }
}

function reiniciar()
{
  if (!confirm("¿Seguro que quieres abandonar la expedición y empezar de cero?"))
  {
    return;
  }

  try { localStorage.removeItem(CLAVE_GUARDADO); } catch (error) { /* da igual */ }
  location.reload();
}


// --------------------------------------------
// 7) EL BUCLE DEL JUEGO
// --------------------------------------------
// JavaScript en el navegador tiene un solo hilo: si nos ponemos
// a calcular sin parar, la página se congela y no responde a los
// clics. Por eso usamos requestAnimationFrame: el navegador nos
// llama cuando ya terminó de atender los eventos y va a dibujar.
//
// Además medimos el tiempo REAL entre fotogramas (delta), así el
// oro avanza igual de rápido en un móvil lento que en un PC, y no
// se pierde nada si el navegador salta fotogramas.

let ultimoFotograma = 0;
let tiempoSinDibujar = 0;

const MS_ENTRE_DIBUJOS = 100;   // refrescamos los textos 10 veces por segundo

function bucle(ahora)
{
  // Programamos ya el siguiente fotograma: si algo falla,
  // el juego no se queda muerto.
  requestAnimationFrame(bucle);

  if (!ultimoFotograma)
  {
    ultimoFotograma = ahora;
    return;
  }

  const delta = (ahora - ultimoFotograma) / 1000;   // segundos transcurridos
  ultimoFotograma = ahora;

  // --- lógica: sumar la producción ---
  const ganancia = oroPorSegundo() * delta;
  partida.oro = partida.oro + ganancia;
  partida.oroTotal = partida.oroTotal + ganancia;

  // --- dibujo: solo cada 100 ms, no en cada fotograma ---
  tiempoSinDibujar = tiempoSinDibujar + delta * 1000;

  if (tiempoSinDibujar >= MS_ENTRE_DIBUJOS)
  {
    tiempoSinDibujar = 0;
    actualizarPantalla();
  }
}

// Cuando la pestaña queda en segundo plano el navegador para los
// fotogramas, pero el reloj sigue corriendo. Al volver, el primer
// delta ya vale por todo ese rato, así que NO hay que sumar nada
// a mano (si lo hiciéramos, contaríamos el tiempo dos veces).
document.addEventListener("visibilitychange", function ()
{
  if (document.hidden)
  {
    guardar(false);
  }
  else
  {
    actualizarPantalla();
  }
});


// --------------------------------------------
// 8) ARRANQUE
// --------------------------------------------

botonExplorar.addEventListener("click", explorar);
botonGuardar.addEventListener("click", function () { guardar(true); });
botonReiniciar.addEventListener("click", reiniciar);
botonExportar.addEventListener("click", exportar);
botonImportar.addEventListener("click", importar);

crearTienda();
cargar();
actualizarPantalla();

requestAnimationFrame(bucle);

// Guardado automático cada 15 segundos y también al cerrar la pestaña
setInterval(function () { guardar(false); }, 15000);
window.addEventListener("pagehide", function () { guardar(false); });

console.log("🗺️ La expedición ha comenzado. ¡Buena suerte!");
