const URL_VOLUMENES = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";
const CARPETAS_NOVELAS = { "re-zero": "RE-Zero" };

document.addEventListener("DOMContentLoaded", () => { cargarIndice(); configurarZoom(); });
function carpetaNovela(id) { return CARPETAS_NOVELAS[id] || id; }
function normalizarUrlImagen(url, id) {
    if (typeof url !== "string" || !url.trim()) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const nombre = url.split("/").pop();
    return "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/" +
        encodeURIComponent(carpetaNovela(id)) + "/imagenes/" + encodeURIComponent(nombre);
}

function obtenerVolumen(json, numero) {
    if (!json || typeof json !== "object") return null;
    const candidato = json["volumen_" + numero];
    if (candidato && typeof candidato === "object") return candidato;
    if ("capitulos" in json || "titulo" in json || "prologo" in json) return json;
    return Object.values(json).find(x => x && typeof x === "object" &&
        ("capitulos" in x || "titulo" in x || "prologo" in x)) || null;
}
function textoValido(x) { return typeof x === "string" && x.trim().length > 0; }
function imagenesArray(x) { return Array.isArray(x) ? x : []; }
function tituloDesdeTexto(s, fallback) {
    if (!textoValido(s)) return fallback;
    const primera = s.trim().split(/\r?\n/).find(x => x.trim());
    return primera && /^historia\\s+paralela/i.test(primera.trim()) ? primera.trim() : (primera && primera.length <= 110 ? primera.trim() : fallback);
}
function agregarSeccion(items, item) {
    let contenido = item.contenido;
    if (contenido && typeof contenido === "object") {
        if (textoValido(contenido.titulo)) {
            const base = String(item.titulo || "").split(" — ")[0];
            item.titulo = base + " — " + contenido.titulo;
        }
        contenido = contenido.contenido;
    }
    if (!textoValido(contenido)) return;
    item.contenido = contenido;
    items.push(item);
}
function agregarBloque(items, tipo, clave, titulo, bloque, imagenes = []) {
    if (textoValido(bloque)) {
        agregarSeccion(items, {tipo, clave, titulo, parte:"", imagenes, contenido:bloque});
        return;
    }
    if (!bloque || typeof bloque !== "object") return;
    const imgs = [...imagenes, ...(Array.isArray(bloque.imagenes) ? bloque.imagenes : []),
        ...(bloque.imagen ? [bloque.imagen] : [])].filter((x,i,a)=>typeof x==="string" && x.trim() && a.indexOf(x)===i);
    if (textoValido(bloque.contenido)) {
        agregarSeccion(items,{tipo,clave,titulo:bloque.titulo || titulo,parte:"",imagenes:imgs,contenido:bloque.contenido});
        return;
    }
    if (bloque.partes && typeof bloque.partes === "object") {
        for (const [pk, body] of Object.entries(bloque.partes)) {
            agregarSeccion(items,{tipo:"parte",clave,titulo:(bloque.titulo || titulo) + " — " + pk.replaceAll("_"," "),parte:pk,imagenes:imgs,contenido:body});
        }
    }
}
function construirIndice(v, id) {
    const items=[];
    agregarBloque(items,"prologo","prologo","Prólogo",v.prologo,
        [...imagenesArray(v.prologo_imagenes),...imagenesArray(v.imagenes_prologo)].map(url => normalizarUrlImagen(url, id)));
    for (const [ck,c] of Object.entries(v.capitulos||{})) {
        if (!c || typeof c!=="object") continue;
        const imgs=[...(Array.isArray(c.imagenes)?c.imagenes:[]),...(c.imagen?[c.imagen]:[])].map(url => normalizarUrlImagen(url, id)).filter(Boolean);
        if (c.partes && typeof c.partes==="object") {
            for (const [pk,body] of Object.entries(c.partes)) {
                agregarSeccion(items,{tipo:"parte",clave:ck,titulo:(c.titulo||ck)+" — "+pk.replaceAll("_"," "),parte:pk,imagenes:imgs,contenido:body});
            }
        } else if (textoValido(c.contenido)) {
            agregarSeccion(items,{tipo:"parte",clave:ck,titulo:c.titulo||ck,parte:"",imagenes:imgs,contenido:c.contenido});
        }
    }
    const campos=[
        ["interludios","Interludio","interludio"],
        ["historias_paralelas","Historia paralela","historia_paralela"],
        ["historias_paralelas","Historia paralela","historia_paralela"],
        ["historias_extra","Historia adicional","historia_extra"],
        ["intermedios","Intermedio","intermedio"],
        ["intermedio","Intermedio","intermedio"],
        ["epilogo","Epílogo","epilogo"],
        ["palabras_finales","Palabras finales","palabras_finales"]
    ];
    const vistos=new Set();
    for(const [campo,etiqueta,tipo] of campos){
        if(vistos.has(campo)) continue; vistos.add(campo);
        const valor=v[campo]; if(valor==null) continue;
        if(Array.isArray(valor)){
            valor.forEach((b,i)=>agregarBloque(items,tipo,campo+"_"+i,(b&&b.titulo)||etiqueta+" "+(i+1),b));
        } else if(typeof valor==="object"){
            for(const [key,b] of Object.entries(valor)) agregarBloque(items,tipo,key,(b&&b.titulo)||etiqueta+" — "+key,b);
        } else if(textoValido(valor)){
            agregarBloque(items,tipo,campo,tituloDesdeTexto(valor,etiqueta),valor);
        }
    }
    return items;
}



function nombreImagen(url) {
    try { return decodeURIComponent(new URL(url, location.href).pathname.split("/").pop()).toLowerCase(); }
    catch { return String(url).split(/[?#]/)[0].split("/").pop().toLowerCase(); }
}
function urlImagenNormalizada(url) {
    const nombre = nombreImagen(url);
    return nombre;
}
function imagenesDeSecciones(v, items) {
    const usadas = new Set();
    if (typeof v.imagen === "string" && v.imagen.trim()) usadas.add(urlImagenNormalizada(v.imagen));
    for (const item of items) {
        for (const url of (item.imagenes || [])) {
            if (typeof url === "string" && url.trim()) usadas.add(urlImagenNormalizada(url));
        }
    }
    return usadas;
}
let arbolImagenesRepositorio = null;
async function obtenerArbolImagenesRepositorio() {
    if (!arbolImagenesRepositorio) {
        arbolImagenesRepositorio = fetch("https://api.github.com/repos/mop20207/Targeta-NL/git/trees/main?recursive=1")
            .then(r => { if (!r.ok) throw Error("No se pudo consultar el índice de imágenes."); return r.json(); })
            .then(data => (data.tree || []).filter(x => x.type === "blob" && /\.(?:jpe?g|png|webp|gif)$/i.test(x.path)).map(x => x.path))
            .catch(e => { arbolImagenesRepositorio = null; throw e; });
    }
    return arbolImagenesRepositorio;
}
function carpetaImagenesNovela(id) {
    return ({ "re-zero":"RE-Zero", "goblin-slayer":"goblin-slayer", "konosuba":"konosuba",
        "overlord":"overlord", "the-saga-of-tanya-the-evil":"the-saga-of-tanya-the-evil" })[id] || id;
}
function rutaPerteneceAlVolumen(path, numero) {
    const p = path.toLowerCase();
    const n = String(numero).padStart(2, "0");
    const patrones = [
        new RegExp("(?:^|[/_-])vol[-_ ]?0*" + numero + "(?:[/_.-]|$)", "i"),
        new RegExp("(?:^|[/_-])volumen[-_ ]?0*" + numero + "(?:[/_.-]|$)", "i")
    ];
    return patrones.some(rx => rx.test(p)) ||
        new RegExp("vol[-_ ]" + n + "[-_ ]pagina", "i").test(p);
}
function tituloIlustracion(url, numero, ruta = "") {
    const nombre = nombreImagen(url);
    const pagina = nombre.match(/pag(?:ina)?[-_ ]?0*(\d+)/i);
    const capitulo = nombre.match(/cap(?:itulo)?[-_ ]?0*(\d+)/i);
    const origen = capitulo ? " · Capítulo " + Number(capitulo[1]) : (pagina ? " · Página " + Number(pagina[1]) : "");
    return "Volumen " + numero + " · Ilustración extra" + origen + " · No aparece en el lector";
}
async function obtenerIlustracionesExtras(v, id, numero, items = []) {
    const usadas = imagenesDeSecciones(v, items);
    const candidatas = [];
    const agregar = x => {
        const url = typeof x === "string" ? x : (x && (x.url || x.imagen || x.src));
        if (typeof url === "string" && url.trim()) candidatas.push(url);
    };
    for (const campo of ["imagenes_extra", "ilustraciones", "ilustraciones_extra", "imagenes_no_asignadas"]) {
        const valor = v[campo];
        if (Array.isArray(valor)) valor.forEach(agregar);
        else if (valor && typeof valor === "object") Object.values(valor).forEach(agregar);
    }
    try {
        const carpeta = carpetaImagenesNovela(id);
        const rutas = await obtenerArbolImagenesRepositorio();
        const prefijo = "volumenes/" + carpeta.toLowerCase() + "/";
        rutas.filter(path => path.toLowerCase().startsWith(prefijo) && rutaPerteneceAlVolumen(path, numero))
            .forEach(path => candidatas.push("https://raw.githubusercontent.com/mop20207/Targeta-NL/main/" + path.split("/").map(encodeURIComponent).join("/")));
    } catch (e) {
        console.warn("No se pudieron revisar las carpetas de ilustraciones del volumen:", e);
    }
    const portada = v.imagen ? urlImagenNormalizada(v.imagen) : "";
    const resultado = new Map();
    for (const urlOriginal of candidatas) {
        const url = normalizarUrlImagen(urlOriginal, id);
        const nombre = urlImagenNormalizada(url);
        if (!nombre || nombre === portada || usadas.has(nombre)) continue;
        if (/^(?:portada|cover)(?:[-_.]|$)/i.test(nombre)) continue;
        if (!resultado.has(nombre)) resultado.set(nombre, url);
    }
    return [...resultado.values()];
}
function mostrarIlustracionesExtras(imagenes, numero) {
    const boton = document.getElementById("boton-ilustraciones-extras");
    const seccion = document.getElementById("seccion-ilustraciones-extras");
    const galeria = document.getElementById("galeria-ilustraciones-extras");
    const contador = document.getElementById("contador-ilustraciones-extras");
    if (!boton || !seccion || !galeria) return;
    galeria.replaceChildren();
    seccion.hidden = true;
    boton.hidden = imagenes.length === 0;
    contador.textContent = imagenes.length + (imagenes.length === 1 ? " imagen" : " imágenes");
    imagenes.forEach((url, i) => {
        const tarjeta = document.createElement("button");
        tarjeta.type = "button";
        tarjeta.className = "tarjeta-ilustracion-extra";
        tarjeta.addEventListener("click", () => abrirZoom(url, tituloIlustracion(url, numero)));
        const img = document.createElement("img");
        img.src = url; img.alt = tituloIlustracion(url, numero); img.loading = "lazy";
        img.onerror = () => tarjeta.remove();
        const titulo = document.createElement("span");
        titulo.textContent = tituloIlustracion(url, numero);
        tarjeta.append(img, titulo); galeria.append(tarjeta);
    });
    boton.onclick = () => {
        seccion.hidden = !seccion.hidden;
        boton.setAttribute("aria-expanded", String(!seccion.hidden));
        boton.textContent = seccion.hidden ? "Ver ilustraciones extras" : "Ocultar ilustraciones extras";
        if (!seccion.hidden) seccion.scrollIntoView({behavior:"smooth",block:"start"});
    };
}
function abrirZoom(url, titulo) {
    const visor = document.getElementById("visor-ilustracion");
    const imagen = document.getElementById("imagen-ampliada");
    const leyenda = document.getElementById("titulo-imagen-ampliada");
    if (!visor || !imagen) return;
    imagen.src = url; imagen.style.transform = "scale(1)";
    imagen.dataset.zoom = "1"; leyenda.textContent = titulo;
    visor.hidden = false; document.body.classList.add("visor-abierto");
}
function cerrarZoom() {
    const visor = document.getElementById("visor-ilustracion");
    if (visor) visor.hidden = true;
    document.body.classList.remove("visor-abierto");
}
function configurarZoom() {
    const visor = document.getElementById("visor-ilustracion");
    const imagen = document.getElementById("imagen-ampliada");
    document.getElementById("cerrar-visor").addEventListener("click", cerrarZoom);
    document.getElementById("alejar-imagen").addEventListener("click", () => cambiarZoom(0.8));
    document.getElementById("acercar-imagen").addEventListener("click", () => cambiarZoom(1.25));
    visor.addEventListener("click", e => { if (e.target === visor) cerrarZoom(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarZoom(); });
    imagen.addEventListener("click", () => cambiarZoom(imagen.dataset.zoom === "1" ? 1.5 : 1));
}
function cambiarZoom(factor) {
    const imagen = document.getElementById("imagen-ampliada");
    const actual = Number(imagen.dataset.zoom || 1);
    const nuevo = Math.max(0.5, Math.min(4, actual * factor));
    imagen.dataset.zoom = String(nuevo); imagen.style.transform = "scale(" + nuevo + ")";
}

async function cargarIndice() {
    const p=new URLSearchParams(location.search), id=p.get("novela"), numero=Number(p.get("vol"))||1;
    const lista=document.getElementById("lista-contenido"), estado=document.getElementById("estado");
    try {
        if(!id) throw Error("No se indicó la novela.");
        const r=await fetch(URL_VOLUMENES+encodeURIComponent(carpetaNovela(id))+"/vol-"+numero+".json");
        if(!r.ok) throw Error("No se encontró el volumen solicitado.");
        const v=obtenerVolumen(await r.json(),numero);
        if(!v) throw Error("El JSON no contiene una estructura de volumen reconocible.");
        document.title=(v.titulo||"Volumen "+numero)+" | Índice";
        document.getElementById("titulo-volumen").textContent=v.titulo||"Volumen "+numero;
        document.getElementById("subtitulo-volumen").textContent="Volumen "+numero+" · Selecciona un apartado para leer.";
        document.getElementById("migas").textContent="Inicio / "+id+" / Volumen "+numero;
        document.getElementById("volver-novela").href="detalle.html?id="+encodeURIComponent(id);
        const portada=document.getElementById("portada-volumen");
        if(v.imagen){portada.src=normalizarUrlImagen(v.imagen,id);portada.hidden=false;}
        const items=construirIndice(v,id); lista.replaceChildren();
        const extras = await obtenerIlustracionesExtras(v, id, numero, items);
        mostrarIlustracionesExtras(extras, numero);
        items.forEach((item,i)=>{
            const a=document.createElement("a"); a.className="elemento";
            const n=document.createElement("span"); n.className="numero"; n.textContent=String(i+1).padStart(2,"0");
            const wrap=document.createElement("span"), strong=document.createElement("strong"), small=document.createElement("small");
            strong.textContent=item.titulo; small.textContent=item.tipo==="parte"?"Capítulo / sección":item.tipo;
            wrap.append(strong,small); a.append(n,wrap);
            const q=new URLSearchParams({novela:id,vol:String(numero),tipo:item.tipo,clave:item.clave});
            if(item.parte) q.set("parte",item.parte);
            a.href="lectura.html?"+q.toString(); lista.append(a);
        });
        document.getElementById("contador").textContent=items.length+" apartados";
        estado.textContent=items.length?"Elige un apartado para comenzar la lectura.":"Este volumen todavía no tiene apartados disponibles.";
    } catch(e){console.error(e);estado.textContent=e.message;}
}
