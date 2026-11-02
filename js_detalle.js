const URL_DB="https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json";
const URL_VOLUMENES="https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";
const CARPETAS_NOVELAS={"re-zero":"RE-Zero"};
document.addEventListener("DOMContentLoaded",cargarDetalle);
async function cargarDetalle(){
 const error=document.getElementById("mensaje-error");
 try{
  const id=new URLSearchParams(location.search).get("id");if(!id)throw Error("No se indicó qué novela se quiere mostrar.");
  const r=await fetch(URL_DB);if(!r.ok)throw Error("No se pudieron cargar los datos de las novelas.");
  const db=await r.json();const n=(db.novelas||[]).find(x=>String(x.id)===id);if(!n)throw Error("No se encontró una novela con ese ID.");
  document.getElementById("titulo").textContent=n.nombre||"Sin título";document.getElementById("miga-titulo").textContent=n.nombre||"Sin título";
  document.getElementById("descripcion").textContent=n.lore||"Sin descripción disponible.";
  document.getElementById("generos").textContent=Array.isArray(n.genero)?n.genero.join(", "):(n.genero||"Sin géneros disponibles");
  document.getElementById("valoracion").textContent=n.valoracion!=null?"★ "+n.valoracion:"★ Sin valoración";
  const img=document.getElementById("portada");if(n.imagen){img.src=n.imagen;img.alt="Portada de "+(n.nombre||"la novela");}else{img.removeAttribute("src");img.alt="Portada no disponible";}
  [["autor",n.autor],["ilustrador",n.ilustrador],["titulo-original",n.titulo_original],["fecha-lanzamiento",n.fecha_lanzamiento],["editorial",n.editorial_original],["tipo",n.tipo],["idioma",n.idioma_original],["pais",n.pais_origen],["estado",n.estado]].forEach(([id,v])=>document.getElementById(id).textContent=v==null||v===""?"No disponible":Array.isArray(v)?v.join(", "):String(v));
  await cargarVolumenes(id);
  document.title=(n.nombre||"Novela")+" | Detalles";
 }catch(e){console.error(e);document.querySelector(".ficha-novela").hidden=true;document.querySelector(".seccion-informacion").hidden=true;document.querySelector(".seccion-volumenes").hidden=true;error.textContent=e.message+" ";const a=document.createElement("a");a.href="index.html";a.textContent="Volver al catálogo";error.append(a);error.hidden=false;}
}
async function cargarVolumenes(id){
 const lista=document.getElementById("lista-volumenes"),contador=document.getElementById("contador-volumenes"),aviso=document.getElementById("aviso-volumenes");lista.replaceChildren();
 const carpeta=CARPETAS_NOVELAS[id]||id,vols=[];let fallos=0;
 for(let num=1;num<=40;num++){
  try{
   const r=await fetch(URL_VOLUMENES+encodeURIComponent(carpeta)+"/vol-"+num+".json");
   if(!r.ok){fallos++;if(fallos>=(vols.length?2:3))break;continue;}
   const data=await r.json(),v=data["volumen_"+num]||Object.values(data).find(x=>x&&typeof x==="object"&&("titulo"in x||"capitulos"in x||"prologo"in x));
   if(v){vols.push({numero:num,titulo:v.titulo||"Volumen "+num,imagen:v.imagen||""});fallos=0;}else{fallos++;if(fallos>=2&&vols.length)break;}
  }catch(e){fallos++;if(fallos>=(vols.length?2:3))break;}
 }
 if(!vols.length){contador.textContent="Ejemplos";aviso.textContent="Esta novela todavía no tiene volúmenes cargados. Se muestran ejemplos ficticios de diseño.";crearFicticios(lista);return;}
 contador.textContent=vols.length+(vols.length===1?" volumen":" volúmenes");aviso.textContent="Volúmenes disponibles para leer.";
 vols.forEach(v=>{
  const a=document.createElement("a");a.className="volumen volumen-real";a.href="muestra-contenido.html?novela="+encodeURIComponent(id)+"&vol="+v.numero;
  if(v.imagen){const im=document.createElement("img");im.className="imagen-volumen";im.src=v.imagen;im.alt="Portada del volumen "+v.numero;im.loading="lazy";a.append(im);}
  const num=document.createElement("span");num.className="volumen-numero";num.textContent="Vol. "+v.numero;
  const h=document.createElement("h3");h.textContent=v.titulo;const link=document.createElement("span");link.className="enlace-volumen";link.textContent="Ver contenido →";a.append(num,h,link);lista.append(a);
 });
}
function crearFicticios(lista){
 const datos=[["El comienzo de la aventura","El inicio de esta gran historia."],["Un nuevo desafío","Una nueva etapa llena de desafíos."],["El destino del reino","Los acontecimientos comienzan a cambiar."]];
 datos.forEach((v,i)=>{const card=document.createElement("div");card.className="volumen";const n=document.createElement("span");n.className="volumen-numero";n.textContent="Volumen "+(i+1);const h=document.createElement("h3");h.textContent=v[0];const p=document.createElement("p");p.textContent=v[1];const tag=document.createElement("span");tag.className="etiqueta-ficticia";tag.textContent="Ejemplo ficticio";card.append(n,h,p,tag);lista.append(card);});
}
