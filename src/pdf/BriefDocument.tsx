import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { getFormat, getPlatform, KIND_LABELS, type FormatSpec } from '../config/formats'
import { PRIORITIES } from '../config/lists'
import type { Brief, LinkItem, Piece, SelectedFormat } from '../types'
import { shapeGeometry } from '../lib/shape'
import {
  activeFormats,
  briefCounts,
  clientName,
  countsText,
  filledLinks,
  formatDate,
  formulaText,
  normalizeUrl,
  objectiveName,
  pieceCounts,
  todayISO,
  versionLetters,
  videoDuration,
} from '../lib/utils'

// Sin guiones de corte de palabra ("sub-títulos").
Font.registerHyphenationCallback((word) => [word])

const SALMON = '#f26b5b'
const SALMON_DARK = '#b93b2d'
const SALMON_LIGHT = '#fff1ee'
const INK = '#1c1917'
const MUTED = '#78716c'
const LINE = '#e7e5e4'

const s = StyleSheet.create({
  page: { paddingTop: 64, paddingBottom: 54, paddingHorizontal: 44, fontFamily: 'Helvetica', fontSize: 10, color: INK, lineHeight: 1.35 },
  header: {
    position: 'absolute',
    top: 22,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: SALMON,
  },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: SALMON_DARK },
  headerRight: { fontSize: 8.5, color: MUTED },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 6,
  },
  eyebrow: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: SALMON, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  h1: { fontSize: 22, lineHeight: 1.25, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  h2: { fontSize: 12, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', marginBottom: 6, marginTop: 14, color: INK },
  sub: { fontSize: 11, lineHeight: 1.4, color: MUTED },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, borderWidth: 1, borderColor: LINE, borderRadius: 6 },
  cell: { width: '33.33%', padding: 8, borderColor: LINE },
  cellLabel: { fontSize: 7.5, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cellValue: { fontSize: 10.5, fontFamily: 'Helvetica-Bold' },
  para: { fontSize: 10, color: '#292524' },
  link: { color: '#2563eb', textDecoration: 'underline', fontSize: 9.5 },
  table: { borderWidth: 1, borderColor: LINE, borderRadius: 6 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, textTransform: 'uppercase', padding: 6 },
  td: { fontSize: 9.5, padding: 6 },
  totalBox: { backgroundColor: SALMON, borderRadius: 6, padding: 10, marginBottom: 8 },
  highlight: {
    backgroundColor: SALMON_LIGHT,
    borderLeftWidth: 4,
    borderLeftColor: SALMON,
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
  },
  box: { borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 10, marginBottom: 8 },
  boxTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  kv: { flexDirection: 'row', marginBottom: 4 },
  k: { width: 92, fontSize: 8.5, color: MUTED },
  v: { flex: 1, fontSize: 10.5 },
})

const PdfPage = ({ brief, children }: { brief: Brief; children: ReactNode }) => (
  <Page size="LETTER" style={s.page} wrap>
    <View style={s.header} fixed>
      <Text style={s.brand}>Impacto Salmón — Brief de Artes</Text>
      <Text style={s.headerRight}>
        {clientName(brief)} · {brief.campaign}
      </Text>
    </View>
    {children}
    <View style={s.footer} fixed>
      <Text>Solicitado el {formatDate(todayISO())}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  </Page>
)

const Links = ({ links }: { links: LinkItem[] }) => (
  <View>
    {filledLinks(links).map((l) => (
      <View key={l.id} style={{ flexDirection: 'row', marginBottom: 3 }}>
        <Text style={{ fontSize: 9.5, marginRight: 4 }}>•</Text>
        {l.label.trim() ? <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginRight: 4 }}>{l.label}:</Text> : null}
        <Link src={normalizeUrl(l.url)} style={s.link}>
          {l.url.trim()}
        </Link>
      </View>
    ))}
  </View>
)

const Cell = ({ label, children, i }: { label: string; children: ReactNode; i: number }) => (
  <View style={[s.cell, { borderRightWidth: i % 3 < 2 ? 1 : 0, borderBottomWidth: i < 6 ? 1 : 0 }]}>
    <Text style={s.cellLabel}>{label}</Text>
    {typeof children === 'string' ? <Text style={s.cellValue}>{children}</Text> : children}
  </View>
)

function Shape({ spec, scale = 0.85 }: { spec: FormatSpec; scale?: number }) {
  const g = shapeGeometry(spec, scale)
  const phone = spec.frame === 'phone'
  return (
    <View
      style={{
        width: g.outerW,
        height: g.outerH,
        borderWidth: 1.2,
        borderColor: '#57534e',
        borderRadius: (phone ? 9 : 4) * scale,
        backgroundColor: '#fafaf9',
        position: 'relative',
      }}
    >
      {phone ? (
        <View
          style={{ position: 'absolute', top: 3.5 * scale, left: g.outerW / 2 - 7 * scale - 1.2, width: 14 * scale, height: 2.2 * scale, borderRadius: 2, backgroundColor: '#a8a29e' }}
        />
      ) : null}
      <View
        style={{ position: 'absolute', left: g.screen.x - 1.2, top: g.screen.y - 1.2, width: g.screen.w, height: g.screen.h, backgroundColor: '#e7e5e4' }}
      />
      <View
        style={{
          position: 'absolute',
          left: g.art.x - 1.2,
          top: g.art.y - 1.2,
          width: g.art.w,
          height: g.art.h,
          backgroundColor: SALMON,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{spec.ratio}</Text>
      </View>
    </View>
  )
}

function FormatTile({ sf }: { sf: SelectedFormat }) {
  const spec = getFormat(sf.formatId)!
  const pl = getPlatform(spec.platform)
  const hasVideo = sf.kinds.includes('video')
  return (
    <View
      wrap={false}
      style={{ width: '48.5%', flexDirection: 'row', borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 8, marginBottom: 8, alignItems: 'center' }}
    >
      <View style={{ width: 92, alignItems: 'center' }}>
        <Shape spec={spec} />
      </View>
      <View style={{ flex: 1, marginLeft: 6 }}>
        <Text style={{ fontSize: 7.5, color: pl.color, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' }}>
          {pl.name}
          {spec.group ? ` · ${spec.group}` : ''}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 1.25, fontFamily: 'Helvetica-Bold' }}>{spec.ratio}</Text>
        <Text style={{ fontSize: 9.5 }}>{spec.placement}</Text>
        <Text style={{ fontSize: 9, fontFamily: 'Courier', color: MUTED, marginTop: 1 }}>
          {spec.width}×{spec.height} px
        </Text>
        <Text style={{ fontSize: 9, marginTop: 3, fontFamily: 'Helvetica-Bold', color: SALMON_DARK }}>
          {sf.kinds.map((k) => KIND_LABELS[k]).join(' + ')}
        </Text>
        {hasVideo ? (
          <Text style={{ fontSize: 8.5, marginTop: 1 }}>
            {sf.adType ? `${sf.adType} · ` : ''}Duración {videoDuration(sf)} · {sf.subtitles ? 'Con subtítulos' : 'Sin subtítulos'}
          </Text>
        ) : null}
        <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>{spec.files.join(' · ')}</Text>
        {spec.notes ? <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 1 }}>{spec.notes}</Text> : null}
      </View>
    </View>
  )
}

const KV = ({ k, v }: { k: string; v: string }) =>
  v.trim() ? (
    <View style={s.kv}>
      <Text style={s.k}>{k}</Text>
      <Text style={[s.v, k === 'Titular' ? { fontFamily: 'Helvetica-Bold', fontSize: 12, lineHeight: 1.3 } : {}]}>{v}</Text>
    </View>
  ) : null

function CopySection({ piece }: { piece: Piece }) {
  const c = piece.copy
  return (
    <View>
      <Text style={s.h2} minPresenceAhead={60}>Copy</Text>
      {c.mode === 'listo' ? (
        <View style={[s.box, { borderColor: SALMON, borderWidth: 1.5 }]} wrap={false}>
          <Text style={[s.boxTitle, { color: SALMON_DARK }]}>Texto que va EN EL ARTE</Text>
          <KV k="Titular" v={c.headline} />
          <KV k="Texto de apoyo" v={c.support} />
          <KV k="CTA" v={c.cta} />
          {c.legals.trim() ? (
            <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: LINE }}>
              <Text style={[s.boxTitle, { color: SALMON_DARK, marginBottom: 3 }]}>Legales visibles en el arte</Text>
              <Text style={{ fontSize: 9 }}>{c.legals}</Text>
            </View>
          ) : null}
        </View>
      ) : c.mode === 'equipo' ? (
        <View style={s.box}>
          <Text style={[s.boxTitle, { color: SALMON_DARK }]}>Copy: lo propone el equipo</Text>
          <Text style={s.para}>{c.ideas.trim() ? `Ideas / tono: ${c.ideas}` : 'Sin indicaciones adicionales.'}</Text>
        </View>
      ) : c.mode === 'pendiente' ? (
        <View style={[s.box, { backgroundColor: '#fffbeb', borderColor: '#fcd34d' }]}>
          <Text style={[s.boxTitle, { color: '#92400e' }]}>Copy pendiente — llega después</Text>
          <Text style={s.para}>Trabajar con textos de relleno hasta recibir el copy final.</Text>
        </View>
      ) : (
        <View style={[s.box, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
          <Text style={[s.boxTitle, { color: '#b91c1c' }]}>Copy sin definir</Text>
          <Text style={s.para}>Confirmar con el solicitante.</Text>
        </View>
      )}

      {piece.internalNotes.trim() ? (
        <View style={[s.box, { borderStyle: 'dashed', borderColor: '#a8a29e', backgroundColor: '#f5f5f4' }]}>
          <Text style={[s.boxTitle, { color: '#44403c' }]}>Notas internas para diseño — NO van en el arte</Text>
          <Text style={s.para}>{piece.internalNotes}</Text>
        </View>
      ) : null}
    </View>
  )
}

function PieceSection({ piece, index, brief }: { piece: Piece; index: number; brief: Brief }) {
  const formats = activeFormats(piece, brief)
  const c = pieceCounts(piece, brief)
  return (
    <PdfPage brief={brief}>
      <Text style={s.eyebrow}>
        Pieza {index + 1} de {brief.pieces.length}
      </Text>
      <Text style={s.h1}>{piece.name || `Pieza ${index + 1}`}</Text>
      {piece.description.trim() ? <Text style={[s.para, { fontSize: 11, lineHeight: 1.4, marginTop: 2 }]}>{piece.description}</Text> : null}

      <View style={[s.highlight, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View>
          <Text style={{ fontSize: 13, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', color: SALMON_DARK }}>
            Versiones de diseño distintas: {piece.versions}
          </Text>
          <Text style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>
            {piece.versions > 1
              ? `Versiones ${versionLetters(piece.versions).join(', ')}: diseños diferentes entre sí. Cada una se adapta a todos los formatos de abajo.`
              : 'Un solo diseño, adaptado a todos los formatos de abajo.'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
          <Text style={{ fontSize: 18, lineHeight: 1.2, fontFamily: 'Helvetica-Bold', color: SALMON_DARK }}>{c.total}</Text>
          <Text style={{ fontSize: 8, color: MUTED }}>archivos</Text>
        </View>
      </View>
      <Text style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>
        {piece.versions} {piece.versions === 1 ? 'versión' : 'versiones'} × {c.formatSlots} {c.formatSlots === 1 ? 'formato' : 'formatos'} = {countsText(c)}
      </Text>

      <Text style={s.h2} minPresenceAhead={60}>Formatos ({c.formatSlots})</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {formats.map((sf) => (
          <FormatTile key={sf.formatId} sf={sf} />
        ))}
      </View>

      <CopySection piece={piece} />

      {piece.images.length ? (
        <View>
          <Text style={s.h2} minPresenceAhead={160}>Imágenes de inspiración</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {piece.images.map((img, i) => (
              <View
                key={img.id}
                wrap={false}
                style={{ width: '32%', height: 150, marginRight: i % 3 < 2 ? '2%' : 0, marginBottom: 8, borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 3, alignItems: 'center', justifyContent: 'center' }}
              >
                <Image src={img.dataUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {filledLinks(piece.links).length ? (
        <View wrap={false}>
          <Text style={s.h2} minPresenceAhead={60}>Links de referencia</Text>
          <Links links={piece.links} />
        </View>
      ) : null}
    </PdfPage>
  )
}

function Checkbox() {
  return <View style={{ width: 10, height: 10, borderWidth: 1.2, borderColor: '#57534e', borderRadius: 2, marginRight: 8 }} />
}

function Checklist({ brief }: { brief: Brief }) {
  const total = briefCounts(brief)
  return (
    <PdfPage brief={brief}>
      <Text style={s.eyebrow}>Para diseño</Text>
      <Text style={s.h1}>Checklist de entregables</Text>
      <Text style={[s.sub, { marginBottom: 10 }]}>
        {total.total} archivos en total: {countsText(total)}. Marca cada archivo al entregarlo.
      </Text>
      {brief.pieces.map((p, i) => {
        const formats = activeFormats(p, brief)
        return (
          <View key={p.id} style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: SALMON_DARK }} minPresenceAhead={40}>
              {i + 1}. {p.name || `Pieza ${i + 1}`}
            </Text>
            {versionLetters(p.versions).map((v) =>
              formats.flatMap((sf) => {
                const spec = getFormat(sf.formatId)!
                return sf.kinds.map((k) => (
                  <View
                    key={`${v}-${sf.formatId}-${k}`}
                    wrap={false}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: LINE }}
                  >
                    <Checkbox />
                    <Text style={{ width: 62, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>Versión {v}</Text>
                    <Text style={{ width: 110, fontSize: 9 }}>
                      {getPlatform(spec.platform).name}
                      {spec.group ? ` · ${spec.group === 'Performance Max' ? 'PMax' : spec.group}` : ''}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 9 }}>
                      {spec.ratio} {spec.placement} ({spec.width}×{spec.height})
                    </Text>
                    <Text style={{ width: 120, fontSize: 9, textAlign: 'right' }}>
                      {KIND_LABELS[k]}
                      {k === 'video' ? ` · ${videoDuration(sf)}${sf.subtitles ? ' · subt.' : ''}` : ''}
                    </Text>
                  </View>
                ))
              }),
            )}
          </View>
        )
      })}
    </PdfPage>
  )
}

export function BriefDocument({ brief }: { brief: Brief }) {
  const total = briefCounts(brief)
  const priority = PRIORITIES.find((p) => p.id === brief.priority) ?? PRIORITIES[0]
  const platforms = brief.platforms.map((id) => getPlatform(id).name).join(', ')
  const cells: [string, ReactNode][] = [
    ['Cliente', clientName(brief) || '—'],
    ['Campaña', brief.campaign || '—'],
    ['Solicitante', brief.requester || '—'],
    ['Fecha de solicitud', formatDate(todayISO())],
    ['Fecha requerida', formatDate(brief.neededBy)],
    ['Lanzamiento', formatDate(brief.launchDate)],
    [
      'Prioridad',
      <Text style={[s.cellValue, { color: priority.color }]}>
        <Text style={{ backgroundColor: priority.bg }}> {priority.label.toUpperCase()} </Text>
      </Text>,
    ],
    ['Objetivo', objectiveName(brief) || '—'],
    ['Plataformas', platforms || '—'],
  ]

  return (
    <Document title={`Brief de Artes — ${clientName(brief)} — ${brief.campaign}`} author={brief.requester} creator="Impacto Salmón">
      <PdfPage brief={brief}>
        <Text style={s.eyebrow}>Brief de artes</Text>
        <Text style={s.h1}>{brief.campaign || 'Campaña sin nombre'}</Text>
        <Text style={s.sub}>{clientName(brief)}</Text>

        <View style={s.grid}>
          {cells.map(([label, value], i) => (
            <Cell key={label} label={label} i={i}>
              {value}
            </Cell>
          ))}
        </View>

        {brief.context.trim() ? (
          <View>
            <Text style={s.h2} minPresenceAhead={60}>Contexto</Text>
            <Text style={s.para}>{brief.context}</Text>
          </View>
        ) : null}

        {filledLinks(brief.links).length ? (
          <View>
            <Text style={s.h2} minPresenceAhead={60}>Links</Text>
            <Links links={brief.links} />
          </View>
        ) : null}

        <Text style={s.h2} minPresenceAhead={60}>Entregables</Text>
        <View style={s.totalBox} wrap={false}>
          <Text style={{ color: 'white', fontSize: 16, lineHeight: 1.3, fontFamily: 'Helvetica-Bold' }}>
            {total.total} archivos: {countsText(total)}
          </Text>
          <Text style={{ color: 'white', fontSize: 9.5, marginTop: 2 }}>{formulaText(brief)}</Text>
        </View>
        <View style={s.table} wrap={false}>
          <View style={[s.tr, { backgroundColor: '#fafaf9' }]}>
            <Text style={[s.th, { flex: 1 }]}>Pieza</Text>
            <Text style={[s.th, { width: 62, textAlign: 'center' }]}>Versiones</Text>
            <Text style={[s.th, { width: 58, textAlign: 'center' }]}>Formatos</Text>
            <Text style={[s.th, { width: 58, textAlign: 'center' }]}>Imágenes</Text>
            <Text style={[s.th, { width: 50, textAlign: 'center' }]}>Videos</Text>
            <Text style={[s.th, { width: 66, textAlign: 'center' }]}>Carruseles</Text>
            <Text style={[s.th, { width: 44, textAlign: 'center' }]}>Total</Text>
          </View>
          {brief.pieces.map((p, i) => {
            const c = pieceCounts(p, brief)
            return (
              <View key={p.id} style={s.tr}>
                <Text style={[s.td, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>
                  {i + 1}. {p.name || `Pieza ${i + 1}`}
                </Text>
                <Text style={[s.td, { width: 62, textAlign: 'center' }]}>{p.versions}</Text>
                <Text style={[s.td, { width: 58, textAlign: 'center' }]}>× {c.formatSlots}</Text>
                <Text style={[s.td, { width: 58, textAlign: 'center' }]}>{c.images}</Text>
                <Text style={[s.td, { width: 50, textAlign: 'center' }]}>{c.videos}</Text>
                <Text style={[s.td, { width: 66, textAlign: 'center' }]}>{c.carousels}</Text>
                <Text style={[s.td, { width: 44, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{c.total}</Text>
              </View>
            )
          })}
          <View style={[s.tr, { backgroundColor: SALMON_LIGHT, borderBottomWidth: 0 }]}>
            <Text style={[s.td, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>Total</Text>
            <Text style={[s.td, { width: 62 }]} />
            <Text style={[s.td, { width: 58 }]} />
            <Text style={[s.td, { width: 58, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{total.images}</Text>
            <Text style={[s.td, { width: 50, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{total.videos}</Text>
            <Text style={[s.td, { width: 66, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{total.carousels}</Text>
            <Text style={[s.td, { width: 44, textAlign: 'center', fontFamily: 'Helvetica-Bold', color: SALMON_DARK }]}>{total.total}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: MUTED, marginTop: 6 }}>
          Versiones = diseños distintos. Formatos = tamaños en que se adapta cada versión. Archivos = versiones × formatos.
        </Text>
      </PdfPage>

      {brief.pieces.map((p, i) => (
        <PieceSection key={p.id} piece={p} index={i} brief={brief} />
      ))}

      <Checklist brief={brief} />
    </Document>
  )
}
