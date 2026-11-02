const URL_VOLUMENES="https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";
const CARPETAS_NOVELAS={"re-zero":"RE-Zero"};
document.addEventListener("DOMContentLoaded",cargarIndice);
function carpetaNovela(id){return CARPETAS_NOVELAS[id]||id;}
async function cargarIndice(){
 const p=new URLSearchParams(location.search),id=p.get("novela"),numero=Number(p.get("vol"))||1;
 const lista=document.getElementById("lista-contenido"),estado=document.getElementById("estado");
 try{
  if(!id)throw Error("No se indicó la novela.");
  const r=await fetch(URL_VOLUMENES+encodeURIComponent(carpetaNovela(id))+"/vol-"+numero+".json");
  if(!r.ok)throw Error("No se encontró el volumen solicitado.");
  const json=await r.json(),v=json["volumen_"+numero]||Object.values(json).find(x=>x&&typeof x==="object"&&("capitulos"in x||"prologo"in x));
  if(!v)throw Error("El JSON no contiene la estructura esperada del volumen.");
  document.title=(v.titulo||"Volumen "+numero)+" | Índice";
  document.getElementById("titulo-volumen").textContent=v.titulo||"Volumen "+numero;
  document.getElementById("subtitulo-volumen").textContent="Volumen "+numero+" · Selecciona un apartado para leer.";
  document.getElementById("migas").textContent="Inicio / "+id+" / Volumen "+numero;
  document.getElementById("volver-novela").href="detalle.html?id="+encodeURIComponent(id);
  const portada=document.getElementById("portada-volumen");if(v.imagen){portada.src=v.imagen;portada.hidden=false;}
  const items=[];
  if(typeof v.prologo==="string"&&v.prologo.trim())items.push({tipo:"prologo",clave:"prologo",titulo:"Prólogo",sub:"Apartado inicial"});
  for(const [ck,c] of Object.entries(v.capitulos||{})){
   items.push({tipo:"separador",titulo:c.titulo||ck});
   for(const [pk,contenido] of Object.entries(c.partes||{}))if(typeof contenido==="string"&&contenido.trim())items.push({tipo:"parte",clave:ck,parte:pk,titulo:(c.titulo||ck)+" — "+pk.replace("_"," "),sub:"Parte del capítulo"});
  }
  [["intermedio","Intermedio"],["epilogo","Epílogo"],["palabras_finales","Palabras finales"]].forEach(([k,t])=>{if(typeof v[k]==="string"&&v[k].trim())items.push({tipo:k,clave:k,titulo:t,sub:"Apartado final"});});
  lista.replaceChildren();let count=0;
  items.forEach(item=>{
   if(item.tipo==="separador"){const d=document.createElement("div");d.className="separador-capitulo";d.textContent=item.titulo;lista.append(d);return;}
   count++;const a=document.createElement("a");a.className="elemento";const n=document.createElement("span");n.className="numero";n.textContent=String(count).padStart(2,"0");
   const wrap=document.createElement("span"),strong=document.createElement("strong"),small=document.createElement("small");strong.textContent=item.titulo;small.textContent=item.sub;wrap.append(strong,small);a.append(n,wrap);
   const q=new URLSearchParams({novela:id,vol:String(numero),tipo:item.tipo,clave:item.clave});if(item.parte)q.set("parte",item.parte);a.href="lectura.html?"+q.toString();lista.append(a);
  });
  document.getElementById("contador").textContent=count+" apartados";estado.textContent=count?"Elige un apartado para comenzar la lectura.":"Este volumen todavía no tiene apartados disponibles.";
 }catch(e){console.error(e);estado.textContent=e.message;}
}
