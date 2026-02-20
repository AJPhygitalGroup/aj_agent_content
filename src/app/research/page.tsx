'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Zap, Eye, Loader2, Flame } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface TrendItem {
  topic: string
  relevance_score?: number
  engagement_level?: string
  platform?: string
  description?: string
}

interface PlatformTrend {
  platform: string
  trends: TrendItem[]
}

interface TrendReport {
  generation_date?: string
  platform_trends?: PlatformTrend[]
  top_global_trends?: TrendItem[]
  recommended_topics?: string[]
  nicho_relevance_summary?: string
}

interface ViralContent {
  platform?: string
  topic?: string
  hook_type?: string
  hook_text?: string
  tone?: string
  format?: string
  estimated_views?: string
  engagement_rate?: string
  script_structure?: string
  key_takeaway?: string
}

interface ViralAnalysis {
  viral_content_analyzed?: ViralContent[]
  patterns_detected?: string[]
  top_hooks_by_platform?: Record<string, string[]>
  winning_formats_by_platform?: Record<string, string[]>
  recommendations?: string[]
}

type Tab = 'trends' | 'viral'

const platformEmoji: Record<string, string> = {
  instagram: '📸', tiktok: '🎵', linkedin: '💼', youtube: '🎬', facebook: '📘', google: '🔍',
}

function ScoreBadge({ score }: { score?: number }) {
  if (!score) return null
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{pct}%</span>
}

export default function ResearchPage() {
  const [tab, setTab] = useState<Tab>('trends')
  const [trends, setTrends] = useState<TrendReport | null>(null)
  const [viral, setViral] = useState<ViralAnalysis | null>(null)
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
            <div className="space-y-6">
              {/* Date */}
              {trends.generation_date && (
                <p className="text-xs text-gray-400">Generado: {trends.generation_date}</p>
              )}

              {/* Nicho Summary */}
              {trends.nicho_relevance_summary && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resumen de Relevancia al Nicho</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{trends.nicho_relevance_summary}</p>
                </div>
              )}

              {/* Recommended Topics */}
              {trends.recommended_topics && trends.recommended_topics.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Temas Recomendados</h3>
                  <div className="space-y-2">
                    {trends.recommended_topics.map((topic, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-gradient text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Trends */}
              {trends.platform_trends && trends.platform_trends.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tendencias por Plataforma</h3>
                  {trends.platform_trends.map(pt => (
                    <div key={pt.platform} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{platformEmoji[pt.platform] || '📱'}</span>
                        <h4 className="text-sm font-bold text-gray-900 capitalize">{pt.platform}</h4>
                        <span className="text-xs text-gray-400">{pt.trends?.length || 0} tendencias</span>
                      </div>
                      <div className="space-y-2">
                        {(pt.trends || []).map((trend, i) => (
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
              {trends.top_global_trends && trends.top_global_trends.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tendencias Globales</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {trends.top_global_trends.map((trend, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <Zap className="w-3 h-3 text-brand-blue flex-shrink-0" />
                        <span className="text-xs text-gray-700">{trend.topic}</span>
                        <ScoreBadge score={trend.relevance_score} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState text="No hay datos de tendencias aun. Ejecuta la Fase 1 del pipeline." />
          )}
        </div>
      )}

      {/* ── Viral Analysis Tab ── */}
      {!loading && tab === 'viral' && (
        <div>
          {viral ? (
            <div className="space-y-6">
              {/* Viral Content Cards */}
              {viral.viral_content_analyzed && viral.viral_content_analyzed.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contenido Viral Analizado</h3>
                  {viral.viral_content_analyzed.map((item, i) => (
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
                      </div>

                      <p className="text-sm font-medium text-gray-800 mb-2">{item.topic}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {item.hook_type && (
                          <div className="p-2 rounded bg-purple-50">
                            <span className="font-semibold text-purple-700">Hook: </span>
                            <span className="text-purple-600">{item.hook_type}</span>
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
                        {item.script_structure && (
                          <div className="p-2 rounded bg-amber-50">
                            <span className="font-semibold text-amber-700">Estructura: </span>
                            <span className="text-amber-600">{item.script_structure}</span>
                          </div>
                        )}
                      </div>

                      {item.hook_text && (
                        <div className="mt-2 p-2 rounded bg-gray-50 text-xs">
                          <span className="font-semibold text-gray-600">Hook text: </span>
                          <span className="text-gray-700 italic">&ldquo;{item.hook_text}&rdquo;</span>
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

              {/* Patterns Detected */}
              {viral.patterns_detected && viral.patterns_detected.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Patrones Detectados</h3>
                  <div className="space-y-3">
                    {viral.patterns_detected.map((p: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-purple-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800">
                            {typeof p === 'string' ? p : p.pattern || p.description || JSON.stringify(p)}
                          </span>
                          {p.success_rate && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{p.success_rate}</span>
                          )}
                        </div>
                        {p.description && p.pattern && (
                          <p className="text-xs text-gray-600 ml-4">{p.description}</p>
                        )}
                        {p.key_elements && (
                          <div className="flex flex-wrap gap-1 ml-4 mt-1">
                            {(Array.isArray(p.key_elements) ? p.key_elements : []).map((el: string, j: number) => (
                              <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-white text-purple-600">{el}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Hooks by Platform */}
              {viral.top_hooks_by_platform && Object.keys(viral.top_hooks_by_platform).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hooks Ganadores por Plataforma</h3>
                  <div className="space-y-4">
                    {Object.entries(viral.top_hooks_by_platform).map(([platform, hooks]) => (
                      <div key={platform}>
                        <div className="flex items-center gap-2 mb-2">
                          <span>{platformEmoji[platform] || '📱'}</span>
                          <span className="text-sm font-semibold text-gray-800 capitalize">{platform}</span>
                        </div>
                        <div className="space-y-2 ml-6">
                          {(hooks as any[]).map((h: any, i: number) => (
                            <div key={i} className="p-2 rounded bg-purple-50">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-purple-700">
                                  {typeof h === 'string' ? h : h.type || h.hook_type || ''}
                                </span>
                                {h.success_rate && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{h.success_rate}</span>
                                )}
                              </div>
                              {h.template && (
                                <p className="text-xs text-purple-600 mt-0.5 italic">{h.template}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winning Formats */}
              {viral.winning_formats_by_platform && Object.keys(viral.winning_formats_by_platform).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Formatos Ganadores por Plataforma</h3>
                  <div className="space-y-4">
                    {Object.entries(viral.winning_formats_by_platform).map(([platform, formats]) => (
                      <div key={platform}>
                        <div className="flex items-center gap-2 mb-2">
                          <span>{platformEmoji[platform] || '📱'}</span>
                          <span className="text-sm font-semibold text-gray-800 capitalize">{platform}</span>
                        </div>
                        <div className="space-y-2 ml-6">
                          {(formats as any[]).map((f: any, i: number) => (
                            <div key={i} className="p-2 rounded bg-green-50">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-green-700">
                                  {typeof f === 'string' ? f : f.format || ''}
                                </span>
                                {f.optimal_duration && (
                                  <span className="text-xs text-gray-500">{f.optimal_duration}</span>
                                )}
                                {f.engagement_boost && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">+{f.engagement_boost}</span>
                                )}
                              </div>
                              {f.key_elements && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(Array.isArray(f.key_elements) ? f.key_elements : []).map((el: string, j: number) => (
                                    <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-white text-green-600">{el}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {viral.recommendations && viral.recommendations.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recomendaciones</h3>
                  <div className="space-y-3">
                    {viral.recommendations.map((r: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-blue-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800">
                            {typeof r === 'string' ? r : r.recommendation || JSON.stringify(r)}
                          </span>
                          {r.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              r.priority === 'high' ? 'bg-red-100 text-red-700' : r.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                            }`}>{r.priority}</span>
                          )}
                        </div>
                        {r.rationale && (
                          <p className="text-xs text-gray-600 ml-4">{r.rationale}</p>
                        )}
                        {r.implementation && (
                          <p className="text-xs text-blue-600 ml-4 mt-0.5 italic">{r.implementation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState text="No hay datos de analisis viral aun. Ejecuta la Fase 1 del pipeline." />
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
