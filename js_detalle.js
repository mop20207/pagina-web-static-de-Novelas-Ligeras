
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
