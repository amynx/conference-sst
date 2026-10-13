# I Congreso Nacional e Internacional en Seguridad y Salud en el Trabajo

Sitio web del Congreso organizado por **UNIPAZ** y **GREIP**: 29 y 30 de octubre de 2026, modalidad virtual, inscripción gratuita.

Es un sitio estático (HTML, CSS y JavaScript sin dependencias ni proceso de compilación), listo para publicarse en Vercel.

## Estructura

```
index.html            Inicio: presentación, modalidades, líneas, conferencistas, instituciones, contacto
agenda.html           Agenda de las dos jornadas (pestañas Día 1 / Día 2)
404.html              Página de error
assets/css/styles.css Estilos base, estados de foco y adaptación a móvil
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
| Conferencistas | `index.html`, sección `#conferencistas`: cambia `[Nombre del conferencista]`, `[Profesión]`, `[Institución] · [País]` y reemplaza cada bloque «Fotografía pendiente» por `<img src="/assets/img/conferencistas/nombre.webp" alt="Nombre del conferencista" width="800" height="1000">`. Fotos en proporción 4:5, mínimo 800 × 1000 px. Publicar nombres y fotos solo con confirmación y autorización. |
| Texto de Instituciones | `index.html`, sección `#instituciones`: el texto menciona «Congreso … de Productividad, Desarrollo e Innovación»; verificar con la organización. |
| Agenda definitiva | `agenda.html`: cada franja aparece dos veces (vista de escritorio y vista móvil) dentro de `#dia-1` y `#dia-2`. Horarios en formato de 12 horas, hora de Colombia (UTC−5). |

## Accesibilidad

Barra de navegación fija al desplazarse. Navegación por teclado (incluida la ventana de inscripción: `Esc` cierra, el foco queda dentro), enlace «Saltar al contenido», textos alternativos en logos, etiquetas de texto en la agenda (no solo color) y respeto por `prefers-reduced-motion`.
