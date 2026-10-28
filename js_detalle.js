
function crearTarjeta(novela, indice) {
  // La tarjeta ahora enlaza con la ficha de la novela.
  const wrapper = document.createElement("a");
  wrapper.className = "novela-wrapper";
  wrapper.href = `detalle.html?id=${indice}`;
  wrapper.setAttribute(
    "aria-label",
    `Ver detalles de ${novela.nombre || "esta novela"}`
  );

  const tarjeta = document.createElement("div");
  tarjeta.className = "novela";

  const titulo = document.createElement("h3");
  titulo.textContent = novela.nombre || "Novela sin título";

  const imagen = document.createElement("img");
  imagen.src = novela.imagen || "";
  imagen.alt = novela.nombre || "Portada de novela";
  imagen.loading = "lazy";

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
  genero.textContent = Array.isArray(novela.genero)
    ? novela.genero.join(", ")
    : novela.genero || "Sin género";

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

const URL_DB = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json";

document.addEventListener("DOMContentLoaded", cargarDetalle);

async function cargarDetalle() {
  const mensajeError = document.querySelector("#mensaje-error");

  try {
    // Obtenemos el identificador enviado desde index.html.
    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    if (id === null || !/^\d+$/.test(id)) {
      throw new Error("Identificador de novela inválido.");
    }

    // Descargamos las novelas desde GitHub.
    const respuesta = await fetch(URL_DB);

    if (!respuesta.ok) {
      throw new Error("No se pudo descargar el catálogo.");
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos.novelas)) {
      throw new Error("El catálogo no tiene una lista válida de novelas.");
    }

    const novela = datos.novelas[Number(id)];

    if (!novela) {
      throw new Error("No se encontró esa novela.");
    }

    // Mostramos la información de la novela.
    document.querySelector("#titulo").textContent =
      novela.nombre || "Novela sin título";

    document.querySelector("#miga-titulo").textContent =
      novela.nombre || "Novela";

    document.querySelector("#descripcion").textContent =
      novela.lore || "Esta novela todavía no tiene una descripción.";

    const generos = Array.isArray(novela.genero)
      ? novela.genero.join(", ")
      : novela.genero || "Sin género";

    document.querySelector("#generos").textContent = generos;

    document.querySelector("#valoracion").textContent =
      novela.valoracion != null
        ? `★ ${novela.valoracion}`
        : "★ Sin valoración";

    const portada = document.querySelector("#portada");
    portada.src = novela.imagen || "";
    portada.alt = `Portada de ${novela.nombre || "la novela"}`;

    portada.addEventListener("error", () => {
      portada.removeAttribute("src");
      portada.alt = "Portada no disponible";
      portada.style.minHeight = "250px";
    });

    // Generamos volúmenes ficticios para la presentación.
    crearVolumenes(novela.nombre || "esta novela");

    document.title = `${novela.nombre || "Novela"} | Novelas Ligeras`;

  } catch (error) {
    console.error("Error al cargar el detalle:", error);

    mensajeError.hidden = false;
    document.querySelector(".ficha-novela").hidden = true;
    document.querySelector(".seccion-volumenes").hidden = true;
    document.querySelector(".migas").hidden = true;
  }
}


function crearVolumenes(nombreNovela) {
  const lista = document.querySelector("#lista-volumenes");

  const volumenes = [
    {
      numero: 1,
      titulo: "El comienzo de la aventura",
      descripcion: `El inicio de la historia de ${nombreNovela}.`
    },
    {
      numero: 2,
      titulo: "Un nuevo desafío",
      descripcion: "Los protagonistas descubren un secreto inesperado."
    },
    {
      numero: 3,
      titulo: "El destino del reino",
      descripcion: "Una nueva etapa cambia el rumbo de la aventura."
    }
  ];

  lista.replaceChildren();

  for (const volumen of volumenes) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "volumen";

    const numero = document.createElement("span");
    numero.className = "volumen-numero";
    numero.textContent = volumen.numero;

    const titulo = document.createElement("h3");
    titulo.textContent = `Volumen ${volumen.numero}: ${volumen.titulo}`;

    const descripcion = document.createElement("p");
    descripcion.textContent = volumen.descripcion;

    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta-ficticia";
    etiqueta.textContent = "Ejemplo ficticio";

    tarjeta.append(numero, titulo, descripcion, etiqueta);
    lista.appendChild(tarjeta);
  }

  document.querySelector("#contador-volumenes").textContent =
    `${volumenes.length} volúmenes de ejemplo`;
}
