# Brief de Artes · Impacto Salmón

Mini webapp que guía a Carlos, Harumi y Emma para pedir artes a diseño y genera un **brief en PDF**
claro y completo, sin ambigüedades del tipo “¿2 versiones son 2 diseños o 2 tamaños?”.

- 100 % estática (sin backend): Vite + React + TypeScript + Tailwind.
- El PDF se genera en el navegador con `@react-pdf/renderer`.
- El borrador se guarda solo, así que recargar la página no borra nada.

## Cómo funciona

**Solicitud → Piezas → Versiones de diseño → Formatos**

| Concepto | Qué significa |
| --- | --- |
| **Pieza** | Cada promoción o mensaje distinto (ej. “Promo 3 meses 50%”). |
| **Versiones** | Cuántos diseños **distintos** se quieren de esa pieza (A, B, C, D). |
| **Formatos** | En qué tamaños se adapta **cada** versión (1:1, 9:16…) y de qué tipo (imagen, video, carrusel). |

Archivos a entregar = versiones × formatos, sumados para todas las piezas. La app muestra el conteo
arriba en todo momento, por ejemplo: `3 piezas × 2 versiones × 2 formatos = 12 imágenes`.

El wizard tiene 4 pasos:

1. **Datos generales**: solicitante, cliente, campaña, objetivo, fechas, prioridad, plataformas, contexto y links.
2. **Piezas**: descripción, número de versiones, copy (ya lo tengo / que lo proponga el equipo / pendiente),
   notas internas, imágenes de inspiración (se comprimen en el navegador) y links. Cada pieza tiene un botón “Duplicar”.
3. **Formatos**: tarjetas visuales por plataforma, presets de un clic y “Aplicar mismos formatos a todas las piezas”.
   En los videos se piden la duración y si llevan subtítulos.
4. **Resumen y PDF**: vista previa, validaciones y descarga del PDF como
   `IS_Brief_{Cliente}_{Campaña}_{AAAA-MM-DD}.pdf`.

## Correrlo en local

Requiere Node 20 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros comandos:

```bash
npm run build      # revisa los tipos y compila a /dist
npm run preview    # sirve /dist en local
```

## Desplegar en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila y publica el sitio en cada push a `main`.
También se puede lanzar a mano desde la pestaña **Actions**.

1. En GitHub, ve a **Settings → Pages** y en **Source** elige **GitHub Actions** (solo la primera vez).
2. Haz push a `main`.
3. El sitio queda en `https://<usuario-u-organización>.github.io/<nombre-del-repo>/`.

El workflow define `BASE_PATH=/<nombre-del-repo>/` y `vite.config.ts` lo usa como `base`.
Si publicas en un dominio propio o en la raíz (`<usuario>.github.io`), cambia `BASE_PATH` a `/` en el workflow.

## Editar clientes, solicitantes y formatos

Todo lo editable está en `src/config/`. No hace falta tocar nada más.

### `src/config/lists.ts`

- `REQUESTERS`: quién solicita artes.
- `CLIENTS`: lista de clientes. La opción “Otro” (con campo de texto) se agrega sola.
- `OBJECTIVES`: objetivos de campaña.
- `PRIORITIES`: prioridades y sus colores.
- `VIDEO_DURATIONS`: duraciones de video sugeridas.

Ejemplo, para agregar un cliente:

```ts
export const CLIENTS: string[] = [
  'H&R Posadas',
  // …
  'Nuevo Cliente',
]
```

### `src/config/formats.ts`

- `PLATFORMS`: plataformas (Meta, Google, TikTok, ChatGPT).
- `FORMATS`: cada formato tiene:

  | Campo | Descripción |
  | --- | --- |
  | `id` | Identificador único. **No lo cambies** una vez en uso, porque los borradores lo guardan. |
  | `platform` | `'meta' \| 'google' \| 'tiktok' \| 'chatgpt'` |
  | `group` | Subgrupo opcional (ej. `'Performance Max'`, `'YouTube'`). |
  | `placement` | Ubicación (Feed, Stories / Reels…). |
  | `ratio`, `width`, `height` | Relación de aspecto y medidas en px. La silueta se dibuja con estas medidas. |
  | `kinds` | Tipos permitidos: `'imagen'`, `'video'`, `'carrusel'`. |
  | `files` | Archivos permitidos (JPG, PNG, MP4…). |
  | `frame` | `'phone'` (silueta de teléfono) o `'display'` (rectángulo). |
  | `videoAdTypes` | Tipos de anuncio de video (ej. Skippable, Bumper) si aplica. |
  | `notes` | Notas para diseño (zona segura, peso máximo…). |

- `PRESETS`: botones de un clic. Cada preset indica la plataforma y la lista de `formatId` + tipos.

> **ChatGPT Ads** tiene un formato de marcador (`chatgpt-placeholder`) con un `TODO: confirmar especificaciones`.
> Cuando se conozcan las medidas reales, reemplázalo en `FORMATS`.

## Dónde se guarda el borrador

- Los datos del formulario se guardan en `localStorage`.
- Las imágenes de inspiración pesan más de lo que admite `localStorage` (~5 MB), así que se guardan en `IndexedDB`.
  Antes se comprimen a 1600 px como máximo, en JPG con calidad 0.8.
- “Nueva” (arriba a la derecha) borra el borrador y empieza una solicitud nueva.

El borrador vive solo en ese navegador y ese equipo. No se comparte entre personas.

## Estructura

```
src/
  config/        ← listas y formatos editables
  components/    ← pasos del wizard y componentes de UI
  pdf/           ← documento PDF (react-pdf) y descarga
  lib/           ← conteos, validaciones, compresión de imágenes, geometría de siluetas
  state/         ← estado y autoguardado
```
