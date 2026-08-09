# Seguridad y privacidad

## Controles aplicados

- CSP estricta declarada en `index.html`: scripts, estilos, audio e imágenes solo desde el mismo origen; marcos permitidos únicamente desde `forms.clickup.com`, `docs.google.com` y `padlet.com`.
- `script-src 'self'` sin `unsafe-inline` ni `unsafe-eval`.
- Los marcos usan `sandbox="allow-forms allow-scripts allow-same-origin allow-popups"`, `referrerpolicy="no-referrer"` y carga diferida.
- Todos los recursos y destinos externos usan HTTPS.
- Los enlaces externos abren con `noopener noreferrer`.
- La compilación no publica mapas de código fuente.
- No se usa `dangerouslySetInnerHTML` ni se procesan entradas del usuario.

La compilación final no requiere `unsafe-inline` ni para scripts ni para estilos. Durante el desarrollo, algunos mecanismos de recarga automática de Vite pueden quedar limitados por esta política; la prioridad es que la versión publicada mantenga la CSP estricta.

## Cabeceras HTTP recomendadas

El servidor local de Vite y la vista previa envían:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

GitHub Pages no permite configurar cabeceras HTTP arbitrarias por repositorio. La CSP principal sigue activa mediante `<meta>`, pero `X-Frame-Options` y `X-Content-Type-Options` solo podrán aplicarse si el sitio se sirve más adelante desde una plataforma con control de cabeceras o detrás de un proxy/CDN configurado por el propietario.

## Dependencias

Antes de publicar:

```bash
npm audit --audit-level=high
npm run build
```

Mantén el archivo de bloqueo versionado y evita agregar SDK, analítica o formularios propios sin una revisión de privacidad.

## Cambios futuros

Si se incorpora texto o contenido generado por usuarios, trátalo siempre como no confiable: valida su estructura, escapa su salida y nunca lo inyectes mediante HTML sin sanitizar. No incluyas secretos en variables `VITE_*`, porque todo valor de Vite llega al navegador.
