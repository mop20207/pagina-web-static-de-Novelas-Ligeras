
const URL_DB = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json";

document.addEventListener("DOMContentLoaded", cargarNovelas);

// =========================================
// CARGAR NOVELAS DESDE EL JSON
// =========================================

async function cargarNovelas() {
  const contenedorMes = document.querySelector("#mes .contenedor");
  const contenedorVistas = document.querySelector("#vistas .contenedor-secundario");
  const contenedorNuevas = document.querySelector("#nuevas .contenedor-secundario");

  if (!contenedorMes || !contenedorVistas || !contenedorNuevas) {
    console.error("No se encontraron los contenedores de novelas.");
    return;
  }

  try {
    const respuesta = await fetch(URL_DB);

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos.novelas)) {
      throw new Error("El JSON no contiene un array válido de novelas.");
    }

    // Limpiar las tarjetas de demostración del HTML.
    contenedorMes.replaceChildren();
    contenedorVistas.replaceChildren();
    contenedorNuevas.replaceChildren();

    const novelas = datos.novelas;

    // =========================================
    // DISTRIBUIR LAS NOVELAS
    // =========================================

    novelas.forEach((novela, indice) => {

      const tarjeta = crearTarjeta(novela);

      // Primeras 12 novelas.
      if (indice < 12) {
        contenedorMes.appendChild(tarjeta);
      }

      // Siguientes 12 novelas.
      else if (indice < 24) {
        contenedorVistas.appendChild(tarjeta);
      }

      // Todas las novelas restantes.
      else {
        contenedorNuevas.appendChild(tarjeta);
      }

    });

    configurarBuscador();

  } catch (error) {
    console.error("No se pudo cargar el catálogo:", error);

    mostrarErrorCatalogo(
      contenedorMes,
      contenedorVistas,
      contenedorNuevas
    );
  }
}


// =========================================
// CREAR TARJETA DE CADA NOVELA
// =========================================

function crearTarjeta(novela) {

  const wrapper = document.createElement("a");

  wrapper.className = "novela-wrapper";

  // Utilizar el ID ORIGINAL del JSON.
  wrapper.href = `detalle.html?id=${encodeURIComponent(novela.id)}`;

  wrapper.setAttribute(
    "aria-label",
    `Ver detalles de ${novela.nombre || "esta novela"}`
  );

  const tarjeta = document.createElement("div");
  tarjeta.className = "novela";

  // TÍTULO
  const titulo = document.createElement("h3");

  titulo.textContent = novela.nombre || "Novela sin título";

  // PORTADA
  const imagen = document.createElement("img");

  imagen.src = novela.imagen || "";
  imagen.alt = `Portada de ${novela.nombre || "la novela"}`;
  imagen.loading = "lazy";

  imagen.addEventListener("error", () => {
    imagen.removeAttribute("src");
    imagen.alt = "Portada no disponible";
    imagen.style.display = "none";
  });

  // DESCRIPCIÓN
  const lore = document.createElement("p");

  lore.className = "lore";
  lore.textContent = novela.lore || "Sin descripción disponible.";

  // GÉNERO Y VALORACIÓN
  const valorGenero = document.createElement("div");

  valorGenero.className = "valor-genero";

  const genero = document.createElement("p");

  genero.className = "genero";

  genero.textContent = Array.isArray(novela.genero)
    ? novela.genero.join(", ")
    : novela.genero || "Sin género";

  const valoracion = document.createElement("p");

  valoracion.className = "valoracion";

  valoracion.textContent = novela.valoracion != null
    ? `★ ${novela.valoracion}`
    : "Sin valoración";

  valorGenero.append(genero, valoracion);

  // UNIR ELEMENTOS
  tarjeta.append(
    titulo,
    imagen,
    lore,
    valorGenero
  );

  wrapper.appendChild(tarjeta);

  return wrapper;
}


// =========================================
// MENSAJE DE ERROR
// =========================================

function mostrarErrorCatalogo(...contenedores) {

  contenedores.forEach((contenedor) => {

    contenedor.replaceChildren();

    const mensaje = document.createElement("p");

    mensaje.className = "mensaje-catalogo-error";

    mensaje.textContent =
      "No se pudo cargar el catálogo. Comprueba tu conexión e inténtalo de nuevo.";

    contenedor.appendChild(mensaje);

  });
}


// =========================================
// BUSCADOR
// =========================================

function configurarBuscador() {

  const buscador = document.querySelector("#buscador");
  const formulario = document.querySelector(".form-busqueda");

  if (!buscador || !formulario) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
  });

  buscador.addEventListener("input", () => {

    const texto = buscador.value.trim().toLocaleLowerCase();

    const tarjetas = document.querySelectorAll(".novela-wrapper");

    tarjetas.forEach((tarjeta) => {

      const contenido = tarjeta.textContent.toLocaleLowerCase();

      tarjeta.hidden = !contenido.includes(texto);

    });

  });

}
