

const URL_DB = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json";

// Esperamos a que el HTML esté preparado.
document.addEventListener("DOMContentLoaded", cargarNovelas);

async function cargarNovelas() {
  try {
    const respuesta = await fetch(URL_DB);

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    // Buscamos los contenedores de las tres secciones.
    const contenedorMes = document.querySelector("#mes .contenedor");
    const contenedorVistas = document.querySelector("#vistas .contenedor-secundario");
    const contenedorNuevas = document.querySelector("#nuevas .contenedor-secundario");

    if (!contenedorMes || !contenedorVistas || !contenedorNuevas) {
      throw new Error("No se encontraron los contenedores de novelas en el HTML.");
    }

    if (!Array.isArray(datos.novelas)) {
      throw new Error("El JSON no contiene un array válido llamado 'novelas'.");
    }

    // Quitamos las tarjetas de demostración del HTML.
    contenedorMes.replaceChildren();
    contenedorVistas.replaceChildren();
    contenedorNuevas.replaceChildren();

    const novelas = datos.novelas;

    // Creamos las tarjetas de cada sección.
    // Por ahora usamos el orden del JSON porque no conocemos
    // los campos de popularidad o fecha de publicación.
    novelas.forEach((novela, indice) => {
      const tarjeta = crearTarjeta(novela);

      if (indice < 4) {
        contenedorMes.appendChild(tarjeta);
      } else if (indice < 8) {
        contenedorVistas.appendChild(tarjeta);
      } else if (indice < 12) {
        contenedorNuevas.appendChild(tarjeta);
      }
    });

    // Configuramos el buscador.
    configurarBuscador();

  } catch (error) {
    console.error("Error al cargar las novelas:", error);
  }
}


// Crea una tarjeta usando los datos de una novela.
function crearTarjeta(novela) {
  const wrapper = document.createElement("article");
  wrapper.className = "novela-wrapper";

  const tarjeta = document.createElement("div");
  tarjeta.className = "novela";

  const titulo = document.createElement("h3");
  titulo.textContent = novela.nombre || "Novela sin título";

  const imagen = document.createElement("img");
  imagen.src = novela.imagen || "";
  imagen.alt = novela.nombre || "Portada de novela";
  imagen.loading = "lazy";

  // Si una portada no carga, ocultamos la imagen rota.
  imagen.addEventListener("error", () => {
    imagen.style.display = "none";
  });

  const lore = document.createElement("p");
  lore.className = "lore";
  lore.textContent = novela.lore || "Sin descripción disponible.";

  const valorGenero = document.createElement("div");
  valorGenero.className = "valor-genero";

  const genero = document.createElement("p");
  genero.className = "genero";

  const generosTexto = Array.isArray(novela.genero)
    ? novela.genero.join(", ")
    : novela.genero || "Sin género";

  genero.textContent = generosTexto;

  const valoracion = document.createElement("p");
  valoracion.className = "valoracion";
  valoracion.textContent = novela.valoracion != null
    ? `★ ${novela.valoracion}`
    : "Sin valoración";

  valorGenero.append(genero, valoracion);
  tarjeta.append(titulo, imagen, lore, valorGenero);
  wrapper.appendChild(tarjeta);

  return wrapper;
}


// Filtra las novelas por el texto que escribe el usuario.
function configurarBuscador() {
  const buscador = document.querySelector("#buscador");
  const formulario = document.querySelector(".form-busqueda");

  if (!buscador || !formulario) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
  });

  buscador.addEventListener("input", () => {
    const texto = buscador.value.trim().toLocaleLowerCase();

    document.querySelectorAll(".novela-wrapper").forEach((tarjeta) => {
      const contenido = tarjeta.textContent.toLocaleLowerCase();

      tarjeta.hidden = !contenido.includes(texto);
    });

    document.querySelectorAll(".tarjeta-demo").forEach((tarjeta) => {
      tarjeta.hidden = !tarjeta.textContent.toLocaleLowerCase().includes(texto);
    });
  });
}
