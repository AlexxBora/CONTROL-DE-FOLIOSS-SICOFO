# SICOFO · Sistema de Control de Folios · SPyAP

Sistema de foliado y seguimiento de correspondencia (HTML + Bootstrap + JS). **Prototipo**: los datos viven en `localStorage`, es decir, por navegador. Para uso real con varios usuarios se necesita un backend.

## Cuentas de prueba
`ADM-001` (Admin) · `SEC-001` (Visor) · `LS-001` (Foliador de Secretaría) · `LD-001`, `LD-002`, `SOL-001..003` (Foliadores de área).

## Modo pruebas del login
`js/main.js` → `LOGIN_SIN_PASSWORD_TEMPORAL = true` acepta cualquier contraseña (o ninguna).
Poner en `false` para exigir la contraseña real (`1234` en las cuentas de prueba).

## Reglas de folios
- Formato `SIGLA/NNN/AÑO`; serie independiente por área y por tipo de documento.
- La numeración **reinicia en 001 cada año**.
- Cancelados y rechazados **conservan su número** (no se reutiliza) y quedan en el historial del folio.
- Un foliador solo cancela/reasigna/asigna folios de la serie de **su** área.
- Las solicitudes van al **superior inmediato** activo; el área central no solicita.

## Pruebas
`node tests/folios.test.js` (sin dependencias).

## Identidad visual (SICOFO · Gobierno de Chiapas)
- Logos: `img/logo-sicofo.png` (encabezado y favicon) e `img/banner-login.png` (banner del login).
- Grecas y textura tomadas del manual de marca: `img/greca-rombos.svg` (cenefa), `img/greca-zigzag.svg` (disponible) y `img/textura-beige.svg` (fondo).
- Paleta en `:root` de `css/style.css`: magenta `#D80069`, verde `#009884`, rojo `#DC0000`, vino `#801828`, azul `#283870`, beige `#EFE7E0`.
