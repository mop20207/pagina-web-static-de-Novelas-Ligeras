
const URL_DB = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json";

document.addEventListener("DOMContentLoaded", () => {
    cargarDetalle();
});

async function cargarDetalle() {
    // Obtenemos los elementos del HTML
    const titulo = document.getElementById("titulo");
    const migaTitulo = document.getElementById("miga-titulo");
    const portada = document.getElementById("portada");
    const descripcion = document.getElementById("descripcion");
    const generos = document.getElementById("generos");
    const valoracion = document.getElementById("valoracion");
    const mensajeError = document.getElementById("mensaje-error");

    try {
        // Obtenemos el ID que viene en la dirección URL
        const parametros = new URLSearchParams(window.location.search);
        const id = parametros.get("id");

        // Comprobamos que exista un ID
        if (!id) {
            throw new Error("No se indicó qué novela se quiere mostrar.");
        }

        // Descargamos los datos del JSON
        const respuesta = await fetch(URL_DB);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los datos de las novelas.");
        }

        const datos = await respuesta.json();

        // Buscamos la novela comparando su ID real
        const novela = datos.novelas.find(
            n => String(n.id) === id
        );

        if (!novela) {
            throw new Error("No se encontró una novela con ese ID.");
        }

        // =====================================
        // INFORMACIÓN PRINCIPAL
        // =====================================

        titulo.textContent = novela.nombre || "Sin título";
        migaTitulo.textContent = novela.nombre || "Sin título";

        descripcion.textContent = novela.lore || "Sin descripción disponible.";

        generos.textContent = Array.isArray(novela.genero)
            ? novela.genero.join(", ")
            : "Sin géneros disponibles.";

        valoracion.textContent = novela.valoracion ?? "Sin valoración";

        // Portada de la novela
        if (novela.imagen) {
            portada.src = novela.imagen;
            portada.alt = "Portada de " + (novela.nombre || "la novela");
        } else {
            portada.removeAttribute("src");
            portada.alt = "Portada no disponible";
        }

        // =====================================
        // INFORMACIÓN ADICIONAL
        // =====================================

        mostrarDato("autor", novela.autor);
        mostrarDato("ilustrador", novela.ilustrador);
        mostrarDato("titulo-original", novela.titulo_original);
        mostrarDato("fecha-lanzamiento", novela.fecha_lanzamiento);
        mostrarDato("editorial", novela.editorial_original);
        mostrarDato("tipo", novela.tipo);
        mostrarDato("idioma", novela.idioma_original);
        mostrarDato("pais", novela.pais_origen);
        mostrarDato("estado", novela.estado);

        // =====================================
        // VOLÚMENES FICTICIOS
        // =====================================

        crearVolumenes();

        // Cambiamos el título de la pestaña
        document.title = novela.nombre + " | Detalles";

    } catch (error) {
        console.error("Error al cargar la novela:", error);

        // Ocultamos las secciones si ocurrió un error
        document.querySelector(".ficha-novela").hidden = true;
        document.querySelector(".seccion-informacion").hidden = true;
        document.querySelector(".seccion-volumenes").hidden = true;

        // Mostramos el mensaje de error
        mensajeError.textContent = error.message;
        mensajeError.hidden = false;
    }
}

// =====================================
// MOSTRAR INFORMACIÓN ADICIONAL
// =====================================

function mostrarDato(id, valor) {
    const elemento = document.getElementById(id);

    if (!elemento) return;

    if (valor !== undefined && valor !== null && valor !== "") {
        elemento.textContent = valor;
    } else {
        elemento.textContent = "No disponible";
    }
}

// =====================================
// CREAR LOS VOLÚMENES FICTICIOS
// =====================================

function crearVolumenes() {
    const listaVolumenes = document.getElementById("lista-volumenes");
    const contadorVolumenes = document.getElementById("contador-volumenes");

    const volumenes = [
        {
            numero: 1,
            titulo: "El comienzo de la aventura",
            descripcion: "El inicio de esta gran historia."
        },
        {
            numero: 2,
            titulo: "Un nuevo desafío",
            descripcion: "Una nueva etapa llena de desafíos."
        },
        {
            numero: 3,
            titulo: "El destino del reino",
            descripcion: "Los acontecimientos comienzan a cambiar."
        }
    ];

    listaVolumenes.innerHTML = "";

    contadorVolumenes.textContent = volumenes.length + " volúmenes";

    volumenes.forEach(volumen => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta-volumen");

        tarjeta.innerHTML = `
            <div class="numero-volumen">
                Volumen ${volumen.numero}
            </div>

            <h3>${volumen.titulo}</h3>

            <p>${volumen.descripcion}</p>
        `;

        listaVolumenes.appendChild(tarjeta);
    });
}
