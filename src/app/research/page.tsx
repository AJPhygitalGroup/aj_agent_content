'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Search, TrendingUp, Zap, Eye, Loader2, Flame } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

type Tab = 'trends' | 'viral'

const platformEmoji: Record<string, string> = {
  instagram: '📸', tiktok: '🎵', linkedin: '💼', youtube: '🎬', facebook: '📘', google: '🔍',
}

function ScoreBadge({ score }: { score?: number }) {
  if (!score && score !== 0) return null
  const pct = typeof score === 'number' && score <= 1 ? Math.round(score * 100) : Math.round(score)
  const color = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>
}

export default function ResearchPage() {
  const [tab, setTab] = useState<Tab>('trends')
  const [trends, setTrends] = useState<any>(null)
  const [viral, setViral] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [trendsRes, viralRes] = await Promise.all([
        fetch(`${BACKEND}/api/content/trends`).then(r => r.json()).catch(() => null),
        fetch(`${BACKEND}/api/content/viral`).then(r => r.json()).catch(() => null),
      ])
      setTrends(trendsRes?.data || null)
      setViral(viralRes?.data || null)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Research</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tendencias del mercado y analisis de contenido viral (Fase 1: Trend Researcher + Viral Analyzer)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('trends')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'trends' ? 'bg-brand-blue text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Tendencias
        </button>
        <button
          onClick={() => setTab('viral')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'viral' ? 'bg-brand-purple text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Flame className="w-4 h-4" /> Analisis Viral
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
        </div>
      )}

      {/* ── Trends Tab ── */}
      {!loading && tab === 'trends' && (
        <div>
          {trends ? (
            <TrendsContent data={trends} />
          ) : (
            <EmptyState text="No hay datos de tendencias aun. Ejecuta la Fase 1 del pipeline." />
          )}
        </div>
      )}

      {/* ── Viral Analysis Tab ── */}
      {!loading && tab === 'viral' && (
        <div>
          {viral ? (
            <ViralContent data={viral} />
          ) : (
            <EmptyState text="No hay datos de analisis viral aun. Ejecuta la Fase 1 del pipeline." />
          )}
        </div>
      )}
    </div>
  )
}

// ── Trends Content ──────────────────────────────────────────
function TrendsContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {data.generation_date && (
        <p className="text-xs text-gray-400">Generado: {data.generation_date}</p>
      )}

      {/* Nicho Summary */}
      {data.nicho_relevance_summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resumen de Relevancia al Nicho</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{data.nicho_relevance_summary}</p>
        </div>
      )}

      {/* Recommended Topics */}
      {Array.isArray(data.recommended_topics) && data.recommended_topics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Temas Recomendados</h3>
          <div className="space-y-2">
            {data.recommended_topics.map((topic: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-gradient text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700">{typeof topic === 'string' ? topic : topic.topic || JSON.stringify(topic)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Trends */}
      {Array.isArray(data.platform_trends) && data.platform_trends.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tendencias por Plataforma</h3>
          {data.platform_trends.map((pt: any) => (
            <div key={pt.platform} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{platformEmoji[pt.platform] || '📱'}</span>
                <h4 className="text-sm font-bold text-gray-900 capitalize">{pt.platform}</h4>
                <span className="text-xs text-gray-400">{pt.trends?.length || 0} tendencias</span>
              </div>
              <div className="space-y-2">
                {(pt.trends || []).map((trend: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{trend.topic}</span>
                        <ScoreBadge score={trend.relevance_score} />
                        {trend.engagement_level && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">{trend.engagement_level}</span>
                        )}
                      </div>
                      {trend.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{trend.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Trends */}
      {Array.isArray(data.top_global_trends) && data.top_global_trends.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tendencias Globales</h3>
          <div className="grid grid-cols-2 gap-2">
            {data.top_global_trends.map((trend: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <Zap className="w-3 h-3 text-brand-blue flex-shrink-0" />
                <span className="text-xs text-gray-700">{trend.topic || (typeof trend === 'string' ? trend : JSON.stringify(trend))}</span>
                <ScoreBadge score={trend.relevance_score} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Viral Content ───────────────────────────────────────────
function ViralContent({ data }: { data: any }) {
  // All sub-sections live either at data.X or data.patterns_detected.X
  const p = data.patterns_detected || {}
  const get = (key: string) => data[key] || p[key]

  return (
    <div className="space-y-6">
      {/* Campaign Context */}
      {data.campaign_context && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contexto de Campana</h3>
          {typeof data.campaign_context === 'string' ? (
            <p className="text-sm text-gray-700">{data.campaign_context}</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.campaign_context).map(([k, v]: [string, any]) => (
                <div key={k}>
                  <span className="text-xs font-bold text-gray-600 uppercase">{k.replace(/_/g, ' ')}: </span>
                  <span className="text-sm text-gray-700">{typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Viral Content Analyzed */}
      {Array.isArray(data.viral_content_analyzed) && data.viral_content_analyzed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Contenido Viral Analizado ({data.viral_content_analyzed.length})
          </h3>
          {data.viral_content_analyzed.map((item: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{platformEmoji[item.platform || ''] || '📱'}</span>
                <span className="text-sm font-bold text-gray-900 capitalize">{item.platform}</span>
                {item.estimated_views && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye className="w-3 h-3" /> {item.estimated_views}
                  </span>
                )}
                {item.engagement_rate && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{item.engagement_rate}</span>
                )}
                {item.replicability_score != null && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Replicabilidad: {typeof item.replicability_score === 'number' && item.replicability_score <= 1
                      ? Math.round(item.replicability_score * 100) + '%'
                      : item.replicability_score + '/10'}
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-gray-800 mb-2">{item.topic}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {item.hook_type && (
                  <div className="p-2 rounded bg-purple-50">
                    <span className="font-semibold text-purple-700">Hook: </span>
                    <span className="text-purple-600">{item.hook_type}</span>
                  </div>
                )}
                {item.hook_duration && (
                  <div className="p-2 rounded bg-purple-50">
                    <span className="font-semibold text-purple-700">Duracion hook: </span>
                    <span className="text-purple-600">{item.hook_duration}</span>
                  </div>
                )}
                {item.tone && (
                  <div className="p-2 rounded bg-blue-50">
                    <span className="font-semibold text-blue-700">Tono: </span>
                    <span className="text-blue-600">{item.tone}</span>
                  </div>
                )}
                {item.format && (
                  <div className="p-2 rounded bg-green-50">
                    <span className="font-semibold text-green-700">Formato: </span>
                    <span className="text-green-600">{item.format}</span>
                  </div>
                )}
                {item.music && (
                  <div className="p-2 rounded bg-pink-50">
                    <span className="font-semibold text-pink-700">Musica: </span>
                    <span className="text-pink-600">{item.music}</span>
                  </div>
                )}
                {item.cta_type && (
                  <div className="p-2 rounded bg-amber-50">
                    <span className="font-semibold text-amber-700">CTA: </span>
                    <span className="text-amber-600">{item.cta_type}</span>
                  </div>
                )}
              </div>

              {item.script_structure && (
                <div className="mt-2 p-2 rounded bg-amber-50 text-xs">
                  <span className="font-semibold text-amber-700">Estructura: </span>
                  <span className="text-amber-600">{item.script_structure}</span>
                </div>
              )}

              {item.hook_text && (
                <div className="mt-2 p-2 rounded bg-gray-50 text-xs">
                  <span className="font-semibold text-gray-600">Hook text: </span>
                  <span className="text-gray-700 italic">&ldquo;{item.hook_text}&rdquo;</span>
                </div>
              )}

              {Array.isArray(item.visual_elements) && item.visual_elements.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.visual_elements.map((el: string, j: number) => (
                    <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{el}</span>
                  ))}
                </div>
              )}

              {item.key_takeaway && (
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-semibold">Takeaway: </span>{item.key_takeaway}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top Performing Hooks */}
      {Array.isArray(get('top_performing_hooks')) && get('top_performing_hooks').length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Hooks</h3>
          <div className="space-y-2">
            {get('top_performing_hooks').map((h: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-purple-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-purple-800">{h.type || (typeof h === 'string' ? h : '')}</span>
                  {h.effectiveness && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{h.effectiveness}</span>}
                </div>
                {Array.isArray(h.examples) && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {h.examples.map((ex: string, j: number) => (
                      <span key={j} className="text-xs px-2 py-1 rounded bg-white text-purple-600 italic">&ldquo;{ex}&rdquo;</span>
                    ))}
                  </div>
                )}
                {Array.isArray(h.best_platforms) && (
                  <div className="flex gap-1 mt-1">
                    {h.best_platforms.map((pl: string, j: number) => (
                      <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{platformEmoji[pl] || ''} {pl}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Winning Structures — per-platform script structures */}
      {Array.isArray(get('winning_structures')) && get('winning_structures').length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Estructuras de Guion Ganadoras</h3>
          <div className="space-y-3">
            {get('winning_structures').map((s: any, i: number) => (
              <div key={i} className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{platformEmoji[s.platform || ''] || '📱'}</span>
                  <span className="text-sm font-bold text-amber-900 capitalize">{s.platform}</span>
                </div>
                <p className="text-xs text-amber-800 font-mono leading-relaxed">{s.structure}</p>
                {Array.isArray(s.key_elements) && s.key_elements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.key_elements.map((el: string, j: number) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded bg-white text-amber-700 border border-amber-200">{el}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Elements That Work */}
      {Array.isArray(get('visual_elements_that_work')) && get('visual_elements_that_work').length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Elementos Visuales que Funcionan</h3>
          <div className="space-y-2">
            {get('visual_elements_that_work').map((v: any, i: number) => {
              const effColors: Record<string, string> = {
                very_high: 'bg-green-100 text-green-700',
                high: 'bg-blue-100 text-blue-700',
                medium_high: 'bg-yellow-100 text-yellow-700',
                medium: 'bg-gray-100 text-gray-600',
              }
              return (
                <div key={i} className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-indigo-800">{(v.element || '').replace(/_/g, ' ')}</span>
                    {v.effectiveness && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${effColors[v.effectiveness] || 'bg-gray-100 text-gray-600'}`}>
                        {v.effectiveness.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {v.use_case && <p className="text-xs text-indigo-600 mt-0.5">{v.use_case}</p>}
                  {Array.isArray(v.platforms) && (
                    <div className="flex gap-1 mt-1">
                      {v.platforms.map((pl: string, j: number) => (
                        <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-white text-indigo-600">
                          {platformEmoji[pl] || ''} {pl === 'all' ? 'Todas' : pl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Engagement Drivers */}
      {Array.isArray(get('engagement_drivers')) && get('engagement_drivers').length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Drivers de Engagement</h3>
          <div className="space-y-2">
            {get('engagement_drivers').map((d: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium text-green-800">
                  {typeof d === 'string' ? d : d.driver || d.name || d.type || JSON.stringify(d)}
                </span>
                {d.description && <p className="text-xs text-green-600 mt-0.5">{d.description}</p>}
                {d.impact && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 ml-2">{d.impact}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Hooks by Platform */}
      <HooksByPlatform hooks={get('top_hooks_by_platform')} />

      {/* Winning Formats by Platform */}
      <FormatsByPlatform formats={get('winning_formats_by_platform')} />

      {/* Trending Audio/Music */}
      {get('trending_audio_music') && (
        <GenericSection title="Audio y Musica Trending" data={get('trending_audio_music')} color="pink" />
      )}

      {/* Cultural Adaptations */}
      {get('cultural_adaptations') && (
        <GenericSection title="Adaptaciones Culturales" data={get('cultural_adaptations')} color="amber" />
      )}

      {/* Recommendations */}
      {Array.isArray(get('recommendations')) && get('recommendations').length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recomendaciones</h3>
          <div className="space-y-3">
            {get('recommendations').map((r: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">
                    {typeof r === 'string' ? r : r.recommendation || r.title || JSON.stringify(r)}
                  </span>
                  {r.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.priority === 'high' ? 'bg-red-100 text-red-700' : r.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}>{r.priority}</span>
                  )}
                  {r.category && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{r.category.replace(/_/g, ' ')}</span>
                  )}
                </div>
                {r.rationale && <p className="text-xs text-gray-600 ml-4">{r.rationale}</p>}
                {r.implementation && <p className="text-xs text-blue-600 ml-4 mt-0.5 italic">{r.implementation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Insights */}
      {get('competitive_insights') && (
        <GenericSection title="Insights Competitivos" data={get('competitive_insights')} color="purple" />
      )}

      {/* KPI Tracking */}
      {get('kpi_tracking') && (
        <GenericSection title="KPIs de Seguimiento" data={get('kpi_tracking')} color="blue" />
      )}

      {/* Content Calendar Suggestions */}
      {get('content_calendar_suggestions') && (
        <GenericSection title="Sugerencias para Calendario" data={get('content_calendar_suggestions')} color="green" />
      )}
    </div>
  )
}

// ── Hooks by Platform ───────────────────────────────────────
function HooksByPlatform({ hooks }: { hooks: any }) {
  if (!hooks || typeof hooks !== 'object') return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hooks Ganadores por Plataforma</h3>
      <div className="space-y-4">
        {Object.entries(hooks).map(([platform, items]: [string, any]) => (
          <div key={platform}>
            <div className="flex items-center gap-2 mb-2">
              <span>{platformEmoji[platform] || '📱'}</span>
              <span className="text-sm font-semibold text-gray-800 capitalize">{platform}</span>
            </div>
            <div className="space-y-1 ml-6">
              {Array.isArray(items) ? items.map((h: any, i: number) => (
                <div key={i} className="p-2 rounded bg-purple-50 text-xs text-purple-700">
                  {typeof h === 'string' ? h : h.template || h.type || JSON.stringify(h)}
                </div>
              )) : typeof items === 'object' ? Object.entries(items).map(([k, v]: [string, any]) => (
                <div key={k} className="p-2 rounded bg-purple-50 text-xs">
                  <span className="font-semibold text-purple-700 capitalize">{k.replace(/_/g, ' ')}: </span>
                  <span className="text-purple-600">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                </div>
              )) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Formats by Platform ─────────────────────────────────────
function FormatsByPlatform({ formats }: { formats: any }) {
  if (!formats || typeof formats !== 'object') return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Formatos Ganadores por Plataforma</h3>
      <div className="space-y-4">
        {Object.entries(formats).map(([platform, fmt]: [string, any]) => (
          <div key={platform}>
            <div className="flex items-center gap-2 mb-2">
              <span>{platformEmoji[platform] || '📱'}</span>
              <span className="text-sm font-semibold text-gray-800 capitalize">{platform}</span>
            </div>
            <div className="ml-6">
              {Array.isArray(fmt) ? (
                <div className="space-y-1">
                  {fmt.map((f: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-green-50 text-xs text-green-700">
                      {typeof f === 'string' ? f : f.format || JSON.stringify(f)}
                    </div>
                  ))}
                </div>
              ) : typeof fmt === 'object' ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(fmt).map(([k, v]: [string, any]) => (
                    <div key={k} className="p-2 rounded bg-green-50 text-xs">
                      <span className="font-semibold text-green-700 capitalize">{k.replace(/_/g, ' ')}: </span>
                      <span className="text-green-600">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500">{String(fmt)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Generic Section — renders any nested object/array ───────
function GenericSection({ title, data, color }: { title: string; data: any; color: string }) {
  const bgColor = `bg-${color}-50`
  const textColor = `text-${color}-700`

  if (!data) return null

  // String
  if (typeof data === 'string') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
        <p className="text-sm text-gray-700">{data}</p>
      </div>
    )
  }

  // Array
  if (Array.isArray(data)) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
        <div className="space-y-2">
          {data.map((item: any, i: number) => (
            <div key={i} className={`p-2 rounded ${bgColor}`}>
              <span className={`text-xs ${textColor}`}>
                {typeof item === 'string' ? item : item.name || item.title || item.description || JSON.stringify(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Object
  if (typeof data === 'object') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data).map(([key, val]: [string, any]) => (
            <div key={key}>
              <span className="text-xs font-bold text-gray-600 uppercase">{key.replace(/_/g, ' ')}</span>
              {typeof val === 'string' ? (
                <p className="text-xs text-gray-700 mt-0.5 ml-2">{val}</p>
              ) : Array.isArray(val) ? (
                <div className="space-y-1 mt-1 ml-2">
                  {val.map((item: any, i: number) => (
                    <div key={i} className={`p-2 rounded ${bgColor}`}>
                      <span className={`text-xs ${textColor}`}>
                        {typeof item === 'string' ? item : item.name || item.title || item.metric || JSON.stringify(item)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : typeof val === 'object' && val !== null ? (
                <div className={`p-2 rounded mt-1 ml-2 ${bgColor}`}>
                  {Object.entries(val).map(([k2, v2]: [string, any]) => (
                    <div key={k2} className="text-xs mb-0.5">
                      <span className={`font-semibold ${textColor} capitalize`}>{k2.replace(/_/g, ' ')}: </span>
                      <span className="text-gray-600">{typeof v2 === 'string' ? v2 : JSON.stringify(v2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-700 mt-0.5 ml-2">{String(val)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
