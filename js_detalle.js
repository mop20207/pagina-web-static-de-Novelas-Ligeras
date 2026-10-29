const URL_DB = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json";
document.addEventListener("DOMContentLoaded", cargarDetalle);

async function cargarDetalle() {
  const mensajeError = document.querySelector("#mensaje-error");
  try {
    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");
    if (id === null || !/^\d+$/.test(id)) throw new Error("Identificador de novela inválido o ausente.");

    const respuesta = await fetch(URL_DB);
    if (!respuesta.ok) throw new Error(`No se pudo descargar el catálogo (HTTP ${respuesta.status}).`);
    const datos = await respuesta.json();
    if (!Array.isArray(datos.novelas)) throw new Error("El catálogo no contiene una lista válida de novelas.");
    const novela = datos.novelas[Number(id)];
    if (!novela) throw new Error("No se encontró esa novela en el catálogo.");

    document.querySelector("#titulo").textContent = novela.nombre || "Novela sin título";
    document.querySelector("#miga-titulo").textContent = novela.nombre || "Novela";
    document.querySelector("#descripcion").textContent = novela.lore || "Esta novela todavía no tiene una descripción.";
    document.querySelector("#generos").textContent = Array.isArray(novela.genero)
      ? novela.genero.join(", ") : novela.genero || "Sin género";
    document.querySelector("#valoracion").textContent = novela.valoracion != null
      ? `★ ${novela.valoracion}` : "★ Sin valoración";

    const portada = document.querySelector("#portada");
    portada.alt = `Portada de ${novela.nombre || "la novela"}`;
    if (novela.imagen) {
      portada.src = novela.imagen;
      portada.addEventListener("error", () => {
        portada.removeAttribute("src");
        portada.alt = "Portada no disponible";
        portada.style.minHeight = "250px";
      }, { once: true });
    } else {
      portada.alt = "Portada no disponible";
    }

    crearVolumenes(novela.nombre || "esta novela");
    document.title = `${novela.nombre || "Novela"} | Novelas Ligeras`;
  } catch (error) {
    console.error("Error al cargar la ficha de la novela:", error);
    if (mensajeError) mensajeError.hidden = false;
    const ficha = document.querySelector(".ficha-novela");
    const volumenes = document.querySelector(".seccion-volumenes");
    const migas = document.querySelector(".migas");
    if (ficha) ficha.hidden = true;
    if (volumenes) volumenes.hidden = true;
    if (migas) migas.hidden = true;
  }
}

function crearVolumenes(nombreNovela) {
  const lista = document.querySelector("#lista-volumenes");
  if (!lista) return;
  // Estas tarjetas son ejemplos de diseño, no datos reales de volúmenes.
  const volumenes = [
    { numero: 1, titulo: "El comienzo de la aventura", descripcion: `El inicio de la historia de ${nombreNovela}.` },
    { numero: 2, titulo: "Un nuevo desafío", descripcion: "Los protagonistas descubren un secreto inesperado." },
    { numero: 3, titulo: "El destino del reino", descripcion: "Una nueva etapa cambia el rumbo de la aventura." }
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
  const contador = document.querySelector("#contador-volumenes");
  if (contador) contador.textContent = `${volumenes.length} volúmenes de ejemplo`;
}
