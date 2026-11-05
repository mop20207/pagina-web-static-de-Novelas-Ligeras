const URL_VOLUMENES="https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/";
const CARPETAS_NOVELAS={"re-zero":"RE-Zero"};
let secuencia=[],posicion=0;
document.addEventListener("DOMContentLoaded",iniciarLector);
function carpetaNovela(id){return CARPETAS_NOVELAS[id]||id;}
function normalizarUrlImagen(url,id){
 if(typeof url!=="string"||!url.trim())return "";
 if(url.startsWith("http://")||url.startsWith("https://"))return url;
 const nombre=url.split("/").pop();
 return "https://raw.githubusercontent.com/mop20207/Targeta-NL/main/volumenes/"+encodeURIComponent(carpetaNovela(id))+"/imagenes/"+encodeURIComponent(nombre);
}
function obtenerVolumen(json,numero){
 if(!json||typeof json!=="object")return null;
 const candidato=json["volumen_"+numero];
 if(candidato&&typeof candidato==="object")return candidato;
 if("capitulos"in json||"titulo"in json||"prologo"in json)return json;
 return Object.values(json).find(x=>x&&typeof x==="object"&&("capitulos"in x||"titulo"in x||"prologo"in x))||null;
}
function textoValido(x){return typeof x==="string"&&x.trim().length>0;}
function imagenesArray(x){return Array.isArray(x)?x:[];}
function tituloSeccion(texto,fallback){if(textoValido(texto)){const linea=texto.trim().split(/\r?\n/).find(x=>x.trim());if(linea&&/^historia\s+paralela/i.test(linea.trim()))return linea.trim();}return fallback;}
function agregarSeccion(items,item){let contenido=item.contenido;if(contenido&&typeof contenido==="object"){if(textoValido(contenido.titulo)){const base=String(item.titulo||"").split(" — ")[0];item.titulo=base+" — "+contenido.titulo;}contenido=contenido.contenido;}if(!textoValido(contenido))return;item.contenido=contenido;items.push(item);}
function agregarBloque(items,tipo,clave,titulo,bloque,imagenes=[]){
 if(textoValido(bloque)){agregarSeccion(items,{tipo,clave,titulo,parte:"",imagenes,contenido:bloque});return;}
 if(!bloque||typeof bloque!=="object")return;
 const imgs=[...imagenes,...(Array.isArray(bloque.imagenes)?bloque.imagenes:[]),...(bloque.imagen?[bloque.imagen]:[])].filter((x,i,a)=>typeof x==="string"&&x.trim()&&a.indexOf(x)===i);
 if(textoValido(bloque.contenido)){agregarSeccion(items,{tipo,clave,titulo:bloque.titulo||titulo,parte:"",imagenes:imgs,contenido:bloque.contenido});return;}
 if(bloque.partes&&typeof bloque.partes==="object")for(const[pk,body]of Object.entries(bloque.partes))agregarSeccion(items,{tipo:"parte",clave,titulo:(bloque.titulo||titulo)+" — "+pk.replaceAll("_"," "),parte:pk,imagenes:imgs,contenido:body});
}
function construirSecuencia(v,id){
 const items=[];
 agregarBloque(items,"prologo","prologo","Prólogo",v.prologo,[...imagenesArray(v.prologo_imagenes),...imagenesArray(v.imagenes_prologo)].map(url=>normalizarUrlImagen(url,id)));
 for(const[ck,c]of Object.entries(v.capitulos||{})){
  if(!c||typeof c!=="object")continue;
  const imgs=[...(Array.isArray(c.imagenes)?c.imagenes:[]),...(c.imagen?[c.imagen]:[])].map(url=>normalizarUrlImagen(url,id)).filter(Boolean);
  if(c.partes&&typeof c.partes==="object"){
   for(const[pk,body]of Object.entries(c.partes))agregarSeccion(items,{tipo:"parte",clave:ck,titulo:(c.titulo||ck)+" — "+pk.replaceAll("_"," "),parte:pk,imagenes:imgs,contenido:body});
  }else if(textoValido(c.contenido))agregarSeccion(items,{tipo:"parte",clave:ck,titulo:c.titulo||ck,parte:"",imagenes:imgs,contenido:c.contenido});
 }
 const campos=[["interludios","Interludio","interludio"],["historias_paralelas","Historia paralela","historia_paralela"],["historias_extra","Historia adicional","historia_extra"],["intermedios","Intermedio","intermedio"],["intermedio","Intermedio","intermedio"],["epilogo","Epílogo","epilogo"],["palabras_finales","Palabras finales","palabras_finales"]];
 const vistos=new Set();
 for(const[campo,etiqueta,tipo]of campos){
  if(vistos.has(campo))continue;vistos.add(campo);const valor=v[campo];if(valor==null)continue;
  if(Array.isArray(valor))valor.forEach((b,i)=>agregarBloque(items,tipo,campo+"_"+i,(b&&b.titulo)||etiqueta+" "+(i+1),b));
  else if(typeof valor==="object")for(const[key,b]of Object.entries(valor))agregarBloque(items,tipo,key,(b&&b.titulo)||etiqueta+" — "+key,b);
  else if(textoValido(valor))agregarBloque(items,tipo,campo,tituloSeccion(valor,etiqueta),valor);
 }
 return items;
}
async function iniciarLector(){
 const p=new URLSearchParams(location.search),id=p.get("novela"),numero=Number(p.get("vol"))||1,tipo=p.get("tipo"),clave=p.get("clave"),parte=p.get("parte")||"";
 const error=document.getElementById("error");
 try{
  if(!id||!tipo||!clave)throw Error("Faltan datos para abrir este apartado.");
  const r=await fetch(URL_VOLUMENES+encodeURIComponent(carpetaNovela(id))+"/vol-"+numero+".json");
  if(!r.ok)throw Error("No se pudo cargar el JSON del volumen.");
  const v=obtenerVolumen(await r.json(),numero);if(!v)throw Error("No se encontró el contenido del volumen.");
  secuencia=construirSecuencia(v,id);
  posicion=secuencia.findIndex(x=>x.tipo===tipo&&x.clave===clave&&(x.parte||"")===parte);
  if(posicion<0)throw Error("No se encontró el apartado solicitado.");
  const indice="muestra-contenido.html?novela="+encodeURIComponent(id)+"&vol="+numero;
  document.getElementById("volver-indice").href=indice;document.getElementById("ir-indice").href=indice;
  mostrarActual();document.title=secuencia[posicion].titulo+" | "+(v.titulo||"Lectura");
 }catch(e){console.error(e);error.textContent=e.message;error.hidden=false;document.getElementById("titulo-apartado").textContent="No se pudo abrir la lectura";document.getElementById("progreso").textContent="";}
}
function mostrarActual(){
 const x=secuencia[posicion];if(!x)return;
 document.getElementById("tipo-apartado").textContent=x.tipo==="parte"?"Capítulo / sección":x.tipo.replaceAll("_"," ");
 document.getElementById("titulo-apartado").textContent=x.titulo;
 const texto=document.getElementById("texto-lectura");let galeria=document.getElementById("galeria-ilustraciones");
 if(!galeria){galeria=document.createElement("div");galeria.id="galeria-ilustraciones";galeria.className="galeria-ilustraciones";texto.parentNode.insertBefore(galeria,texto);}
 galeria.replaceChildren();
 (x.imagenes||[]).forEach(url=>{const img=document.createElement("img");img.src=url;img.alt="Ilustración de "+x.titulo;img.loading="lazy";img.onerror=()=>img.remove();galeria.appendChild(img);});
 texto.textContent=x.contenido;
 document.getElementById("progreso").textContent="Apartado "+(posicion+1)+" de "+secuencia.length;
 document.getElementById("anterior").disabled=posicion===0;document.getElementById("siguiente").disabled=posicion===secuencia.length-1;
}
document.addEventListener("DOMContentLoaded",()=>{
 document.getElementById("anterior").addEventListener("click",()=>{if(posicion>0){posicion--;mostrarActual();window.scrollTo(0,0);}});
 document.getElementById("siguiente").addEventListener("click",()=>{if(posicion<secuencia.length-1){posicion++;mostrarActual();window.scrollTo(0,0);}});
});
