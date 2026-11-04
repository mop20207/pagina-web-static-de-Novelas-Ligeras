const URL_VOLUMENES = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";

const CARPETAS_NOVELAS = {
    "re-zero": "RE-Zero"
};

document.addEventListener("DOMContentLoaded", cargarIndice);

function carpetaNovela(id) {
    return CARPETAS_NOVELAS[id] || id;
}

async function cargarIndice() {
    const p = new URLSearchParams(location.search);
    const id = p.get("novela");
    const numero = Number(p.get("vol")) || 1;

    const lista = document.getElementById("lista-contenido");
    const estado = document.getElementById("estado");

    try {
        if (!id) {
            throw Error("No se indicó la novela.");
        }

        const r = await fetch(
            URL_VOLUMENES +
            encodeURIComponent(carpetaNovela(id)) +
            "/vol-" + numero + ".json"
        );

        if (!r.ok) {
            throw Error("No se encontró el volumen solicitado.");
        }

        const json = await r.json();

        const v = json["volumen_" + numero] ||
            Object.values(json).find(x =>
                x &&
                typeof x === "object" &&
                ("capitulos" in x || "prologo" in x)
            );

        if (!v) {
            throw Error("El JSON no contiene la estructura esperada del volumen.");
        }

        document.title = (v.titulo || "Volumen " + numero) + " | Índice";

        document.getElementById("titulo-volumen").textContent =
            v.titulo || "Volumen " + numero;

        document.getElementById("subtitulo-volumen").textContent =
            "Volumen " + numero + " · Selecciona un apartado para leer.";

        document.getElementById("migas").textContent =
            "Inicio / " + id + " / Volumen " + numero;

        document.getElementById("volver-novela").href =
            "detalle.html?id=" + encodeURIComponent(id);

        const portada = document.getElementById("portada-volumen");

        if (v.imagen) {
            portada.src = v.imagen;
            portada.hidden = false;
        }

        const items = [];

        // PRÓLOGO
        if (typeof v.prologo === "string" && v.prologo.trim()) {
            items.push({
                tipo: "prologo",
                clave: "prologo",
                titulo: "Prólogo",
                sub: "Apartado inicial"
            });
        }

        // CAPÍTULOS
        for (const [ck, c] of Object.entries(v.capitulos || {})) {

            items.push({
                tipo: "separador",
                titulo: c.titulo || ck
            });

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

                if (typeof contenido === "string" && contenido.trim()) {

                    items.push({
                        tipo: "parte",
                        clave: ck,
                        parte: pk,
                        titulo:
                            (c.titulo || ck) +
                            " — " +
                            pk.replace("_", " "),
                        sub: "Parte del capítulo"
                    });

                }

            }
        }

        // OTROS APARTADOS
        [
            ["intermedio", "Intermedio"],
            ["interludios", "Interludios"],
            ["epilogo", "Epílogo"],
            ["palabras_finales", "Palabras finales"]
        ].forEach(([k, t]) => {

            const valor = v[k];

            if (typeof valor === "string" && valor.trim()) {

                items.push({
                    tipo: k,
                    clave: k,
                    titulo: t,
                    sub: "Apartado final"
                });

            } else if (Array.isArray(valor)) {

                valor.forEach((contenido, i) => {

                    if (typeof contenido === "string" && contenido.trim()) {

                        items.push({
                            tipo: k,
                            clave: k + "_" + i,
                            titulo: t + " " + (i + 1),
                            sub: "Apartado adicional"
                        });

                    }

                });

            } else if (valor && typeof valor === "object") {

                Object.entries(valor).forEach(([clave, contenido]) => {

                    if (typeof contenido === "string" && contenido.trim()) {

                        items.push({
                            tipo: k,
                            clave: clave,
                            titulo: t + " — " + clave,
                            sub: "Apartado adicional"
                        });

                    }

                });

            }

        });

        // MOSTRAR ÍNDICE
        lista.replaceChildren();

        let count = 0;

        items.forEach(item => {

            if (item.tipo === "separador") {

                const d = document.createElement("div");

                d.className = "separador-capitulo";
                d.textContent = item.titulo;

                lista.append(d);

                return;
            }

            count++;

            const a = document.createElement("a");

            a.className = "elemento";

            const n = document.createElement("span");

            n.className = "numero";
            n.textContent = String(count).padStart(2, "0");

            const wrap = document.createElement("span");

            const strong = document.createElement("strong");
            const small = document.createElement("small");

            strong.textContent = item.titulo;
            small.textContent = item.sub;

            wrap.append(strong, small);

            a.append(n, wrap);

            const q = new URLSearchParams({
                novela: id,
                vol: String(numero),
                tipo: item.tipo,
                clave: item.clave
            });

            if (item.parte) {
                q.set("parte", item.parte);
            }

            a.href = "lectura.html?" + q.toString();

            lista.append(a);

        });

        document.getElementById("contador").textContent =
            count + " apartados";

        estado.textContent = count
            ? "Elige un apartado para comenzar la lectura."
            : "Este volumen todavía no tiene apartados disponibles.";

    } catch (e) {

        console.error(e);

        estado.textContent = e.message;

    }
}
