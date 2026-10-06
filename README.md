# Paid Media · Impacto Salmón

Dos herramientas en el mismo sitio:

- **Brief de Artes** (`/`): wizard para pedir artes a diseño y generar el brief en PDF.
- **Bitácora de Pauta** (`/bitacora/`): control de todos los anuncios dados de alta en pauta, compartido con el cliente.
  Ver [Bitácora de Pauta](#bitácora-de-pauta).

## Brief de Artes

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

## Bitácora de Pauta

Control de todos los anuncios que están dados de alta en pauta, compartido entre Impacto Salmón y el cliente
(por ejemplo, RHINO Performance). Los dos equipos pueden editar.

- **Organizada como en Ads Manager:** Campaña → Conjunto de anuncios → Anuncio.
- **Por anuncio:** creativo, copy y video actualizado, copy en pauta, link, presupuesto, keyword del chatbot,
  fecha de lanzamiento, link de preview y notas.
- **Estatus que cualquiera puede cambiar con un clic:**
  - *En pauta:* Activo, Por lanzar, Pausado, Desactivado.
  - *Prueba:* Sin probar, En prueba, Probado · funciona, Probado · no funcionó.
- **Pendiente de subir:** si alguien cambia copy, link, keyword o creativo, el anuncio queda marcado como
  “Pendiente de subir” hasta que Impacto Salmón lo actualice en la plataforma y pique “Ya está en pauta”.
- **Historial:** cada cambio guarda quién lo hizo, de qué equipo, cuándo, y el antes → después.
- **Ediciones al mismo tiempo:** si dos personas editan el mismo anuncio, sus cambios se combinan. Si las dos
  cambiaron el mismo campo, la segunda ve un aviso antes de guardar.
- **Importar:** se pegan las filas copiadas de Excel o Google Sheets con los encabezados de la plantilla de pauta
  (Campaña, Conjunto de anuncios, Anuncio, Creativo, Copy y Video Actualizado, Copy, Link, Presupuesto, Keyword,
  Fecha de Lanzamiento, Ver anuncios). Las celdas vacías de campaña y conjunto toman el valor de la fila de arriba.
  Los anuncios importados entran como *Activo*, salvo los que dicen “DESACTIVADO” en Link.
- **Exportar** a CSV lo que esté filtrado.

Si la bitácora está vacía, el botón **“Cargar pauta de Rhino Performance”** carga los 29 anuncios de
`src/bitacora/seed/rhino.tsv`.

### Diseño y logos

La Bitácora tiene su propio look: fondo negro y escala de grises (`src/bitacora/theme.css`), con los logos de
Impacto Salmón y del cliente en el encabezado y en “¿Quién eres?”. El Brief de Artes no cambia.

Para agregar el logo de otro cliente:

1. Guarda el logo en blanco sobre fondo transparente (PNG) en `public/logos/`, por ejemplo `public/logos/nuevo-cliente.png`.
2. Agrégalo a `CLIENT_LOGOS` en `src/bitacora/config.ts`. La llave es el nombre del cliente en minúsculas, igual que en
   el título de la hoja (`Bitácora · Nuevo Cliente` → `'nuevo cliente'`).

Si un cliente no tiene logo, se muestra su nombre en texto.

### Dónde se guardan los datos: una Google Sheet por cliente

La app es estática (GitHub Pages), así que los datos compartidos viven en una Google Sheet de Impacto Salmón,
a través de un Apps Script publicado como app web. Sin hoja conectada, la app funciona en **modo local**:
los cambios se quedan en ese navegador y no se comparten.

Configuración (una vez por cliente):

1. Crea una Google Sheet nueva llamada `Bitácora · Rhino Performance`. Lo que va después de “Bitácora ·”
   aparece en la app como nombre del cliente y como equipo en “¿Quién eres?”.
2. En la hoja, ve a **Extensiones → Apps Script**. Borra lo que haya, pega el contenido de `apps-script/Code.gs` y guarda.
3. Opcional, pero recomendado: en **Configuración del proyecto → Propiedades del script**, agrega `KEY` con la clave
   que quieras.
4. **Implementar → Nueva implementación → Tipo: App web.**
   - Ejecutar como: **Yo** (la cuenta de Impacto Salmón).
   - Quién tiene acceso: **Cualquier persona**.

   Autoriza los permisos y copia la URL que termina en `/exec`.
5. Abre `/bitacora/`, pica **Modo local → Conectar hoja**, pega la URL y la clave.
6. En el mismo diálogo, pica **Copiar link** y mándaselo al cliente. Ese link ya trae la conexión: al abrirlo, la app
   queda conectada en su navegador.

El script crea solo las pestañas **Anuncios** e **Historial**. Se pueden ver y filtrar en Sheets, pero conviene
editar desde la app para que quede el historial. Si cambias `Code.gs`, publica una versión nueva en
**Implementar → Gestionar implementaciones → Editar → Nueva versión** para conservar la misma URL.

> **Acceso:** no hay login. Cualquier persona con el link (URL + clave) puede ver y editar la bitácora de ese cliente,
> así que compártelo solo con su equipo. Si se filtra, cambia `KEY` en las propiedades del script y vuelve a
> compartir el link. El nombre que pone cada persona solo sirve para el historial; no es una contraseña.

### Archivos

```
bitacora/index.html          ← entrada de la página
src/bitacora/
  App.tsx                    ← lista agrupada, filtros, resumen
  theme.css                  ← fondo negro y escala de grises
  config.ts                  ← estatus, plataformas, etiquetas y logos de clientes (editable)
  components/                ← tarjeta, editor, diálogos
  lib/ads.ts                 ← importar (TSV), exportar (CSV), historial
  lib/api.ts                 ← conexión con la hoja / modo local
  seed/rhino.tsv             ← pauta inicial de RHINO Performance
public/logos/                ← logos en blanco (Impacto Salmón y clientes)
apps-script/Code.gs          ← backend para la Google Sheet
```
