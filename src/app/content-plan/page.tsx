'use client'

import { useState, useEffect } from 'react'
import { Calendar, Loader2, Filter, Globe, Target, TrendingUp } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/* eslint-disable @typescript-eslint/no-explicit-any */

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500',
  tiktok: 'bg-gray-900',
  linkedin: 'bg-blue-700',
  youtube: 'bg-red-600',
  facebook: 'bg-blue-600',
}

const platformLabels: Record<string, string> = {
  instagram: 'IG',
  tiktok: 'TT',
  linkedin: 'LI',
  youtube: 'YT',
  facebook: 'FB',
}

const priorityColors: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
}

const engagementColors: Record<string, string> = {
  very_high: 'text-green-600',
  high: 'text-emerald-500',
  medium: 'text-yellow-600',
  low: 'text-gray-400',
}

/** Safely extract a number from a distribution value (could be a plain number or {posts: N, ...}) */
function extractCount(val: any): number {
  if (typeof val === 'number') return val
  if (val && typeof val === 'object' && typeof val.posts === 'number') return val.posts
  return 0
}

/** Safely extract percentage from a distribution value */
function extractPct(val: any): number | null {
  if (val && typeof val === 'object' && typeof val.percentage === 'number') return val.percentage
  return null
}

export default function ContentPlanPage() {
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${BACKEND}/api/content/plan`)
        const json = await res.json()
        if (json?.data) {
          setPlan(json.data)
        } else if (json?.daily_plans) {
          setPlan(json)
        } else {
          setPlan(null)
        }
      } catch (e: any) {
        setError(e?.message || 'Error loading plan')
        setPlan(null)
      }
      setLoading(false)
    }
    load()
  }, [])

  const dailyPlans: any[] = plan?.daily_plans || []

  const allPlatforms = dailyPlans.length > 0
    ? Array.from(new Set(dailyPlans.flatMap((d: any) => (d.content_slots || []).map((s: any) => s.platform))))
    : []

  function filterSlots(slots: any[]) {
    return slots.filter((s: any) => {
      if (filterPlatform !== 'all' && s.platform !== filterPlatform) return false
      if (filterLanguage !== 'all' && s.language !== filterLanguage) return false
      return true
    })
  }

  const totalPosts = plan?.total_posts || dailyPlans.reduce((sum: number, d: any) => sum + (d.content_slots?.length || 0), 0)

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Plan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Calendario semanal de contenido (Fase 2: Content Planner)
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && plan ? (
        <div>
          {/* Campaign Context */}
          {plan.campaign_context && (
            <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-brand-blue" />
                <h3 className="text-xs font-semibold text-brand-blue uppercase tracking-wide">Contexto de Campana</h3>
              </div>
              <p className="text-sm font-medium text-gray-800">{plan.campaign_context.company || ''}</p>
              <p className="text-xs text-gray-600 mt-1">{plan.campaign_context.campaign_objective || ''}</p>
              {plan.campaign_context.focus_services && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(plan.campaign_context.focus_services as string[]).map((s: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-white rounded-full border border-brand-blue/20 text-brand-blue">{s}</span>
                  ))}
                </div>
              )}
              {plan.campaign_context.target_countries && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Globe className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{(plan.campaign_context.target_countries as string[]).join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
              <p className="text-xs text-gray-500">Total posts</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{dailyPlans.length}</p>
              <p className="text-xs text-gray-500">Dias planificados</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{allPlatforms.length}</p>
              <p className="text-xs text-gray-500">Plataformas</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
              <p className="text-xs font-semibold text-gray-500">Semana</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{plan.week_start || '?'}</p>
              <p className="text-xs text-gray-400">{plan.week_end || '?'}</p>
            </div>
          </div>

          {/* Platform Distribution */}
          {plan.platform_distribution && Object.keys(plan.platform_distribution).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distribucion por Plataforma</h3>
              <div className="flex gap-3">
                {Object.entries(plan.platform_distribution).map(([platform, val]) => {
                  const posts = extractCount(val)
                  return (
                    <div key={platform} className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 capitalize">{platform}</span>
                        <span className="text-xs font-bold text-gray-900">{posts}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${platformColors[platform] || 'bg-brand-blue'}`}
                          style={{ width: `${Math.round((posts / (totalPosts || 1)) * 100)}%` }}
                        />
                      </div>
                      {typeof val === 'object' && (val as any)?.posts_per_day != null && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{(val as any).posts_per_day}/dia</p>
                      )}
                      {typeof val === 'object' && (val as any)?.posts_per_week != null && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{(val as any).posts_per_week}/semana</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Language Distribution */}
          {plan.language_distribution && Object.keys(plan.language_distribution).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distribucion por Idioma</h3>
              <div className="flex gap-4">
                {Object.entries(plan.language_distribution).map(([lang, val]: [string, any]) => {
                  const posts = extractCount(val)
                  const pct = extractPct(val)
                  return (
                    <div key={lang} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50">
                      <span className="text-sm font-bold text-gray-800 capitalize">{lang}</span>
                      <span className="text-xs text-gray-500">{posts} posts</span>
                      {pct != null && <span className="text-xs font-semibold text-brand-blue">{pct.toFixed(1)}%</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterPlatform}
              onChange={e => setFilterPlatform(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="all">Todas las plataformas</option>
              {allPlatforms.map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={filterLanguage}
              onChange={e => setFilterLanguage(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="all">Todos los idiomas</option>
              <option value="es">Espanol</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-4">
            {dailyPlans.map((day: any) => {
              const slots = day.content_slots || []
              const filtered = filterSlots(slots)
              if (filtered.length === 0) return null
              return (
                <div key={day.date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{day.date}</h3>
                        {day.day_theme && <p className="text-xs text-gray-500 mt-0.5">{day.day_theme}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{filtered.length} posts</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {filtered.map((slot: any) => (
                      <div
                        key={slot.slot_id}
                        className={`px-5 py-3 border-l-4 ${priorityColors[slot.priority || ''] || 'border-l-gray-300'} hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Tags row */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformColors[slot.platform] || 'bg-gray-500'}`}>
                                {platformLabels[slot.platform] || slot.platform}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue">{slot.content_type}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{(slot.language || '').toUpperCase()}</span>
                              {slot.pillar && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">{String(slot.pillar).replace(/_/g, ' ')}</span>
                              )}
                              {slot.viral_pattern && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-600">{String(slot.viral_pattern).replace(/_/g, ' ')}</span>
                              )}
                            </div>
                            {/* Topic */}
                            <p className="text-sm font-medium text-gray-800">{slot.topic}</p>
                            {/* Hook */}
                            {slot.hook_idea && (
                              <p className="text-xs text-gray-500 mt-0.5 italic">&ldquo;{slot.hook_idea}&rdquo;</p>
                            )}
                            {/* CTA */}
                            {slot.cta && (
                              <p className="text-xs text-brand-blue mt-0.5">CTA: {slot.cta}</p>
                            )}
                            {/* Target countries */}
                            {slot.target_countries && Array.isArray(slot.target_countries) && slot.target_countries.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Globe className="w-3 h-3 text-gray-300" />
                                <span className="text-[10px] text-gray-400">{slot.target_countries.join(', ')}</span>
                              </div>
                            )}
                          </div>
                          {/* Right side: time, priority, engagement */}
                          <div className="text-right ml-4 flex-shrink-0">
                            {slot.scheduled_time && (
                              <span className="text-xs text-gray-500 block">
                                {(() => {
                                  try { return new Date(slot.scheduled_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }
                                  catch (_e) { return slot.scheduled_time }
                                })()}
                              </span>
                            )}
                            {slot.priority && (
                              <span className={`block text-xs mt-0.5 font-semibold ${
                                slot.priority === 'high' ? 'text-red-500' : slot.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                              }`}>
                                {slot.priority}
                              </span>
                            )}
                            {slot.expected_engagement && (
                              <span className={`block text-[10px] mt-0.5 ${engagementColors[slot.expected_engagement] || 'text-gray-400'}`}>
                                {String(slot.expected_engagement).replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pillar Distribution */}
          {plan.pillar_distribution && Object.keys(plan.pillar_distribution).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distribucion por Pilar de Contenido</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(plan.pillar_distribution).map(([pillar, val]: [string, any]) => {
                  const posts = extractCount(val)
                  const pct = extractPct(val)
                  const targetPct = typeof val === 'object' ? val.target_percentage : null
                  return (
                    <div key={pillar} className="flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-purple-50">
                      <span className="text-xs font-semibold text-purple-700 capitalize">{pillar.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-purple-900">{posts}</span>
                        <span className="text-xs text-purple-500">posts</span>
                        {pct != null && <span className="text-xs font-semibold text-purple-600 ml-auto">{pct.toFixed(1)}%</span>}
                      </div>
                      {targetPct != null && (
                        <span className="text-[10px] text-purple-400">Meta: {targetPct}%</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Content Themes by Day */}
          {plan.content_themes_by_day && Array.isArray(plan.content_themes_by_day) && plan.content_themes_by_day.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Temas por Dia</h3>
              <div className="flex flex-wrap gap-2">
                {plan.content_themes_by_day.map((theme: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-gray-400">D{i + 1}</span>
                    <span className="text-xs text-gray-700">{theme}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs */}
          {plan.key_performance_indicators && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-brand-blue" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">KPIs Objetivo</h3>
              </div>
              {plan.key_performance_indicators.success_criteria && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(plan.key_performance_indicators.success_criteria).map(([key, val]) => (
                    <div key={key} className="px-3 py-2 rounded-lg bg-green-50 border border-green-100">
                      <p className="text-xs text-green-600 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-bold text-green-800 mt-0.5">{String(val)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Campaign Adjustments */}
          {plan.campaign_adjustments && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ajustes de Campana</h3>
              <div className="space-y-2">
                {Object.entries(plan.campaign_adjustments).map(([key, val]) => (
                  <div key={key} className="flex gap-3 items-start">
                    <span className="text-xs font-semibold text-gray-500 w-48 flex-shrink-0 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-700">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No hay plan de contenido aun. Ejecuta las Fases 1 y 2 del pipeline.</p>
        </div>
      ) : null}
    </div>
  )
}
