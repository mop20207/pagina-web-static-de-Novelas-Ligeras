const URL_VOLUMENES =
    "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";

const CARPETAS_NOVELAS = {
    "re-zero": "RE-Zero"
};

let secuencia = [];
let posicion = 0;

document.addEventListener("DOMContentLoaded", iniciarLector);

function carpetaNovela(id) {
    return CARPETAS_NOVELAS[id] || id;
}


// =====================================
// INICIAR LECTOR
// =====================================

async function iniciarLector() {

    const p = new URLSearchParams(location.search);

    const id = p.get("novela");
    const numero = Number(p.get("vol")) || 1;

    const tipo = p.get("tipo");
    const clave = p.get("clave");
    const parte = p.get("parte") || "";

    const error = document.getElementById("error");

    try {

        if (!id || !tipo || !clave) {
            throw Error("Faltan datos para abrir este apartado.");
        }

        const r = await fetch(
            URL_VOLUMENES +
            encodeURIComponent(carpetaNovela(id)) +
            "/vol-" + numero + ".json"
        );

        if (!r.ok) {
            throw Error("No se pudo cargar el JSON del volumen.");
        }

        const json = await r.json();

        const v = json["volumen_" + numero] ||
            Object.values(json).find(x =>
                x &&
                typeof x === "object" &&
                ("capitulos" in x || "prologo" in x)
            );

        if (!v) {
            throw Error("No se encontró el contenido del volumen.");
        }

        secuencia = crearSecuencia(v);

        posicion = secuencia.findIndex(x =>
            x.tipo === tipo &&
            x.clave === clave &&
            (x.parte || "") === parte
        );

        if (posicion < 0) {
            throw Error("No se encontró el apartado solicitado.");
        }

        const indice =
            "muestra-contenido.html?novela=" +
            encodeURIComponent(id) +
            "&vol=" + numero;

        document.getElementById("volver-indice").href = indice;
        document.getElementById("ir-indice").href = indice;

        mostrarActual();

        document.title =
            secuencia[posicion].titulo +
            " | " +
            (v.titulo || "Lectura");

    } catch (e) {

        console.error(e);

        error.textContent = e.message;
        error.hidden = false;

        document.getElementById("titulo-apartado").textContent =
            "No se pudo abrir la lectura";

        document.getElementById("progreso").textContent = "";

    }

}


// =====================================
// CREAR SECUENCIA DE LECTURA
// =====================================

function crearSecuencia(v) {

    const items = [];

    const add = (
        tipo,
        titulo,
        clave,
        contenido,
        parte = "",
        imagenes = []
    ) => {

        if (typeof contenido === "string" && contenido.trim()) {

            items.push({
                tipo,
                titulo,
                clave,
                contenido,
                parte,
                imagenes
            });

        }

    };


    // PRÓLOGO

    add(
        "prologo",
        "Prólogo",
        "prologo",
        v.prologo
    );


    // CAPÍTULOS

    for (const [ck, c] of Object.entries(v.capitulos || {})) {

        // IMÁGENES DEL CAPÍTULO

        const imagenes = [

            ...(Array.isArray(c.imagenes) ? c.imagenes : []),

            ...(c.imagen ? [c.imagen] : [])

        ].filter((url, i, arr) =>

            typeof url === "string" &&
            url.trim() &&
            arr.indexOf(url) === i

        );


        /*
            COMPATIBILIDAD:

            Formato Overlord:
            partes: {
                parte_1: "...",
                parte_2: "..."
            }

            Formato Goblin Slayer:
            contenido: "Texto completo..."
        */

        let partes = [];

        if (c.partes && typeof c.partes === "object") {

            partes = Object.entries(c.partes);

        } else if (typeof c.contenido === "string") {

            partes = [["parte_1", c.contenido]];

        }


        for (const [pk, contenido] of partes) {

            add(
                "parte",
                (c.titulo || ck) + " — " + pk.replace("_", " "),
                ck,
                contenido,
                pk,
                imagenes
            );

        }

    }


    // OTROS APARTADOS

    [
        ["intermedio", "Intermedio"],
        ["epilogo", "Epílogo"],
        ["palabras_finales", "Palabras finales"]
    ].forEach(([k, t]) => {

        add(k, t, k, v[k]);

    });


    // INTERLUDIOS

    const interludios = v.interludios;

    if (Array.isArray(interludios)) {

        interludios.forEach((contenido, i) => {

            add(
                "interludio",
                "Interludio " + (i + 1),
                "interludio_" + i,
                typeof contenido === "string"
                    ? contenido
                    : contenido?.contenido
            );

        });

    } else if (interludios && typeof interludios === "object") {

        Object.entries(interludios).forEach(([clave, contenido]) => {

            add(
                "interludio",
                contenido?.titulo || clave,
                clave,
                typeof contenido === "string"
                    ? contenido
                    : contenido?.contenido
            );

        });

    }

    return items;

}


// =====================================
// MOSTRAR APARTADO ACTUAL
// =====================================

function mostrarActual() {

    const x = secuencia[posicion];

    document.getElementById("tipo-apartado").textContent =

        x.tipo === "parte"
            ? "Capítulo · " + x.clave.replace("_", " ")
            : x.titulo;

    document.getElementById("titulo-apartado").textContent =
        x.titulo;


    // GALERÍA DE ILUSTRACIONES

    const texto = document.getElementById("texto-lectura");

    let galeria = document.getElementById("galeria-ilustraciones");

    if (!galeria) {

        galeria = document.createElement("div");

        galeria.id = "galeria-ilustraciones";
        galeria.className = "galeria-ilustraciones";

        texto.parentNode.insertBefore(galeria, texto);

    }

    galeria.replaceChildren();


    (x.imagenes || []).forEach(url => {

        const img = document.createElement("img");

        img.src = url;
        img.alt = "Ilustración de " + x.clave;
        img.loading = "lazy";

        img.onerror = () => img.remove();

        galeria.appendChild(img);

    });


    // TEXTO

    texto.textContent = x.contenido;


    // PROGRESO

    document.getElementById("progreso").textContent =
        "Apartado " +
        (posicion + 1) +
        " de " +
        secuencia.length;


    // BOTONES

    document.getElementById("anterior").disabled =
        posicion === 0;

    document.getElementById("siguiente").disabled =
        posicion === secuencia.length - 1;

}


// =====================================
// NAVEGACIÓN
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("anterior").addEventListener("click", () => {

        if (posicion > 0) {

            posicion--;

            mostrarActual();

            window.scrollTo(0, 0);

        }

    });


    document.getElementById("siguiente").addEventListener("click", () => {

        if (posicion < secuencia.length - 1) {

            posicion++;

            mostrarActual();

            window.scrollTo(0, 0);

        }

    });

});
