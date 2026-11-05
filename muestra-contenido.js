const URL_VOLUMENES = "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";
const CARPETAS_NOVELAS = { "re-zero": "RE-Zero" };

document.addEventListener("DOMContentLoaded", cargarIndice);
function carpetaNovela(id) { return CARPETAS_NOVELAS[id] || id; }

function obtenerVolumen(json, numero) {
    if (!json || typeof json !== "object") return null;
    const candidato = json["volumen_" + numero];
    if (candidato && typeof candidato === "object") return candidato;
    if ("capitulos" in json || "titulo" in json || "prologo" in json) return json;
    return Object.values(json).find(x => x && typeof x === "object" &&
        ("capitulos" in x || "titulo" in x || "prologo" in x)) || null;
}
function textoValido(x) { return typeof x === "string" && x.trim().length > 0; }
function tituloDesdeTexto(s, fallback) {
    if (!textoValido(s)) return fallback;
    const primera = s.trim().split(/\r?\n/).find(x => x.trim());
    return primera && primera.length <= 110 ? primera.trim() : fallback;
}
function agregarSeccion(items, item) {
    if (textoValido(item.contenido)) items.push(item);
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
function construirIndice(v) {
    const items=[];
    agregarBloque(items,"prologo","prologo","Prólogo",v.prologo,
        [...imagenesArray(v.prologo_imagenes),...imagenesArray(v.imagenes_prologo)]);
    for (const [ck,c] of Object.entries(v.capitulos||{})) {
        if (!c || typeof c!=="object") continue;
        const imgs=[...(Array.isArray(c.imagenes)?c.imagenes:[]),...(c.imagen?[c.imagen]:[])];
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
        if(v.imagen){portada.src=v.imagen;portada.hidden=false;}
        const items=construirIndice(v); lista.replaceChildren();
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
