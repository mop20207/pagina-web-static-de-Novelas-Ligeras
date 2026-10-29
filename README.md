# Novelas Ligeras — versión corregida

Sitio estático HTML, CSS y JavaScript preparado para publicarse en Render como **Static Site**.

## Archivos
- `index.html`: catálogo principal.
- `detalle.html`: ficha de cada novela.
- `estilos_pestaña_principal.css`: estilos del catálogo.
- `estilos_detalle.css`: estilos de las fichas.
- `js_pestaña_principal.js`: carga el catálogo y crea tarjetas enlazadas a cada ficha.
- `js_detalle.js`: carga los datos de la ficha según el parámetro `?id=`.

## Datos
El catálogo se obtiene desde este archivo JSON remoto:
`https://raw.githubusercontent.com/mop20207/Targeta-NL/main/db.json`

Si cambias la ubicación de `db.json`, actualiza `URL_DB` en ambos archivos JavaScript.

## Publicar en Render
1. Sube estos archivos a la raíz de un repositorio de GitHub (no dentro de una subcarpeta adicional).
2. En Render, crea un servicio **Static Site** y conecta ese repositorio.
3. Deja **Build Command** vacío.
4. Usa `.` como **Publish Directory**.
5. Publica el sitio.

Las tarjetas llevan a `detalle.html?id=0`, `detalle.html?id=1`, etc. El parámetro es el índice de la novela dentro del array `novelas` del JSON.

**Nota:** los volúmenes de la ficha siguen siendo ejemplos ficticios de diseño; no se descargan del JSON.
