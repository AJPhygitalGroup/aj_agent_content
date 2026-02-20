'use client'

import { useState, useEffect } from 'react'
import ApprovalCard from '@/components/approval-card'
import { CheckCircle, FileText, Send, Loader2, Play, XCircle, RefreshCw } from 'lucide-react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

type Tab = 'post_planning' | 'post_production' | 'pre_publication'

const tabs: { id: Tab; label: string; icon: any; description: string }[] = [
  { id: 'post_planning', label: 'Plan', icon: FileText, description: 'Revisar el plan de contenido semanal' },
  { id: 'post_production', label: 'Contenido', icon: CheckCircle, description: 'Revisar scripts y compliance' },
  { id: 'pre_publication', label: 'Publicar', icon: Send, description: 'Confirmar schedule antes de publicar' },
]

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
      setPipelineState(campaignRes?.pipeline || null)
      await reloadContent()
      setLoading(false)
    }
    init()
    // Poll every 5s — reload content when pipeline is at a checkpoint
    const interval = setInterval(async () => {
      const res = await fetch(`${BACKEND}/api/campaigns`).then(r => r.json()).catch(() => null)
      if (res?.pipeline) {
        setPipelineState(res.pipeline)
        // Always reload content when at checkpoint so we see the latest data
        if (res.pipeline.status === 'waiting_approval') {
          await reloadContent()
          // Auto-switch tab based on pipeline phase
          const phase = res.pipeline.phase
          if (phase <= 2) setActiveTab('post_planning')
          else if (phase <= 5) setActiveTab('post_production')
          else if (phase === 6) setActiveTab('pre_publication')
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
    } catch { /* ignore */ }
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
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pipeline Checkpoint Banner */}
      {pipelineState?.status === 'waiting_approval' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Pipeline esperando aprobacion - Fase {pipelineState.phase}: {pipelineState.phase_name}
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                Revisa el contenido abajo y cuando estes listo, aprueba para continuar con la siguiente fase.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePipelineApprove}
                disabled={approving}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
              >
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Aprobar y Continuar
              </button>
              <button
                onClick={handlePipelineStop}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                <XCircle className="w-4 h-4" />
                Detener
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
        </div>
      )}

      {/* Post-Planning Tab */}
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
          ) : pipelineState?.status === 'waiting_approval' && pipelineState?.phase === 2 ? (
            <div className="bg-white rounded-xl border border-amber-200 p-8 text-center">
              <Loader2 className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-medium text-amber-800">El plan se esta generando o cargando...</p>
              <p className="text-xs text-amber-600 mt-1">La pagina se actualiza automaticamente cada 5 segundos. Tambien puedes presionar &quot;Recargar&quot;.</p>
            </div>
          ) : (
            <EmptyState text="No hay plan de contenido aun. Ejecuta las fases 1 y 2 del pipeline." />
          )}
        </div>
      )}

      {/* Post-Production Tab */}
      {!loading && activeTab === 'post_production' && (
        <div>
          {scripts?.scripts ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {scripts.total_scripts || scripts.scripts.length} scripts generados
                  {compliance && ` | Score batch: ${Math.round((compliance.batch_score || 0) * 100)}%`}
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
          ) : pipelineState?.status === 'waiting_approval' && pipelineState?.phase === 5 ? (
            <div className="bg-white rounded-xl border border-amber-200 p-8 text-center">
              <Loader2 className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-medium text-amber-800">El contenido se esta cargando...</p>
              <p className="text-xs text-amber-600 mt-1">Presiona &quot;Recargar&quot; o espera a que se actualice automaticamente.</p>
            </div>
          ) : (
            <EmptyState text="No hay scripts generados aun. Ejecuta la fase 3 del pipeline." />
          )}
        </div>
      )}

      {/* Pre-Publication Tab */}
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
          ) : (
            <EmptyState text="No hay publicaciones programadas aun. Ejecuta la fase 6 del pipeline." />
          )}
        </div>
      )}
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
