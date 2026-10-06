/**
 * Bitácora de Pauta · Impacto Salmón
 *
 * Backend en Google Sheets para la app web /bitacora/.
 * Se pega en Extensiones → Apps Script de una Google Sheet (una hoja por cliente)
 * y se publica como “App web”. Las instrucciones completas están en el README.
 *
 * La hoja guarda dos pestañas:
 *   - Anuncios: un anuncio por fila (se puede leer y filtrar directo en Sheets).
 *   - Historial: quién cambió qué y cuándo.
 *
 * Clave opcional: en Configuración del proyecto → Propiedades del script agrega
 * KEY = <una clave>. Si existe, la app la tiene que mandar en cada petición.
 *
 * Si el script se creó aparte (en script.google.com y no desde la hoja), agrega también
 * SHEET_ID = <el ID de la hoja> (lo que va entre /d/ y /edit en su URL).
 *
 * Para revisar que todo esté bien, abre la URL /exec en una ventana de incógnito:
 * debe mostrar {"ok":true,...} con el nombre de la hoja.
 */

var SHEET_ADS = 'Anuncios'
var SHEET_LOG = 'Historial'
var HISTORY_LIMIT = 1500

// [clave en la app, encabezado en la hoja]
var COLS = [
  ['id', 'ID'],
  ['platform', 'Plataforma'],
  ['campaign', 'Campaña'],
  ['adSet', 'Conjunto de anuncios'],
  ['name', 'Anuncio'],
  ['status', 'Estatus en pauta'],
  ['test', 'Estatus de prueba'],
  ['sync', 'Cambios'],
  ['creative', 'Creativo'],
  ['copyUpdated', 'Copy y video actualizado'],
  ['copy', 'Copy en pauta'],
  ['link', 'Link'],
  ['budget', 'Presupuesto'],
  ['keyword', 'Keyword (chatbot)'],
  ['launch', 'Fecha de lanzamiento'],
  ['preview', 'Ver anuncio'],
  ['notes', 'Notas'],
  ['order', 'Orden'],
  ['createdBy', 'Creado por'],
  ['updatedAt', 'Última edición'],
  ['updatedBy', 'Editado por'],
]
var LOG_HEADERS = ['Fecha', 'Quién', 'Equipo', 'ID anuncio', 'Anuncio', 'Acción', 'Detalle', 'Cambios (JSON)']

function doGet() {
  try {
    return json({ ok: true, message: 'Bitácora de Pauta conectada.', sheet: spreadsheet().getName() })
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) })
  }
}

function doPost(e) {
  // Cualquier error se regresa como JSON: si el script truena, la app ve el mensaje en vez de "Failed to fetch".
  try {
    return handle(e)
  } catch (err) {
    return json({ ok: false, error: 'Error en el script: ' + String(err && err.message || err) })
  }
}

function handle(e) {
  var body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return json({ ok: false, error: 'Petición inválida.' })
  }
  var key = PropertiesService.getScriptProperties().getProperty('KEY')
  if (key && body.key !== key) return json({ ok: false, error: 'Clave incorrecta. Pide el link actualizado a Impacto Salmón.' })

  if (body.action === 'list') return json(list())

  var lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    if (body.action === 'save') return json(save(body.ad, body.base, body.entry))
    if (body.action === 'delete') return json(remove(body.id, body.entry))
    if (body.action === 'bulk') return json(bulk(body.ads, body.entry))
    return json({ ok: false, error: 'Acción desconocida: ' + body.action })
  } finally {
    lock.releaseLock()
  }
}

// ---------- Acciones ----------

function list() {
  var sheet = adsSheet()
  var values = sheet.getDataRange().getValues()
  var head = values.shift()
  var ads = values
    .filter(function (r) { return r.join('') !== '' })
    .map(function (r) { return rowToAd(head, r) })
    .filter(function (a) { return a.id })
  return { ok: true, title: spreadsheet().getName(), ads: ads, history: readHistory() }
}

function save(ad, base, entry) {
  var sheet = adsSheet()
  var head = headers(sheet)
  var rowIdx = findRow(sheet, head, ad.id)
  if (rowIdx > 0) {
    var current = rowToAd(head, sheet.getRange(rowIdx, 1, 1, head.length).getValues()[0])
    if (base !== null && base !== undefined && current.updatedAt !== base) return { ok: false, conflict: current }
  } else if (base) {
    // Lo estaban editando pero alguien más lo borró.
    return { ok: false, conflict: null }
  }
  ad.updatedAt = new Date().toISOString()
  ad.updatedBy = entry.by
  var row = adToRow(head, ad)
  if (rowIdx > 0) sheet.getRange(rowIdx, 1, 1, row.length).setValues([row])
  else sheet.appendRow(row)
  log(entry, ad.updatedAt)
  return { ok: true, ad: ad }
}

function remove(id, entry) {
  var sheet = adsSheet()
  var rowIdx = findRow(sheet, headers(sheet), id)
  if (rowIdx > 0) sheet.deleteRow(rowIdx)
  log(entry, new Date().toISOString())
  return { ok: true }
}

function bulk(ads, entry) {
  var sheet = adsSheet()
  var head = headers(sheet)
  var now = new Date().toISOString()
  var rows = ads.map(function (ad) {
    ad.updatedAt = now
    ad.updatedBy = entry.by
    return adToRow(head, ad)
  })
  if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, head.length).setValues(rows)
  log(entry, now)
  return { ok: true, ads: ads }
}

// ---------- Hoja ----------

/** La hoja donde vive el script, o la de la propiedad SHEET_ID si el script se creó aparte. */
function spreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID')
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive()
  if (!ss) throw new Error('El script no está dentro de una hoja. Créalo desde la hoja (Extensiones → Apps Script) o agrega la propiedad SHEET_ID.')
  return ss
}

function adsSheet() {
  var ss = spreadsheet()
  var sheet = ss.getSheetByName(SHEET_ADS)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ADS)
    // Todo como texto, para que Sheets no convierta "$150" o "2026-08" en números o fechas.
    sheet.getRange(1, 1, sheet.getMaxRows(), COLS.length).setNumberFormat('@')
    sheet.getRange(1, 1, 1, COLS.length).setValues([COLS.map(function (c) { return c[1] })]).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function logSheet() {
  var ss = spreadsheet()
  var sheet = ss.getSheetByName(SHEET_LOG)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LOG)
    sheet.getRange(1, 1, sheet.getMaxRows(), LOG_HEADERS.length).setNumberFormat('@')
    sheet.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function headers(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
}

function keyFor(header) {
  for (var i = 0; i < COLS.length; i++) if (COLS[i][1] === header) return COLS[i][0]
  return null
}

function labelFor(key) {
  for (var i = 0; i < COLS.length; i++) if (COLS[i][0] === key) return COLS[i][1]
  return key
}

function findRow(sheet, head, id) {
  var col = head.indexOf('ID') + 1
  var last = sheet.getLastRow()
  if (!col || last < 2) return -1
  var ids = sheet.getRange(2, col, last - 1, 1).getValues()
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2
  return -1
}

function rowToAd(head, row) {
  var ad = {}
  head.forEach(function (h, i) {
    var k = keyFor(h)
    if (!k) return
    var v = row[i]
    if (v instanceof Date) v = v.toISOString()
    ad[k] = k === 'order' ? Number(v) || 0 : String(v === null || v === undefined ? '' : v)
  })
  return ad
}

function adToRow(head, ad) {
  return head.map(function (h) {
    var k = keyFor(h)
    if (!k) return ''
    var v = ad[k] === null || ad[k] === undefined ? '' : String(ad[k])
    // Evita que un copy que empieza con = o + se tome como fórmula.
    return /^[=+]/.test(v) ? "'" + v : v
  })
}

function log(entry, at) {
  var changes = entry.changes || []
  var detail = changes
    .map(function (c) { return labelFor(c.field) + ': ' + short(c.from) + ' → ' + short(c.to) })
    .join('\n')
  logSheet().appendRow([at, entry.by, entry.team, entry.adId, entry.adName, entry.action, detail, JSON.stringify(changes)])
}

function short(s) {
  s = String(s || '').replace(/\s+/g, ' ').trim()
  return s ? (s.length > 80 ? s.slice(0, 80) + '…' : s) : '—'
}

function readHistory() {
  var sheet = logSheet()
  var last = sheet.getLastRow()
  if (last < 2) return []
  var n = Math.min(HISTORY_LIMIT, last - 1)
  var rows = sheet.getRange(last - n + 1, 1, n, LOG_HEADERS.length).getValues()
  return rows.reverse().map(function (r) {
    var changes = []
    try {
      changes = JSON.parse(r[7] || '[]')
    } catch (err) {}
    return {
      at: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      by: String(r[1]),
      team: String(r[2]),
      adId: String(r[3]),
      adName: String(r[4]),
      action: String(r[5]),
      changes: changes,
    }
  })
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}
