'use client'

import { useState, useEffect } from 'react'
import { Calendar, Loader2, Filter } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface ContentSlot {
  slot_id: string
  platform: string
  content_type: string
  topic: string
  hook_idea?: string
  viral_pattern?: string
  language: string
  pillar?: string
  scheduled_time?: string
  priority?: string
}

interface DayPlan {
  date: string
  content_slots: ContentSlot[]
}

interface ContentPlan {
  week_start?: string
  week_end?: string
  total_posts?: number
  daily_plans?: DayPlan[]
  pillar_distribution?: Record<string, number>
  platform_distribution?: Record<string, number>
}

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

export default function ContentPlanPage() {
  const [plan, setPlan] = useState<ContentPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`${BACKEND}/api/content/plan`).then(r => r.json()).catch(() => null)
      setPlan(res?.data || null)
      setLoading(false)
    }
    load()
  }, [])

  const allPlatforms = plan?.daily_plans
    ? Array.from(new Set(plan.daily_plans.flatMap(d => d.content_slots.map(s => s.platform))))
    : []

  function filterSlots(slots: ContentSlot[]) {
    return slots.filter(s => {
      if (filterPlatform !== 'all' && s.platform !== filterPlatform) return false
      if (filterLanguage !== 'all' && s.language !== filterLanguage) return false
      return true
    })
  }

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

      {!loading && plan ? (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{plan.total_posts || 0}</p>
              <p className="text-xs text-gray-500">Total posts</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{plan.daily_plans?.length || 0}</p>
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

          {/* Distribution bars */}
          {plan.platform_distribution && Object.keys(plan.platform_distribution).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distribucion por Plataforma</h3>
              <div className="flex gap-2">
                {Object.entries(plan.platform_distribution).map(([platform, count]) => (
                  <div key={platform} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600 capitalize">{platform}</span>
                      <span className="text-xs font-bold text-gray-900">{count as number}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${platformColors[platform] || 'bg-brand-blue'}`}
                        style={{ width: `${Math.round(((count as number) / (plan.total_posts || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
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
              {allPlatforms.map(p => (
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
            {plan.daily_plans?.map(day => {
              const filtered = filterSlots(day.content_slots || [])
              if (filtered.length === 0) return null
              return (
                <div key={day.date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">{day.date}</h3>
                      <span className="text-xs text-gray-400">{filtered.length} posts</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {filtered.map(slot => (
                      <div
                        key={slot.slot_id}
                        className={`px-5 py-3 border-l-4 ${priorityColors[slot.priority || ''] || 'border-l-gray-300'} hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${platformColors[slot.platform] || 'bg-gray-500'}`}>
                                {platformLabels[slot.platform] || slot.platform}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue">{slot.content_type}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{slot.language?.toUpperCase()}</span>
                              {slot.pillar && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">{slot.pillar.replace(/_/g, ' ')}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-800">{slot.topic}</p>
                            {slot.hook_idea && (
                              <p className="text-xs text-gray-500 mt-0.5 italic">&ldquo;{slot.hook_idea}&rdquo;</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            {slot.scheduled_time && (
                              <span className="text-xs text-gray-500">
                                {new Date(slot.scheduled_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {slot.priority && (
                              <span className={`block text-xs mt-0.5 ${
                                slot.priority === 'high' ? 'text-red-500' : slot.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                              }`}>
                                {slot.priority}
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
              <div className="flex flex-wrap gap-3">
                {Object.entries(plan.pillar_distribution).map(([pillar, count]) => (
                  <div key={pillar} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50">
                    <span className="text-xs font-medium text-purple-700">{pillar.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-bold text-purple-900">{count as number}</span>
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
