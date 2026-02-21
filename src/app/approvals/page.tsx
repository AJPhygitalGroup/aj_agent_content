'use client'

import { useState, useEffect } from 'react'
import ApprovalCard from '@/components/approval-card'
import { CheckCircle, FileText, Send, Loader2, Play, XCircle, RefreshCw, AlertCircle } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

type Tab = 'post_planning' | 'post_production' | 'pre_publication'

const tabs: { id: Tab; label: string; icon: any; description: string }[] = [
  { id: 'post_planning', label: 'Plan', icon: FileText, description: 'Revisar el plan de contenido semanal' },
  { id: 'post_production', label: 'Contenido', icon: CheckCircle, description: 'Revisar scripts y compliance' },
  { id: 'pre_publication', label: 'Publicar', icon: Send, description: 'Confirmar schedule antes de publicar' },
]

// Maps pipeline phase to which tab it belongs to
function phaseToTab(phase: number): Tab {
  if (phase <= 2) return 'post_planning'
  if (phase <= 5) return 'post_production'
  return 'pre_publication'
}

// Phase descriptions for running state
const phaseDescriptions: Record<number, string> = {
  1: 'Investigando tendencias y analizando contenido viral...',
  2: 'Generando el plan de contenido semanal...',
  3: 'Escribiendo guiones y optimizando SEO...',
  4: 'Creando imagenes, thumbnails y carruseles...',
  5: 'Validando contenido con brand guidelines...',
  6: 'Programando publicaciones en redes sociales...',
  7: 'Analizando metricas de engagement...',
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('post_planning')
  const [contentPlan, setContentPlan] = useState<any>(null)
  const [scripts, setScripts] = useState<any>(null)
  const [compliance, setCompliance] = useState<any>(null)
  const [schedule, setSchedule] = useState<any>(null)
  const [approvals, setApprovals] = useState<any>({ decisions: [] })
  const [loading, setLoading] = useState(true)
  const [pipelineState, setPipelineState] = useState<any>(null)
  const [approving, setApproving] = useState(false)
  const [reloading, setReloading] = useState(false)

  // Determine if current tab has the data it needs to show approval content
  function hasDataForPhase(phase: number): boolean {
    if (phase <= 2) return !!(contentPlan?.daily_plans)
    if (phase <= 5) return !!(scripts?.scripts)
    return !!(schedule?.scheduled_posts)
  }

  // Load all content data from API
  async function reloadContent() {
    const [planRes, scriptsRes, complianceRes, scheduleRes, approvalsRes] = await Promise.all([
      fetch(`${BACKEND}/api/content/plan`).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND}/api/content/scripts`).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND}/api/content/compliance`).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND}/api/content/schedule`).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND}/api/approvals`).then(r => r.json()).catch(() => ({ decisions: [] })),
    ])
    if (planRes?.data) setContentPlan(planRes.data)
    if (scriptsRes?.data) setScripts(scriptsRes.data)
    if (complianceRes?.data) setCompliance(complianceRes.data)
    if (scheduleRes?.data) setSchedule(scheduleRes.data)
    setApprovals(approvalsRes || { decisions: [] })
  }

  useEffect(() => {
    async function init() {
      setLoading(true)
      const campaignRes = await fetch(`${BACKEND}/api/campaigns`).then(r => r.json()).catch(() => null)
      const pipeline = campaignRes?.pipeline || null
      setPipelineState(pipeline)
      // Auto-switch tab based on pipeline phase
      if (pipeline?.phase) {
        setActiveTab(phaseToTab(pipeline.phase))
      }
      await reloadContent()
      setLoading(false)
    }
    init()

    // Poll every 5s
    const interval = setInterval(async () => {
      const res = await fetch(`${BACKEND}/api/campaigns`).then(r => r.json()).catch(() => null)
      if (res?.pipeline) {
        const prev = pipelineState
        setPipelineState(res.pipeline)

        // Auto-switch tab when phase changes
        if (res.pipeline.phase && (!prev || prev.phase !== res.pipeline.phase)) {
          setActiveTab(phaseToTab(res.pipeline.phase))
        }

        // Reload content when at checkpoint or when status just changed
        if (res.pipeline.status === 'waiting_approval' || res.pipeline.status === 'running') {
          await reloadContent()
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReload() {
    setReloading(true)
    await reloadContent()
    const res = await fetch(`${BACKEND}/api/campaigns`).then(r => r.json()).catch(() => null)
    if (res?.pipeline) setPipelineState(res.pipeline)
    setReloading(false)
  }

  async function handlePipelineApprove() {
    setApproving(true)
    try {
      await fetch(`${BACKEND}/api/pipeline/approve`, { method: 'POST' })
      const res = await fetch(`${BACKEND}/api/campaigns`).then(r => r.json()).catch(() => null)
      if (res?.pipeline) setPipelineState(res.pipeline)
    } catch (_e) { /* ignore */ }
    setApproving(false)
  }

  async function handlePipelineStop() {
    await fetch(`${BACKEND}/api/pipeline/stop`, { method: 'POST' })
    const res = await fetch(`${BACKEND}/api/campaigns`).then(r => r.json()).catch(() => null)
    if (res?.pipeline) setPipelineState(res.pipeline)
  }

  function getDecidedStatus(itemId: string, checkpoint: string): string | undefined {
    const decision = approvals.decisions?.find(
      (d: any) => d.item_id === itemId && d.checkpoint === checkpoint
    )
    return decision?.status || decision?.decision
  }

  async function handleBatchApprove(checkpoint: Tab, itemIds: string[]) {
    for (const id of itemIds) {
      if (!getDecidedStatus(id, checkpoint)) {
        await fetch(`${BACKEND}/api/approvals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkpoint, item_id: id, status: 'approved', feedback: '' }),
        })
      }
    }
    const res = await fetch(`${BACKEND}/api/approvals`).then(r => r.json())
    setApprovals(res)
  }

  // ── Derived state ──
  const isRunning = pipelineState?.status === 'running'
  const isWaiting = pipelineState?.status === 'waiting_approval'
  const phase = pipelineState?.phase || 0
  const phaseName = pipelineState?.phase_name || ''
  const dataReady = isWaiting && hasDataForPhase(phase)

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Revisar y aprobar contenido en cada checkpoint</p>
        </div>
        <button
          onClick={handleReload}
          disabled={reloading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Pipeline Running Banner (blue) ── */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-blue-900">
                Pipeline en ejecucion - Fase {phase}: {phaseName}
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                {phaseDescriptions[phase] || 'Procesando...'}
              </p>
            </div>
            <button
              onClick={handlePipelineStop}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-xs flex-shrink-0"
            >
              <XCircle className="w-4 h-4" />
              Detener
            </button>
          </div>
        </div>
      )}

      {/* ── Checkpoint Banner (amber) — waiting for approval ── */}
      {isWaiting && (
        <div className={`rounded-xl p-5 mb-6 border ${dataReady ? 'bg-amber-50 border-amber-200' : 'bg-amber-50/50 border-amber-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {dataReady ? (
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {dataReady
                    ? `Checkpoint - Fase ${phase}: ${phaseName}`
                    : `Cargando datos de Fase ${phase}: ${phaseName}...`
                  }
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  {dataReady
                    ? 'Revisa el contenido abajo. Aprueba cada item individualmente o todo de una vez, y luego continua el pipeline.'
                    : 'Los datos se estan cargando. La pagina se actualiza automaticamente cada 5 segundos.'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-3">
              {dataReady && (
                <button
                  onClick={handlePipelineApprove}
                  disabled={approving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                >
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Aprobar y Continuar
                </button>
              )}
              <button
                onClick={handlePipelineStop}
                className="flex items-center gap-2 px-3 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                <XCircle className="w-4 h-4" />
                Detener
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Completed / Error / Stopped banners ── */}
      {pipelineState?.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm font-medium text-green-800">Pipeline completado exitosamente</p>
          </div>
        </div>
      )}

      {pipelineState?.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Error en el pipeline</p>
              {pipelineState.error && <p className="text-xs text-red-600 mt-1">{pipelineState.error}</p>}
            </div>
          </div>
        </div>
      )}

      {pipelineState?.status === 'stopped_by_user' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Pipeline detenido por el usuario</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
        </div>
      )}

      {/* ── Post-Planning Tab ── */}
      {!loading && activeTab === 'post_planning' && (
        <div>
          {contentPlan?.daily_plans ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {contentPlan.total_posts || 0} posts planificados
                  {contentPlan.week_start && ` | Semana: ${contentPlan.week_start} - ${contentPlan.week_end}`}
                </p>
                <button
                  onClick={() => {
                    const ids = contentPlan.daily_plans.flatMap((d: any) =>
                      (d.content_slots || []).map((s: any) => s.slot_id)
                    )
                    handleBatchApprove('post_planning', ids)
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600"
                >
                  Aprobar Todo
                </button>
              </div>

              {contentPlan.daily_plans.map((day: any) => (
                <div key={day.date} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{day.date}</h3>
                  <div className="space-y-2">
                    {(day.content_slots || []).map((slot: any) => (
                      <ApprovalCard
                        key={slot.slot_id}
                        id={slot.slot_id}
                        title={slot.topic || 'Sin tema'}
                        subtitle={`${slot.scheduled_time || ''} | ${slot.language?.toUpperCase() || ''} | ${slot.pillar || ''}`}
                        platform={slot.platform}
                        contentType={slot.content_type}
                        hook={slot.hook_idea}
                        checkpoint="post_planning"
                        decidedStatus={getDecidedStatus(slot.slot_id, 'post_planning')}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : isRunning && phase <= 2 ? (
            <RunningState text={phaseDescriptions[phase] || 'Generando plan...'} />
          ) : isWaiting && phase <= 2 ? (
            <RunningState text="El plan se genero pero esta cargando. Se actualiza automaticamente..." />
          ) : (
            <EmptyState text="No hay plan de contenido aun. Inicia una campana para generar el plan." />
          )}
        </div>
      )}

      {/* ── Post-Production Tab ── */}
      {!loading && activeTab === 'post_production' && (
        <div>
          {scripts?.scripts ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {scripts.total_scripts || scripts.scripts.length} scripts generados
                  {compliance && ` | Brand score: ${Math.round((compliance.batch_score || 0) * 100)}%`}
                </p>
                <button
                  onClick={() => {
                    const ids = scripts.scripts.map((s: any) => s.slot_id)
                    handleBatchApprove('post_production', ids)
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600"
                >
                  Aprobar Todo
                </button>
              </div>

              <div className="space-y-2">
                {scripts.scripts.map((script: any) => {
                  const review = compliance?.content_reviews?.find(
                    (r: any) => r.slot_id === script.slot_id
                  )
                  return (
                    <ApprovalCard
                      key={script.slot_id}
                      id={script.slot_id}
                      title={script.hook || script.slot_id}
                      subtitle={`${script.platform} | ${script.content_type} | ${script.language?.toUpperCase()} | ${script.word_count || 0} words`}
                      platform={script.platform}
                      contentType={script.content_type}
                      complianceScore={review?.overall_score}
                      previewText={script.script_body || script.caption}
                      hook={script.hook}
                      checkpoint="post_production"
                      decidedStatus={getDecidedStatus(script.slot_id, 'post_production')}
                    />
                  )
                })}
              </div>
            </>
          ) : isRunning && phase >= 3 && phase <= 5 ? (
            <RunningState text={phaseDescriptions[phase] || 'Generando contenido...'} />
          ) : isWaiting && phase === 5 ? (
            <RunningState text="Los scripts se generaron pero estan cargando..." />
          ) : (
            <EmptyState text="No hay scripts generados aun. El pipeline debe pasar la Fase 3 primero." />
          )}
        </div>
      )}

      {/* ── Pre-Publication Tab ── */}
      {!loading && activeTab === 'pre_publication' && (
        <div>
          {schedule?.scheduled_posts ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {schedule.total_scheduled || 0} posts programados
                </p>
                <button
                  onClick={() => {
                    const ids = schedule.scheduled_posts.map((p: any) => p.slot_id)
                    handleBatchApprove('pre_publication', ids)
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600"
                >
                  Aprobar y Publicar
                </button>
              </div>

              <div className="space-y-2">
                {schedule.scheduled_posts.map((post: any) => (
                  <ApprovalCard
                    key={post.slot_id}
                    id={post.slot_id}
                    title={post.caption_preview || post.slot_id}
                    subtitle={`${post.scheduled_time} | ${post.media_type}`}
                    platform={post.platform}
                    contentType={post.media_type}
                    checkpoint="pre_publication"
                    decidedStatus={getDecidedStatus(post.slot_id, 'pre_publication')}
                  />
                ))}
              </div>
            </>
          ) : isRunning && phase === 6 ? (
            <RunningState text={phaseDescriptions[6]} />
          ) : isWaiting && phase === 6 ? (
            <RunningState text="Las publicaciones se programaron pero estan cargando..." />
          ) : (
            <EmptyState text="No hay publicaciones programadas aun. El pipeline debe pasar la Fase 6 primero." />
          )}
        </div>
      )}
    </div>
  )
}

function RunningState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl border border-blue-100 p-8 text-center">
      <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
      <p className="text-sm font-medium text-blue-800">{text}</p>
      <p className="text-xs text-gray-400 mt-2">Se actualiza automaticamente cada 5 segundos</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
