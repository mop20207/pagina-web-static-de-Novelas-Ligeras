const URL_DB = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json";

const URL_API_VOLUMENES =
    "https://api.github.com/repos/mop20207/Targeta-NL/contents/volumenes/";

const URL_RAW_VOLUMENES =
    "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";

const CARPETAS_NOVELAS = {
    "re-zero": "RE-Zero"
};

document.addEventListener("DOMContentLoaded", cargarDetalle);


// =====================================
// CARGAR INFORMACIÓN DE LA NOVELA
// =====================================

async function cargarDetalle() {

    const error = document.getElementById("mensaje-error");

    try {

        const id = new URLSearchParams(location.search).get("id");

        if (!id) {
            throw new Error("No se indicó qué novela se quiere mostrar.");
        }

        const respuesta = await fetch(URL_DB);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los datos de las novelas.");
        }

        const db = await respuesta.json();

        const novela = (db.novelas || []).find(
            n => String(n.id) === id
        );

        if (!novela) {
            throw new Error("No se encontró una novela con ese ID.");
        }


        // INFORMACIÓN PRINCIPAL

        document.getElementById("titulo").textContent =
            novela.nombre || "Sin título";

        document.getElementById("miga-titulo").textContent =
            novela.nombre || "Sin título";

        document.getElementById("descripcion").textContent =
            novela.lore || "Sin descripción disponible.";

        document.getElementById("generos").textContent =
            Array.isArray(novela.genero)
                ? novela.genero.join(", ")
                : (novela.genero || "Sin géneros disponibles");

        document.getElementById("valoracion").textContent =
            novela.valoracion != null
                ? "★ " + novela.valoracion
                : "★ Sin valoración";


        // PORTADA

        const portada = document.getElementById("portada");

        if (novela.imagen) {

            portada.src = novela.imagen;
            portada.alt = "Portada de " + (novela.nombre || "la novela");

        } else {

            portada.removeAttribute("src");
            portada.alt = "Portada no disponible";

        }


        // INFORMACIÓN ADICIONAL

        const datos = [
            ["autor", novela.autor],
            ["ilustrador", novela.ilustrador],
            ["titulo-original", novela.titulo_original],
            ["fecha-lanzamiento", novela.fecha_lanzamiento],
            ["editorial", novela.editorial_original],
            ["tipo", novela.tipo],
            ["idioma", novela.idioma_original],
            ["pais", novela.pais_origen],
            ["estado", novela.estado]
        ];

        datos.forEach(([idCampo, valor]) => {

            const elemento = document.getElementById(idCampo);

            if (elemento) {

                elemento.textContent =
                    valor == null || valor === ""
                        ? "No disponible"
                        : Array.isArray(valor)
                            ? valor.join(", ")
                            : String(valor);

            }

        });


        // CARGAR VOLÚMENES REALES

        await cargarVolumenes(id);

        document.title = (novela.nombre || "Novela") + " | Detalles";

    } catch (e) {

        console.error("Error al cargar el detalle:", e);

        document.querySelector(".ficha-novela").hidden = true;
        document.querySelector(".seccion-informacion").hidden = true;
        document.querySelector(".seccion-volumenes").hidden = true;

        error.textContent = e.message + " ";

        const enlace = document.createElement("a");

        enlace.href = "index.html";
        enlace.textContent = "Volver al catálogo";

        error.append(enlace);
        error.hidden = false;

    }

}


// =====================================
// CARGAR VOLÚMENES DESDE GITHUB
// =====================================

async function cargarVolumenes(id) {

    const lista = document.getElementById("lista-volumenes");

    const contador = document.getElementById("contador-volumenes");

    const aviso = document.getElementById("aviso-volumenes");

    lista.replaceChildren();

    // Re:Zero tiene una carpeta con mayúsculas.
    // Las demás novelas usan su ID como nombre de carpeta.

    const carpeta = CARPETAS_NOVELAS[id] || id;

    try {

        // CONSULTAR ARCHIVOS DE LA CARPETA

        const respuesta = await fetch(
            URL_API_VOLUMENES + encodeURIComponent(carpeta)
        );

        if (!respuesta.ok) {

            throw new Error(
                "No se pudo consultar la carpeta de volúmenes (" +
                respuesta.status +
                ")."
            );

        }

        const archivos = await respuesta.json();


        // DETECTAR TODOS LOS vol-N.json

        const numeros = archivos

            .filter(archivo =>
                archivo.type === "file" &&
                /^vol-\d+\.json$/i.test(archivo.name)
            )

            .map(archivo =>
                Number(
                    archivo.name.match(/^vol-(\d+)\.json$/i)[1]
                )
            )

            .sort((a, b) => a - b);


        if (numeros.length === 0) {

            contador.textContent = "0 volúmenes";

            aviso.textContent =
                "Esta novela todavía no tiene archivos de volúmenes cargados.";

            return;

        }


        // LEER LOS JSON DE CADA VOLUMEN

        const resultados = await Promise.all(

            numeros.map(async numero => {

                try {

                    const r = await fetch(
                        URL_RAW_VOLUMENES +
                        encodeURIComponent(carpeta) +
                        "/vol-" +
                        numero +
                        ".json"
                    );

                    if (!r.ok) return null;

                    const json = await r.json();

                    const volumen =
                        json["volumen_" + numero] ||
                        Object.values(json).find(x =>
                            x &&
                            typeof x === "object" &&
                            (
                                "titulo" in x ||
                                "capitulos" in x ||
                                "prologo" in x
                            )
                        );

                    if (!volumen) return null;

                    return {

                        numero: numero,

                        titulo:
                            volumen.titulo ||
                            "Volumen " + numero,

                        imagen:
                            volumen.imagen || ""

                    };

                } catch (e) {

                    console.warn(
                        "No se pudo leer el volumen " + numero,
                        e
                    );

                    return null;

                }

            })

        );


        const volumenes = resultados.filter(Boolean);


        if (volumenes.length === 0) {

            contador.textContent = "0 volúmenes";

            aviso.textContent =
                "Se encontraron archivos, pero ninguno contiene datos de volumen válidos.";

            return;

        }


        // MOSTRAR CONTADOR

        contador.textContent =
            volumenes.length +
            (volumenes.length === 1
                ? " volumen"
                : " volúmenes");

        aviso.textContent = "Volúmenes disponibles para leer.";


        // CREAR TARJETAS

        volumenes.forEach(volumen => {

            const tarjeta = document.createElement("a");

            tarjeta.className = "volumen volumen-real";

            tarjeta.href =
                "muestra-contenido.html?novela=" +
                encodeURIComponent(id) +
                "&vol=" +
                volumen.numero;


            // IMAGEN DEL VOLUMEN

            if (volumen.imagen) {

                const imagen = document.createElement("img");

                imagen.className = "imagen-volumen";

                imagen.src = volumen.imagen;

                imagen.alt =
                    "Portada del volumen " + volumen.numero;

                imagen.loading = "lazy";

                tarjeta.append(imagen);

            }


            // NÚMERO

            const numero = document.createElement("span");

            numero.className = "volumen-numero";

            numero.textContent = "Vol. " + volumen.numero;


            // TÍTULO

            const titulo = document.createElement("h3");

            titulo.textContent = volumen.titulo;


            // ENLACE

            const enlace = document.createElement("span");

            enlace.className = "enlace-volumen";

            enlace.textContent = "Ver contenido →";


            tarjeta.append(numero, titulo, enlace);

            lista.append(tarjeta);

        });

    } catch (e) {

        console.error("Error al cargar los volúmenes:", e);

        contador.textContent = "";

        aviso.textContent =
            "No se pudieron cargar los volúmenes. " + e.message;

    }

}
