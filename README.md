# 10B

Sitio estático de 10B (Cibercolegio UCN), construido con React, Vite, Tailwind CSS y React Router. No requiere backend ni base de datos.

## Uso local

```bash
npm install
npm run sounds
npm run dev
```

La compilación de producción se genera con:

```bash
npm run build
```

## Publicación en GitHub Pages

El proyecto usa rutas con hash y `base: './'`, por lo que puede publicarse dentro de cualquier nombre de repositorio sin cambiar rutas. El flujo `.github/workflows/deploy-pages.yml` audita, compila y publica automáticamente la carpeta `dist` al enviar cambios a `main`.

En GitHub, selecciona **Settings → Pages → GitHub Actions** como origen. La estructura del flujo sigue la [documentación oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Las notificaciones del navegador requieren HTTPS. GitHub Pages sirve el sitio con HTTPS y, por tanto, cumple este requisito.

## Fotografías

Consulta `public/assets/equipo/LEEME.txt`. Si no existen las tres fotos, el sitio muestra automáticamente una silueta neutra.

## Privacidad

- El sitio no intercepta ni almacena respuestas de formularios.
- ClickUp, Google Forms y Padlet reciben los datos directamente dentro de sus propios marcos.
- Las preferencias de sonido y anticipación se guardan exclusivamente en `localStorage`.
- No hay credenciales, tokens, API keys, analítica ni cookies propias.
- El programador de clases funciona mientras la pestaña está abierta. No se usa un servicio push ni un backend.

Consulta `SECURITY.md` para la política CSP, los límites de GitHub Pages y las cabeceras recomendadas.
