const URL_DB = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json";
document.addEventListener("DOMContentLoaded", cargarNovelas);

async function cargarNovelas() {
  const contenedorMes = document.querySelector("#mes .contenedor");
  const contenedorVistas = document.querySelector("#vistas .contenedor-secundario");
  const contenedorNuevas = document.querySelector("#nuevas .contenedor-secundario");
  if (!contenedorMes || !contenedorVistas || !contenedorNuevas) {
    console.error("No se encontraron los contenedores de novelas en el HTML.");
    return;
  }

  try {
    const respuesta = await fetch(URL_DB);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} al cargar el catálogo.`);
    const datos = await respuesta.json();
    if (!Array.isArray(datos.novelas)) throw new Error("El JSON no contiene un array válido llamado 'novelas'.");

    contenedorMes.replaceChildren();
    contenedorVistas.replaceChildren();
    contenedorNuevas.replaceChildren();
    datos.novelas.forEach((novela, indice) => {
      const tarjeta = crearTarjeta(novela, indice);
      if (indice < 4) contenedorMes.appendChild(tarjeta);
      else if (indice < 8) contenedorVistas.appendChild(tarjeta);
      else contenedorNuevas.appendChild(tarjeta);
    });
    configurarBuscador();
  } catch (error) {
    console.error("No se pudo cargar el catálogo de novelas:", error);
    mostrarErrorCatalogo(contenedorMes, contenedorVistas, contenedorNuevas);
  }
}

function crearTarjeta(novela, indice) {
  const wrapper = document.createElement("a");
  wrapper.className = "novela-wrapper";
  wrapper.href = `detalle.html?id=${indice}`;
  wrapper.setAttribute("aria-label", `Ver detalles de ${novela.nombre || "esta novela"}`);

  const tarjeta = document.createElement("div");
  tarjeta.className = "novela";
  const titulo = document.createElement("h3");
  titulo.textContent = novela.nombre || "Novela sin título";

  const imagen = document.createElement("img");
  imagen.src = novela.imagen || "";
  imagen.alt = `Portada de ${novela.nombre || "la novela"}`;
  imagen.loading = "lazy";
  imagen.addEventListener("error", () => {
    imagen.removeAttribute("src");
    imagen.alt = "Portada no disponible";
    imagen.style.display = "none";
  });

  const lore = document.createElement("p");
  lore.className = "lore";
  lore.textContent = novela.lore || "Sin descripción disponible.";
  const valorGenero = document.createElement("div");
  valorGenero.className = "valor-genero";
  const genero = document.createElement("p");
  genero.className = "genero";
  genero.textContent = Array.isArray(novela.genero) ? novela.genero.join(", ") : novela.genero || "Sin género";
  const valoracion = document.createElement("p");
  valoracion.className = "valoracion";
  valoracion.textContent = novela.valoracion != null ? `★ ${novela.valoracion}` : "Sin valoración";

  valorGenero.append(genero, valoracion);
  tarjeta.append(titulo, imagen, lore, valorGenero);
  wrapper.appendChild(tarjeta);
  return wrapper;
}

function mostrarErrorCatalogo(...contenedores) {
  contenedores.forEach((contenedor) => {
    contenedor.replaceChildren();
    const mensaje = document.createElement("p");
    mensaje.className = "mensaje-catalogo-error";
    mensaje.textContent = "No se pudo cargar el catálogo. Comprueba tu conexión e inténtalo de nuevo.";
    contenedor.appendChild(mensaje);
  });
}

function configurarBuscador() {
  const buscador = document.querySelector("#buscador");
  const formulario = document.querySelector(".form-busqueda");
  if (!buscador || !formulario) return;
  formulario.addEventListener("submit", (evento) => evento.preventDefault());
  buscador.addEventListener("input", () => {
    const texto = buscador.value.trim().toLocaleLowerCase();
    document.querySelectorAll(".novela-wrapper").forEach((tarjeta) => {
      tarjeta.hidden = !tarjeta.textContent.toLocaleLowerCase().includes(texto);
    });
    document.querySelectorAll(".tarjeta-demo").forEach((tarjeta) => {
      tarjeta.hidden = !tarjeta.textContent.toLocaleLowerCase().includes(texto);
    });
  });
}
