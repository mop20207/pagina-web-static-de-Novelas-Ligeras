const URL_VOLUMENES="https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";
const CARPETAS_NOVELAS={"re-zero":"RE-Zero"};
let secuencia=[],posicion=0;
document.addEventListener("DOMContentLoaded",iniciarLector);
function carpetaNovela(id){return CARPETAS_NOVELAS[id]||id;}
async function iniciarLector(){
 const p=new URLSearchParams(location.search),id=p.get("novela"),numero=Number(p.get("vol"))||1,tipo=p.get("tipo"),clave=p.get("clave"),parte=p.get("parte")||"",error=document.getElementById("error");
 try{
  if(!id||!tipo||!clave)throw Error("Faltan datos para abrir este apartado.");
  const r=await fetch(URL_VOLUMENES+encodeURIComponent(carpetaNovela(id))+"/vol-"+numero+".json");if(!r.ok)throw Error("No se pudo cargar el JSON del volumen.");
  const json=await r.json(),v=json["volumen_"+numero]||Object.values(json).find(x=>x&&typeof x==="object"&&("capitulos"in x||"prologo"in x));if(!v)throw Error("No se encontró el contenido del volumen.");
  secuencia=crearSecuencia(v);posicion=secuencia.findIndex(x=>x.tipo===tipo&&x.clave===clave&&(x.parte||"")===parte);if(posicion<0)throw Error("No se encontró el apartado solicitado.");
  const indice="muestra-contenido.html?novela="+encodeURIComponent(id)+"&vol="+numero;document.getElementById("volver-indice").href=indice;document.getElementById("ir-indice").href=indice;
  mostrarActual();document.title=secuencia[posicion].titulo+" | "+(v.titulo||"Lectura");
 }catch(e){console.error(e);error.textContent=e.message;error.hidden=false;document.getElementById("titulo-apartado").textContent="No se pudo abrir la lectura";document.getElementById("progreso").textContent="";}
}
function crearSecuencia(v){
 const items=[],add=(tipo,titulo,clave,contenido,parte="")=>{if(typeof contenido==="string"&&contenido.trim())items.push({tipo,titulo,clave,contenido,parte});};
 add("prologo","Prólogo","prologo",v.prologo);
 for(const [ck,c] of Object.entries(v.capitulos||{}))for(const [pk,contenido] of Object.entries(c.partes||{}))add("parte",(c.titulo||ck)+" — "+pk.replace("_"," "),ck,contenido,pk);
 [["intermedio","Intermedio"],["epilogo","Epílogo"],["palabras_finales","Palabras finales"]].forEach(([k,t])=>add(k,t,k,v[k]));
 return items;
}
function mostrarActual(){
 const x=secuencia[posicion];document.getElementById("tipo-apartado").textContent=x.tipo==="parte"?"Capítulo · "+x.clave.replace("_"," "):x.titulo;
 document.getElementById("titulo-apartado").textContent=x.titulo;document.getElementById("texto-lectura").textContent=x.contenido;
 document.getElementById("progreso").textContent="Apartado "+(posicion+1)+" de "+secuencia.length;
 document.getElementById("anterior").disabled=posicion===0;document.getElementById("siguiente").disabled=posicion===secuencia.length-1;
}
document.getElementById("anterior").addEventListener("click",()=>{if(posicion>0){posicion--;mostrarActual();window.scrollTo(0,0);}});
document.getElementById("siguiente").addEventListener("click",()=>{if(posicion<secuencia.length-1){posicion++;mostrarActual();window.scrollTo(0,0);}});
