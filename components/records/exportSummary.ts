/**
 * 월간 정리 카드 → PNG (docs/03 M5). 새 라이브러리 없이:
 * 카드 전체를 SVG 문자열로 조립(정원은 화면의 SVG를 복제해 계산된 색으로 굳힘) → <canvas> → PNG.
 *
 * 글자는 document.fonts 로드 후 canvas fillText로 쓴다 — 화면과 같은 Pretendard.
 * SVG <text>는 이미지 안에서 웹폰트를 못 불러와 기기 글꼴로 떨어진다 (측정 계획 4, 2026-11-25 사용자 결정).
 */

export interface SummaryRow {
  name: string
  /** CSS 색 값 (var(--sp-N) 등) */
  color: string
  value: string
  percent: number
}

export interface SummaryImageData {
  title: string
  stats: { label: string; value: string }[]
  rows: SummaryRow[]
  fileName: string
}

const W = 360
const SCALE = 3
const PAD = 16
// 로컬 설치 'Pretendard'는 일부러 뺀다 — 개발 Mac에만 있어서 측정이 왜곡된다 (docs/03 M5)
const CANVAS_FONT = "'Pretendard Variable', sans-serif"

/** 'var(--x)' → 지금 테마·계절의 실제 색 */
function resolveColor(value: string): string {
  const m = value.match(/^var\((--[\w-]+)\)$/)
  if (!m) return value
  return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim()
}

/**
 * 화면의 정원 SVG를 복제하고 계산된 스타일(fill·stroke·opacity)을 속성으로 굳힌다.
 * 이미지 안에서는 CSS(변수·계절 선택자·애니메이션)가 적용되지 않기 때문.
 * 숨겨진 요소와 계절 입자(.amb — 키프레임 위치가 없으면 엉뚱한 곳에 멈춘다)는 뺀다.
 */
function freezeGarden(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const walk = (orig: Element, copy: Element) => {
    const origKids = Array.from(orig.children)
    const copyKids = Array.from(copy.children)
    origKids.forEach((o, i) => {
      const c = copyKids[i]
      const cs = getComputedStyle(o)
      if (cs.display === 'none' || cs.visibility === 'hidden' || o.classList.contains('amb')) {
        c.remove()
        return
      }
      c.setAttribute('fill', cs.fill)
      c.setAttribute('stroke', cs.stroke)
      c.setAttribute('opacity', cs.opacity)
      if (o.tagName === 'stop') c.setAttribute('stop-color', cs.stopColor)
      c.removeAttribute('class')
      walk(o, c)
    })
  }
  walk(svg, clone)
  clone.removeAttribute('class')
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

interface TextItem {
  x: number
  y: number
  text: string
  size: number
  weight: number
  color: string
  align: 'left' | 'right' | 'center'
}

function layout(data: SummaryImageData, garden: string) {
  const c = {
    bg: resolveColor('var(--bg)'),
    surface: resolveColor('var(--surface)'),
    line: resolveColor('var(--line)'),
    ink: resolveColor('var(--ink)'),
    muted: resolveColor('var(--muted)'),
  }
  const texts: TextItem[] = []
  const shapes: string[] = []
  const t = (x: number, y: number, text: string, size: number, weight: number, color: string, align: TextItem['align'] = 'left') =>
    texts.push({ x, y, text, size, weight, color, align })
  const panel = (x: number, y: number, w: number, h: number, r = 20) =>
    shapes.push(`<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="${c.surface}" stroke="${c.line}"/>`)

  const inner = W - PAD * 2
  let y = 36
  t(PAD + 4, y, data.title, 19, 600, c.ink)
  t(W - PAD - 4, y, 'Study Garden', 11, 500, c.muted, 'right')

  // 정원
  y = 52
  const gw = inner - 24
  const gh = (gw * 250) / 800
  panel(PAD, y, inner, gh + 26)
  shapes.push(garden.replace('<svg', `<svg x="${PAD + 12}" y="${y + 13}" width="${gw}" height="${gh}"`))
  y += gh + 26 + 10

  // 숫자 2×2
  const tw = (inner - 8) / 2
  data.stats.forEach((s, i) => {
    const x = PAD + (i % 2) * (tw + 8)
    const ty = y + Math.floor(i / 2) * 72
    panel(x, ty, tw, 64, 16)
    t(x + 16, ty + 24, s.label, 11, 400, c.muted)
    t(x + 16, ty + 48, s.value, 17, 600, c.ink)
  })
  y += Math.ceil(data.stats.length / 2) * 72 + 2

  // 과목 비율
  if (data.rows.length > 0) {
    const h = 62 + data.rows.length * 24
    panel(PAD, y, inner, h)
    t(PAD + 16, y + 26, '과목별로 가꾼 시간', 12, 500, c.muted)
    const bx = PAD + 16
    const bw = inner - 32
    const by = y + 38
    shapes.push(`<clipPath id="bar"><rect x="${bx}" y="${by}" width="${bw}" height="8" rx="4"/></clipPath>`)
    let acc = 0
    const total = data.rows.reduce((a, r) => a + r.percent, 0) || 1
    const segs = data.rows.map((r) => {
      const w = (bw * r.percent) / total
      const seg = `<rect x="${bx + acc}" y="${by}" width="${w}" height="8" fill="${resolveColor(r.color)}"/>`
      acc += w
      return seg
    })
    shapes.push(`<g clip-path="url(#bar)"><rect x="${bx}" y="${by}" width="${bw}" height="8" fill="${c.line}"/>${segs.join('')}</g>`)
    data.rows.forEach((r, i) => {
      const ry = y + 70 + i * 24
      shapes.push(`<circle cx="${bx + 4}" cy="${ry - 4}" r="4" fill="${resolveColor(r.color)}"/>`)
      t(bx + 16, ry, r.name, 13, 500, c.ink)
      t(bx + bw, ry, `${r.value} · ${r.percent}%`, 12, 400, c.muted, 'right')
    })
    y += h
  }
  const H = Math.ceil(y + PAD)
  return { c, texts, shapes, H }
}

function loadImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('정원 이미지를 그리지 못했어요'))
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
}

export async function renderSummaryPng(
  data: SummaryImageData,
  gardenSvg: SVGSVGElement,
): Promise<Blob> {
  const { c, texts, shapes, H } = layout(data, freezeGarden(gardenSvg))
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W * SCALE}" height="${H * SCALE}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${c.bg}"/>${shapes.join('')}</svg>`
  const img = await loadImage(svg)
  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // 쓰일 글자의 웹폰트 조각(dynamic subset)까지 받은 뒤에 쓴다
  const weights = [...new Set(texts.map((i) => i.weight))]
  const all = texts.map((i) => i.text).join('')
  await Promise.all(weights.map((w) => document.fonts.load(`${w} 16px ${CANVAS_FONT}`, all)))
  ctx.scale(SCALE, SCALE)
  for (const i of texts) {
    ctx.font = `${i.weight} ${i.size}px ${CANVAS_FONT}`
    ctx.fillStyle = i.color
    ctx.textAlign = i.align
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(i.text, i.x, i.y)
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 만들지 못했어요'))), 'image/png'),
  )
}

/** 파일 공유가 되면 공유 시트, 아니면 다운로드 */
export async function shareOrDownload(blob: Blob, fileName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
      // 공유가 막힌 환경이면 다운로드로 넘어간다
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
