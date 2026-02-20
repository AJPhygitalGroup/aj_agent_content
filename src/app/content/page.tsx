'use client'

import { useState, useEffect } from 'react'
import { FileText, Hash, Image, Layers, Loader2, ChevronDown, ChevronUp, Clock, Type, Download, TrendingUp, Eye } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ──

interface Script {
  slot_id: string
  platform: string
  content_type: string
  language: string
  hook?: string
  script_body?: string
  cta?: string
  caption?: string
  visual_notes?: string
  word_count?: number
  estimated_duration_seconds?: number
}

type Tab = 'scripts' | 'seo' | 'images' | 'carousels'

const platformColors: Record<string, string> = {
  instagram: 'border-l-pink-500',
  tiktok: 'border-l-gray-900',
  linkedin: 'border-l-blue-700',
  youtube: 'border-l-red-600',
  facebook: 'border-l-blue-600',
}

const platformLabels: Record<string, string> = {
  instagram: 'IG', tiktok: 'TT', linkedin: 'LI', youtube: 'YT', facebook: 'FB',
}

const platformBgColors: Record<string, string> = {
  instagram: 'bg-pink-500',
  tiktok: 'bg-gray-900',
  linkedin: 'bg-blue-700',
  youtube: 'bg-red-600',
  facebook: 'bg-blue-600',
}

// ── Helpers ──

/** Generate a downloadable text file from content */
function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Download JSON data as file */
function downloadJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Download CSV data */
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-components ──

function ScriptCard({ script }: { script: Script }) {
  const [expanded, setExpanded] = useState(false)
  const border = platformColors[script.platform] || 'border-l-gray-300'

  function handleDownload() {
    const parts = [
      `# ${script.slot_id} — ${script.platform} ${script.content_type} (${script.language})`,
      '',
      script.hook ? `## Hook\n${script.hook}\n` : '',
      script.script_body ? `## Guion\n${script.script_body}\n` : '',
      script.cta ? `## CTA\n${script.cta}\n` : '',
      script.caption ? `## Caption\n${script.caption}\n` : '',
      script.visual_notes ? `## Notas Visuales\n${script.visual_notes}\n` : '',
    ].filter(Boolean).join('\n')
    downloadText(`${script.slot_id}_script.txt`, parts)
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 border-l-4 ${border} shadow-sm`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformBgColors[script.platform] || 'bg-gray-500'}`}>
                {platformLabels[script.platform] || script.platform}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue">{script.content_type}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{(script.language || '').toUpperCase()}</span>
              {script.word_count != null && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Type className="w-3 h-3" /> {script.word_count}w
                </span>
              )}
              {script.estimated_duration_seconds != null && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> {script.estimated_duration_seconds}s
                </span>
              )}
            </div>
            {script.hook && (
              <p className="text-sm font-semibold text-gray-900">{script.hook}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{script.slot_id}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleDownload} className="p-1 text-gray-400 hover:text-brand-blue" title="Descargar script">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1 text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            {script.script_body && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-1">Guion</h4>
                <div className="p-3 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {script.script_body}
                </div>
              </div>
            )}
            {script.cta && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-1">CTA</h4>
                <p className="text-xs text-brand-blue font-medium bg-blue-50 px-3 py-2 rounded">{script.cta}</p>
              </div>
            )}
            {script.caption && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-1">Caption</h4>
                <div className="p-3 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap">{script.caption}</div>
              </div>
            )}
            {script.visual_notes && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-1">Notas Visuales</h4>
                <p className="text-xs text-gray-600 bg-amber-50 px-3 py-2 rounded">{script.visual_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function HashtagGroup({ label, tags, color }: { label: string; tags?: string[]; color: string }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="mb-2">
      <span className="text-xs font-semibold text-gray-500">{label}: </span>
      <div className="flex flex-wrap gap-1 mt-1">
        {tags.map((t, i) => (
          <span key={i} className={`text-xs px-2 py-0.5 rounded ${color}`}>{typeof t === 'string' ? t : String(t)}</span>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('scripts')
  const [scripts, setScripts] = useState<any>(null)
  const [seo, setSeo] = useState<any>(null)
  const [images, setImages] = useState<any>(null)
  const [carousels, setCarousels] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [scriptsRes, seoRes, imagesRes, carouselsRes] = await Promise.all([
        fetch(`${BACKEND}/api/content/scripts`).then(r => r.json()).catch(() => null),
        fetch(`${BACKEND}/api/content/seo`).then(r => r.json()).catch(() => null),
        fetch(`${BACKEND}/api/content/images`).then(r => r.json()).catch(() => null),
        fetch(`${BACKEND}/api/content/carousels`).then(r => r.json()).catch(() => null),
      ])
      setScripts(scriptsRes?.data || null)
      setSeo(seoRes?.data || null)
      setImages(imagesRes?.data || null)
      setCarousels(carouselsRes?.data || null)
      setLoading(false)
    }
    load()
  }, [])

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'scripts', label: 'Scripts', icon: FileText, count: scripts?.total_scripts || scripts?.scripts?.length },
    { id: 'seo', label: 'SEO & Hashtags', icon: Hash, count: seo?.optimizations?.length },
    { id: 'images', label: 'Imagenes', icon: Image, count: images?.total_images || images?.images_generated?.length },
    { id: 'carousels', label: 'Carruseles', icon: Layers, count: carousels?.total_carousels || carousels?.carousels?.length },
  ]

  // Download handlers
  function handleDownloadAllScripts() {
    if (!scripts?.scripts) return
    const all = scripts.scripts.map((s: any) => [
      `═══ ${s.slot_id} — ${s.platform} ${s.content_type} (${s.language}) ═══`,
      s.hook ? `\nHOOK: ${s.hook}` : '',
      s.script_body ? `\nGUION:\n${s.script_body}` : '',
      s.cta ? `\nCTA: ${s.cta}` : '',
      s.caption ? `\nCAPTION:\n${s.caption}` : '',
      s.visual_notes ? `\nNOTAS VISUALES: ${s.visual_notes}` : '',
      '\n'
    ].filter(Boolean).join('\n')).join('\n\n')
    downloadText('all_scripts.txt', all)
  }

  function handleDownloadSEO() {
    if (!seo?.optimizations) return
    const headers = ['slot_id', 'platform', 'language', 'title', 'primary_hashtags', 'secondary_hashtags', 'long_tail', 'branded', 'trending', 'keywords']
    const rows = seo.optimizations.map((opt: any) => [
      opt.slot_id || '',
      opt.platform || '',
      opt.language || '',
      opt.optimized_title || '',
      (opt.hashtags?.primary || []).join(' '),
      (opt.hashtags?.secondary || []).join(' '),
      (opt.hashtags?.long_tail || []).join(' '),
      (opt.hashtags?.branded || []).join(' '),
      (opt.hashtags?.trending || []).join(' '),
      (opt.keywords || []).join(', '),
    ])
    downloadCSV('seo_optimizations.csv', headers, rows)
  }

  function handleDownloadImages() {
    if (!images) return
    downloadJSON('images_report.json', images)
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content</h1>
        <p className="text-sm text-gray-500 mt-1">
          Todo el contenido generado (Fases 3 y 4: Copywriter, SEO, Visual Designer, Carousel Creator)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-brand-blue text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
        </div>
      )}

      {/* ── Scripts Tab ── */}
      {!loading && tab === 'scripts' && (
        <div>
          {scripts?.scripts && scripts.scripts.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">{scripts.total_scripts || scripts.scripts.length} scripts generados</p>
                <button onClick={handleDownloadAllScripts} className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-brand-blue/80 font-medium">
                  <Download className="w-3.5 h-3.5" /> Descargar todos
                </button>
              </div>
              {scripts.scripts.map((s: any, i: number) => (
                <ScriptCard key={s.slot_id || i} script={s} />
              ))}
            </div>
          ) : (
            <EmptyState text="No hay scripts generados aun. Ejecuta la Fase 3 del pipeline." icon={FileText} />
          )}
        </div>
      )}

      {/* ── SEO Tab ── */}
      {!loading && tab === 'seo' && (
        <div>
          {seo?.optimizations && seo.optimizations.length > 0 ? (
            <div className="space-y-6">
              {/* Download button */}
              <div className="flex justify-end">
                <button onClick={handleDownloadSEO} className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-brand-blue/80 font-medium">
                  <Download className="w-3.5 h-3.5" /> Descargar CSV
                </button>
              </div>

              {/* Keyword Opportunities */}
              {seo.keyword_opportunities && seo.keyword_opportunities.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Oportunidades de Keywords</h3>
                  <div className="space-y-2">
                    {seo.keyword_opportunities.map((kw: any, i: number) => {
                      if (typeof kw === 'string') {
                        return <span key={i} className="inline-block text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium mr-2">{kw}</span>
                      }
                      // Object format: {keyword, volume, competition, opportunity_score, platforms, notes}
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                          <span className="text-sm font-semibold text-blue-800 min-w-0 flex-1">{kw.keyword || ''}</span>
                          {kw.opportunity_score != null && (
                            <span className="flex items-center gap-1 text-xs font-bold text-blue-600">
                              <TrendingUp className="w-3 h-3" />
                              {kw.opportunity_score}
                            </span>
                          )}
                          {kw.volume && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              kw.volume === 'high' ? 'bg-green-100 text-green-700' : kw.volume === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                            }`}>{kw.volume}</span>
                          )}
                          {kw.competition && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              kw.competition === 'low' ? 'bg-green-100 text-green-700' : kw.competition === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>{kw.competition}</span>
                          )}
                          {kw.platforms && Array.isArray(kw.platforms) && (
                            <div className="flex gap-1">
                              {kw.platforms.map((p: string, j: number) => (
                                <span key={j} className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">{p}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Trending Hashtags by Platform */}
              {seo.trending_hashtags_by_platform && Object.keys(seo.trending_hashtags_by_platform).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hashtags Trending por Plataforma</h3>
                  <div className="space-y-4">
                    {Object.entries(seo.trending_hashtags_by_platform).map(([platform, data]: [string, any]) => (
                      <div key={platform}>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformBgColors[platform] || 'bg-gray-500'} capitalize`}>
                          {platform}
                        </span>
                        <div className="mt-2 space-y-1.5">
                          {typeof data === 'object' && !Array.isArray(data) ? (
                            // Nested categories: { high_volume: [...], trending: [...], ... }
                            Object.entries(data).map(([category, tags]: [string, any]) => (
                              <div key={category} className="flex flex-wrap items-start gap-1">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase w-28 flex-shrink-0 pt-0.5">{category.replace(/_/g, ' ')}</span>
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(tags) ? tags.map((t: any, i: number) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">{typeof t === 'string' ? t : String(t)}</span>
                                  )) : (
                                    <span className="text-xs text-gray-400">{String(tags)}</span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : Array.isArray(data) ? (
                            // Simple array
                            <div className="flex flex-wrap gap-1">
                              {data.map((t: any, i: number) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">{typeof t === 'string' ? t : String(t)}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEO Best Practices */}
              {seo.seo_best_practices && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mejores Practicas SEO</h3>
                  <div className="space-y-2">
                    {Object.entries(seo.seo_best_practices).map(([key, val]: [string, any]) => (
                      <div key={key}>
                        <span className="text-xs font-semibold text-gray-700 capitalize">{key.replace(/_/g, ' ')}: </span>
                        {typeof val === 'string' ? (
                          <span className="text-xs text-gray-600">{val}</span>
                        ) : typeof val === 'object' ? (
                          <div className="mt-1 pl-3 space-y-1">
                            {Object.entries(val).map(([k2, v2]: [string, any]) => (
                              <div key={k2} className="text-xs">
                                <span className="font-medium text-gray-500 capitalize">{k2.replace(/_/g, ' ')}: </span>
                                <span className="text-gray-600">{typeof v2 === 'string' ? v2 : JSON.stringify(v2)}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-slot optimizations */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Optimizaciones por Post ({seo.optimizations.length})</h3>
                {seo.optimizations.map((opt: any, i: number) => (
                  <div key={opt.slot_id || i} className={`bg-white rounded-lg border border-gray-200 border-l-4 ${platformColors[opt.platform || ''] || 'border-l-gray-300'} shadow-sm p-4`}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {opt.platform && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformBgColors[opt.platform] || 'bg-gray-500'}`}>
                          {platformLabels[opt.platform] || opt.platform}
                        </span>
                      )}
                      {opt.content_type && <span className="text-xs px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue">{opt.content_type}</span>}
                      {opt.language && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{(opt.language || '').toUpperCase()}</span>}
                      <span className="text-xs text-gray-400">{opt.slot_id}</span>
                    </div>

                    {opt.optimized_title && (
                      <p className="text-sm font-medium text-gray-900 mb-1">{opt.optimized_title}</p>
                    )}
                    {opt.optimized_description && (
                      <div className="text-xs text-gray-600 mb-3 whitespace-pre-wrap max-h-32 overflow-y-auto bg-gray-50 p-2 rounded">{opt.optimized_description}</div>
                    )}

                    <HashtagGroup label="Primary" tags={opt.hashtags?.primary} color="bg-blue-100 text-blue-700" />
                    <HashtagGroup label="Secondary" tags={opt.hashtags?.secondary} color="bg-purple-100 text-purple-700" />
                    <HashtagGroup label="Long-tail" tags={opt.hashtags?.long_tail} color="bg-green-100 text-green-700" />
                    <HashtagGroup label="Branded" tags={opt.hashtags?.branded} color="bg-amber-100 text-amber-700" />
                    <HashtagGroup label="Trending" tags={opt.hashtags?.trending} color="bg-pink-100 text-pink-700" />

                    {opt.keywords && opt.keywords.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-semibold text-gray-500">Keywords: </span>
                        <span className="text-xs text-gray-600">{(Array.isArray(opt.keywords) ? opt.keywords : []).join(', ')}</span>
                      </div>
                    )}

                    {opt.alt_text && (
                      <div className="mt-2">
                        <span className="text-xs font-semibold text-gray-500">Alt Text: </span>
                        <span className="text-xs text-gray-500 italic">{opt.alt_text}</span>
                      </div>
                    )}

                    {opt.seo_notes && (
                      <div className="mt-2">
                        <span className="text-xs font-semibold text-gray-500">Notas SEO: </span>
                        <span className="text-xs text-gray-500">{opt.seo_notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState text="No hay datos de SEO aun. Ejecuta la Fase 3 del pipeline." icon={Hash} />
          )}
        </div>
      )}

      {/* ── Images Tab ── */}
      {!loading && tab === 'images' && (
        <div>
          {images?.images_generated && images.images_generated.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">
                  {images.total_images || images.images_generated.length} imagenes generadas
                  {images.failed && images.failed.length > 0 && ` | ${images.failed.length} fallidas`}
                  {images.summary?.ab_variants_created ? ` | ${images.summary.ab_variants_created} variantes A/B` : ''}
                </p>
                <button onClick={handleDownloadImages} className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-brand-blue/80 font-medium">
                  <Download className="w-3.5 h-3.5" /> Descargar reporte JSON
                </button>
              </div>

              {/* Brand compliance summary */}
              {images.summary?.brand_compliance && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Brand Compliance</h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    {images.summary.brand_compliance.colors_used && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Colores:</span>
                        <div className="flex gap-1">
                          {(images.summary.brand_compliance.colors_used as string[]).map((c: string, i: number) => (
                            <div key={i} className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: c }} />
                              <span className="text-[10px] text-gray-400">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {images.summary.brand_compliance.typography && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Tipografia:</span>
                        <span className="text-xs font-medium text-gray-700">{images.summary.brand_compliance.typography}</span>
                      </div>
                    )}
                    {images.summary.brand_compliance.style && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Estilo:</span>
                        <span className="text-xs text-gray-700">{images.summary.brand_compliance.style}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.images_generated.map((img: any, i: number) => {
                  const imgSrc = img.url ? `${BACKEND}${img.url}` : null
                  return (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
                      {/* Image preview */}
                      <div className="relative">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={img.content || img.type || 'Generated image'}
                            className="w-full h-44 object-cover bg-gray-50"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
                          />
                        ) : null}
                        {/* Fallback placeholder (shown if no url or image fails to load) */}
                        <div className={`${imgSrc ? 'hidden' : ''} w-full h-44 flex flex-col items-center justify-center ${
                          img.platform === 'instagram' ? 'bg-gradient-to-br from-pink-100 to-purple-100' :
                          img.platform === 'tiktok' ? 'bg-gradient-to-br from-gray-100 to-gray-200' :
                          img.platform === 'linkedin' ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
                          img.platform === 'youtube' ? 'bg-gradient-to-br from-red-50 to-red-100' :
                          img.platform === 'facebook' ? 'bg-gradient-to-br from-blue-50 to-indigo-100' :
                          'bg-gray-100'
                        }`}>
                          <Eye className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-[10px] text-gray-500 px-2 text-center">{img.content || img.type || 'image'}</span>
                          <span className="text-[10px] text-gray-400">{img.dimensions}</span>
                        </div>
                        {/* Platform badge */}
                        {img.platform && (
                          <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${platformBgColors[img.platform] || 'bg-gray-500'}`}>
                            {platformLabels[img.platform] || img.platform}
                          </span>
                        )}
                        {/* Status */}
                        <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${img.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {/* Download overlay */}
                        {imgSrc && (
                          <a
                            href={imgSrc}
                            download={img.filename || 'image.png'}
                            className="absolute bottom-2 right-2 bg-white/90 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                            title="Descargar imagen"
                          >
                            <Download className="w-3.5 h-3.5 text-gray-600" />
                          </a>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-gray-700 mb-0.5">{(img.type || 'image').replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-gray-400 truncate">{img.filename || img.slot_id}</p>
                        {img.dimensions && <p className="text-[10px] text-gray-300">{img.dimensions}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Content themes */}
              {images.summary?.content_themes && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mt-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Temas de Contenido Visual</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(images.summary.content_themes as string[]).map((t: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-gray-600">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState text="No hay imagenes generadas aun. Ejecuta la Fase 4 del pipeline." icon={Image} />
          )}
        </div>
      )}

      {/* ── Carousels Tab ── */}
      {!loading && tab === 'carousels' && (
        <div>
          {carousels?.carousels && carousels.carousels.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-3">
                {carousels.total_carousels || carousels.carousels.length} carruseles | {carousels.total_slides_generated || 0} slides totales
              </p>
              {carousels.carousels.map((carousel: any, i: number) => (
                <div key={carousel.slot_id || i} className={`bg-white rounded-lg border border-gray-200 border-l-4 ${platformColors[carousel.platform || ''] || 'border-l-gray-300'} shadow-sm p-4`}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {carousel.platform && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformBgColors[carousel.platform] || 'bg-gray-500'}`}>
                        {platformLabels[carousel.platform] || carousel.platform}
                      </span>
                    )}
                    {carousel.language && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{(carousel.language || '').toUpperCase()}</span>}
                    <span className="text-xs text-gray-400">{carousel.slot_id}</span>
                    <span className="text-xs font-semibold text-gray-700 ml-auto">{carousel.total_slides || 0} slides</span>
                  </div>

                  {carousel.title && <p className="text-sm font-medium text-gray-900 mb-2">{carousel.title}</p>}

                  {carousel.slides && carousel.slides.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {carousel.slides.map((slide: any, j: number) => {
                        const slideSrc = slide.url ? `${BACKEND}${slide.url}` : null
                        return (
                          <div key={j} className={`flex-shrink-0 w-32 rounded-lg border overflow-hidden group ${
                            slide.type === 'cover' ? 'border-brand-blue/30' :
                            slide.type === 'cta' ? 'border-amber-300' :
                            'border-gray-200'
                          }`}>
                            {/* Slide image */}
                            {slideSrc ? (
                              <div className="relative">
                                <img
                                  src={slideSrc}
                                  alt={slide.description || `Slide ${slide.slide_number}`}
                                  className="w-full h-32 object-cover bg-gray-50"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
                                />
                                <div className="hidden w-full h-32 flex flex-col items-center justify-center bg-gray-50">
                                  <Layers className="w-4 h-4 text-gray-300" />
                                </div>
                                <a
                                  href={slideSrc}
                                  download={slide.filename || `slide_${slide.slide_number}.png`}
                                  className="absolute bottom-1 right-1 bg-white/90 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Descargar slide"
                                >
                                  <Download className="w-3 h-3 text-gray-500" />
                                </a>
                              </div>
                            ) : (
                              <div className={`w-full h-32 flex flex-col items-center justify-center ${
                                slide.type === 'cover' ? 'bg-brand-blue/5' :
                                slide.type === 'cta' ? 'bg-amber-50' :
                                'bg-gray-50'
                              }`}>
                                <Layers className="w-4 h-4 text-gray-400" />
                                <span className="text-[10px] text-gray-400 mt-1">#{slide.slide_number}</span>
                              </div>
                            )}
                            {/* Slide info */}
                            <div className="p-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-500">#{slide.slide_number}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${slide.status === 'success' ? 'bg-green-500' : 'bg-gray-300'}`} />
                              </div>
                              {slide.type && <p className="text-[10px] text-gray-500 capitalize">{slide.type}</p>}
                              {slide.description && <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-2">{slide.description}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No hay carruseles generados aun. Ejecuta la Fase 4 del pipeline." icon={Layers} />
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ text, icon: Icon }: { text: string; icon: any }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <Icon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
