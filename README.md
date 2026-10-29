# I Congreso Nacional e Internacional en Seguridad y Salud en el Trabajo

Sitio web del Congreso organizado por **UNIPAZ** y **GREIP**: 29 y 30 de octubre de 2026, modalidad virtual, inscripción gratuita.

Es un sitio estático (HTML, CSS y JavaScript sin dependencias ni proceso de compilación), listo para publicarse en Vercel.

## Estructura

```
index.html            Inicio: presentación, modalidades, líneas, conferencistas, instituciones, contacto
agenda.html           Agenda de las dos jornadas (pestañas Día 1 / Día 2)
organizadores.html    Comité Organizador y Comité Científico
404.html              Página de error
assets/css/styles.css Sistema visual (variables de color y tipografía), estados de foco y adaptación a móvil
assets/js/main.js     Menú móvil, ventana de inscripción y pestañas de la agenda
assets/img/           Logos (Congreso, UNIPAZ, GREIP), favicon e imagen para redes sociales
vercel.json           URLs limpias (/agenda) y cabeceras
```

## Despliegue en Vercel

1. En [vercel.com](https://vercel.com) → **Add New… → Project → Import** y elige este repositorio.
2. Framework Preset: **Other**. No hace falta comando de build ni directorio de salida.
3. Pulsa **Deploy**.
4. Dominio propio: **Settings → Domains** del proyecto en Vercel, con `cnisstunipaz.com` y `www.cnisstunipaz.com`; los registros DNS se crean en Hostinger.

Si cambia el dominio, actualiza `canonical`/`og:url` en `index.html` y `agenda.html`, `robots.txt` y `sitemap.xml`. Cada `git push` a la rama principal publica una nueva versión automáticamente.

Para probarlo en local: `npx serve .` (o cualquier servidor estático) y abre `http://localhost:3000`.

## Cómo actualizar el contenido pendiente

| Pendiente | Dónde se cambia |
|---|---|
| Enlace del formulario de inscripción | `assets/js/main.js` → variable `FORMULARIO` (hoy apunta a la aplicación de Google Apps Script de la organización). Se puede usar un enlace distinto por modalidad en `CONFIG.inscripcion`. |
| Conferencistas | `index.html`, sección `#conferencistas`: 14 conferencistas tomados del Excel de la organización (14/10/2026). Las fotos van en `assets/img/conferencistas/` (cuadradas, 400 × 400 px, `.webp`); quien no tiene foto muestra sus iniciales. Para agregar una foto, reemplaza el bloque `<div aria-hidden="true" class="ini">` de esa persona por `<img src="/assets/img/conferencistas/nombre.webp" alt="Fotografía de Nombre" width="400" height="400" loading="lazy" class="portrait">` (el retrato se recorta a 4:5). |
| Texto de Instituciones | `index.html`, sección `#instituciones`: el texto menciona «Congreso … de Productividad, Desarrollo e Innovación»; verificar con la organización. |
| Agenda definitiva | `agenda.html`: cada franja aparece dos veces (vista de escritorio y vista móvil) dentro de `#dia-1` y `#dia-2`. Horarios en formato de 12 horas, hora de Colombia (UTC−5). |

## Página Organizadores

`organizadores.html` (dirección `/organizadores`): Comité Organizador (descripción, funciones e integrantes) y Comité Científico (internacional y nacional). Quien aún no tiene foto muestra sus iniciales. Para poner una foto: guárdala cuadrada en `assets/img/organizadores/` (`.webp`, 400–600 px) y reemplaza el bloque de iniciales (`class="ini"`) de esa persona por un `<img … width="400" height="400" loading="lazy" class="portrait">`, como el de Reynaldo Concha o Carlos Nacache.

## Funciones del sitio

- **Mi agenda** (`assets/js/main.js`, bloque «v3»): cada actividad tiene «Agregar a mi agenda»; la selección se guarda solo en el navegador (sin registro), se exporta a Google Calendar o .ics y muestra el avance hacia el 25 % de ponencias del certificado.
- **Modo en vivo**: franja «En vivo ahora / A continuación» durante el 29 y 30 de octubre y cuenta regresiva en Inicio. Para probar otro momento: añadir `?ahora=2026-10-29T10:10` a la dirección.
- **Enlaces de las salas**: `assets/js/main.js` → variable `SALAS` (`'1'` y `'2'`). Vacíos, el sitio indica que se publicarán antes del inicio.
- **Líneas temáticas**: cada actividad lleva su línea (clasificación propuesta, por validar); la agenda se filtra con `/agenda?linea=6`.
- **Páginas de conferencista**: `/conferencistas/<nombre>`, con piezas para redes en `assets/img/compartir/` (`-post.jpg` 1080×1350 y `-og.jpg` 1200×630 para la vista previa del enlace).

## Analítica (Google Analytics 4)

El código está en `assets/js/main.js` (módulo final). Se activa al escribir el ID de medición en `var GA_ID = 'G-…'` y solo mide en cnisstunipaz.com (para pruebas en otro dominio, agrega `?ga=1`). Eventos propios:

| Evento | Cuándo | Parámetros |
|---|---|---|
| `ingreso_sesion` | Clic en «Ingresar a la sesión» (agenda, en vivo, Mi agenda, conferencista) | sesion_id, sesion_titulo, sesion_tipo, sala, dia, linea, origen |
| `inscripcion_abrir` / `inscripcion_modalidad` / `inscripcion_continuar` | Embudo de inscripción | origen, modalidad |
| `agenda_agregar` / `agenda_quitar` | Mi agenda | sesion_* |
| `calendario_exportar` | .ics o Google Calendar | formato, alcance |
| `share` | Compartir o descargar la pieza de un conferencista | method, item_id |
| `filtro_agenda` | Filtros de sala, Mi agenda o línea | filtro, linea |
| `red_social` | Enlaces a redes de UNIPAZ en el pie | red |

## Diseño

Lenguaje editorial: títulos en **Source Serif 4** y textos de interfaz en **Inter** (Google Fonts); azul marino `#102A43`, turquesa `#087E8B` y ámbar `#D99A27` como acento, definidos como variables al inicio de `assets/css/styles.css`. Filetes finos en lugar de tarjetas con sombra, radios pequeños (4–8 px) y secciones numeradas que alternan fondo blanco y gris azulado.

## Accesibilidad

Barra de navegación fija al desplazarse. Navegación por teclado (incluida la ventana de inscripción: `Esc` cierra, el foco queda dentro), enlace «Saltar al contenido», textos alternativos en logos, etiquetas de texto en la agenda (no solo color) y respeto por `prefers-reduced-motion`.

## Animaciones

Entrada escalonada de la portada, aparición suave de secciones y elementos al desplazarse, sombra en la barra fija, y transiciones en la ventana de inscripción, el menú móvil y las pestañas de la agenda. Están en `assets/css/styles.css` (bloque «Movimiento») y `assets/js/main.js`; se desactivan si el sistema pide reducir el movimiento, y si JavaScript no carga el contenido se muestra igual.
