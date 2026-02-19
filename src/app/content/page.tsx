'use client'

import { useState, useEffect } from 'react'
import { FileText, Hash, Image, Layers, Loader2, ChevronDown, ChevronUp, Clock, Type } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

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

interface SEOOptimization {
  slot_id: string
  platform?: string
  hashtags?: {
    primary?: string[]
    secondary?: string[]
    long_tail?: string[]
    branded?: string[]
  }
  optimized_title?: string
  optimized_description?: string
  alt_text?: string
  keywords?: string[]
}

interface GeneratedImage {
  slot_id?: string
  filename?: string
  type?: string
  dimensions?: string
  status?: string
}

interface CarouselSlide {
  slide_number?: number
  filename?: string
  status?: string
}

interface Carousel {
  slot_id?: string
  platform?: string
  total_slides?: number
  slides?: CarouselSlide[]
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

// ── Sub-components ──

function ScriptCard({ script }: { script: Script }) {
  const [expanded, setExpanded] = useState(false)
  const border = platformColors[script.platform] || 'border-l-gray-300'

  return (
    <div className={`bg-white rounded-lg border border-gray-200 border-l-4 ${border} shadow-sm`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformBgColors[script.platform] || 'bg-gray-500'}`}>
                {platformLabels[script.platform] || script.platform}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue">{script.content_type}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{script.language?.toUpperCase()}</span>
              {script.word_count && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Type className="w-3 h-3" /> {script.word_count}w
                </span>
              )}
              {script.estimated_duration_seconds && (
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
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
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
          <span key={i} className={`text-xs px-2 py-0.5 rounded ${color}`}>{t}</span>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('scripts')
  const [scripts, setScripts] = useState<{ scripts: Script[]; total_scripts?: number } | null>(null)
  const [seo, setSeo] = useState<{ optimizations?: SEOOptimization[]; keyword_opportunities?: string[]; trending_hashtags_by_platform?: Record<string, string[]> } | null>(null)
  const [images, setImages] = useState<{ images_generated?: GeneratedImage[]; total_images?: number; failed?: any[] } | null>(null)
  const [carousels, setCarousels] = useState<{ carousels?: Carousel[]; total_carousels?: number; total_slides_generated?: number } | null>(null)
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
    { id: 'images', label: 'Imagenes', icon: Image, count: images?.total_images },
    { id: 'carousels', label: 'Carruseles', icon: Layers, count: carousels?.total_carousels },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content</h1>
        <p className="text-sm text-gray-500 mt-1">
          Todo el contenido generado (Fases 3 y 4: Copywriter, SEO, Visual Designer, Carousel Creator)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
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
            {t.count !== undefined && t.count > 0 && (
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
              <p className="text-xs text-gray-400 mb-3">{scripts.total_scripts || scripts.scripts.length} scripts generados</p>
              {scripts.scripts.map((s, i) => (
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
              {/* Keyword Opportunities */}
              {seo.keyword_opportunities && seo.keyword_opportunities.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Oportunidades de Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {seo.keyword_opportunities.map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Hashtags */}
              {seo.trending_hashtags_by_platform && Object.keys(seo.trending_hashtags_by_platform).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hashtags Trending por Plataforma</h3>
                  <div className="space-y-3">
                    {Object.entries(seo.trending_hashtags_by_platform).map(([platform, tags]) => (
                      <div key={platform}>
                        <span className="text-xs font-semibold text-gray-700 capitalize">{platform}: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(tags as string[]).map((t, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-slot optimizations */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Optimizaciones por Post</h3>
                {seo.optimizations.map((opt, i) => (
                  <div key={opt.slot_id || i} className={`bg-white rounded-lg border border-gray-200 border-l-4 ${platformColors[opt.platform || ''] || 'border-l-gray-300'} shadow-sm p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      {opt.platform && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformBgColors[opt.platform] || 'bg-gray-500'}`}>
                          {platformLabels[opt.platform] || opt.platform}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{opt.slot_id}</span>
                    </div>

                    {opt.optimized_title && (
                      <p className="text-sm font-medium text-gray-900 mb-2">{opt.optimized_title}</p>
                    )}
                    {opt.optimized_description && (
                      <p className="text-xs text-gray-600 mb-3">{opt.optimized_description}</p>
                    )}

                    <HashtagGroup label="Primary" tags={opt.hashtags?.primary} color="bg-blue-100 text-blue-700" />
                    <HashtagGroup label="Secondary" tags={opt.hashtags?.secondary} color="bg-purple-100 text-purple-700" />
                    <HashtagGroup label="Long-tail" tags={opt.hashtags?.long_tail} color="bg-green-100 text-green-700" />
                    <HashtagGroup label="Branded" tags={opt.hashtags?.branded} color="bg-amber-100 text-amber-700" />

                    {opt.keywords && opt.keywords.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-semibold text-gray-500">Keywords: </span>
                        <span className="text-xs text-gray-600">{opt.keywords.join(', ')}</span>
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
              <p className="text-xs text-gray-400 mb-3">
                {images.total_images || images.images_generated.length} imagenes generadas
                {images.failed && images.failed.length > 0 && ` | ${images.failed.length} fallidas`}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {images.images_generated.map((img, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <Image className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${img.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs font-medium text-gray-700">{img.type || 'image'}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{img.filename || img.slot_id}</p>
                    {img.dimensions && <p className="text-xs text-gray-400">{img.dimensions}</p>}
                  </div>
                ))}
              </div>
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
              {carousels.carousels.map((carousel, i) => (
                <div key={carousel.slot_id || i} className={`bg-white rounded-lg border border-gray-200 border-l-4 ${platformColors[carousel.platform || ''] || 'border-l-gray-300'} shadow-sm p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    {carousel.platform && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformBgColors[carousel.platform] || 'bg-gray-500'}`}>
                        {platformLabels[carousel.platform] || carousel.platform}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{carousel.slot_id}</span>
                    <span className="text-xs font-semibold text-gray-700 ml-auto">{carousel.total_slides || 0} slides</span>
                  </div>

                  {carousel.slides && carousel.slides.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {carousel.slides.map((slide, j) => (
                        <div key={j} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                          <Layers className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-0.5">#{slide.slide_number}</span>
                          <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${slide.status === 'success' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                      ))}
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
