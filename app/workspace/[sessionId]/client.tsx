"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Search, ExternalLink, Plus, Edit3, Trash2, CheckCircle2, X, Save, FileText, Briefcase } from "lucide-react";
import type { Opportunity, Application } from "@/lib/db/schema";
import * as crud from "@/lib/actions/crud";

interface Props {
  sessionId: string;
  opportunities: Opportunity[];
  applications: Application[];
  missionGoal: string;
}

const OPP_TYPES = ["scholarship", "fellowship", "job", "internship", "grant", "accelerator", "competition", "conference", "research", "hackathon"];
const APP_STATUSES = ["saved", "drafting", "submitted", "accepted", "rejected", "missed"];

export function WorkspaceClient({ sessionId, opportunities: initialOpps, applications: initialApps, missionGoal }: Props) {
  const router = useRouter();
  const [opps, setOpps] = useState(initialOpps);
  const [apps, setApps] = useState(initialApps);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [showNewOpp, setShowNewOpp] = useState(false);
  const [applyingOppId, setApplyingOppId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", type: "scholarship", provider: "", description: "", eligibilityCriteria: "", deadline: "", location: "", applicationUrl: "" });

  function resetForm() { setForm({ title: "", type: "scholarship", provider: "", description: "", eligibilityCriteria: "", deadline: "", location: "", applicationUrl: "" }); }

  async function handleCreateOpp() {
    const r = await crud.createOpportunity(form);
    if (r.success) { setShowNewOpp(false); resetForm(); router.refresh(); }
    else alert(r.error);
  }

  async function handleUpdateOpp() {
    if (!editingOpp) return;
    const r = await crud.updateOpportunity(editingOpp.id, form);
    if (r.success) { setEditingOpp(null); resetForm(); router.refresh(); }
    else alert(r.error);
  }

  async function handleDeleteOpp(id: string) {
    if (!confirm("Delete this opportunity?")) return;
    await crud.deleteOpportunity(id);
    setOpps(prev => prev.filter(o => o.id !== id));
    router.refresh();
  }

  async function handleCreateApp(opportunityId: string) {
    const r = await crud.createApplication({ sessionId, opportunityId });
    if (r.success) { setApplyingOppId(null); router.refresh(); }
    else alert(r.error);
  }

  async function handleUpdateApp() {
    if (!editingApp) return;
    const r = await crud.updateApplication(editingApp.id, { status: form.type });
    if (r.success) { setEditingApp(null); router.refresh(); }
    else alert(r.error);
  }

  async function handleDeleteApp(id: string) {
    if (!confirm("Delete this application?")) return;
    await crud.deleteApplication(id);
    router.refresh();
  }

  function openEditOpp(o: Opportunity) {
    setEditingOpp(o);
    setForm({
      title: o.title, type: o.type, provider: o.provider || "",
      description: o.description, eligibilityCriteria: o.eligibilityCriteria || "",
      deadline: o.deadline ? new Date(o.deadline).toISOString().split("T")[0] : "",
      location: o.location || "", applicationUrl: o.applicationUrl || "",
    });
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/dashboard/${sessionId}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Opportunity Workspace</h1>
            <p className="text-sm text-muted-foreground line-clamp-1">{missionGoal}</p>
          </div>
          <button onClick={() => { resetForm(); setShowNewOpp(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97]">
            <Plus className="h-4 w-4" /> New
          </button>
        </div>

        {/* OPPORTUNITIES */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Opportunities</h2>
              <p className="text-sm text-muted-foreground">{opps.length} total</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opps.map((opp) => {
              const app = apps.find(a => a.opportunityId === opp.id);
              return (
                <div key={opp.id} className="rounded-xl border border-border bg-card p-4 hover:border-white/[0.12] transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary uppercase">{opp.type}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditOpp(opp)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDeleteOpp(opp.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{opp.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{opp.provider}</p>
                  <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-3">{opp.description}</p>
                  <div className="flex gap-2">
                    {opp.applicationUrl && (
                      <a href={opp.applicationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Apply <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {!app && (
                      <button onClick={() => handleCreateApp(opp.id)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto">
                        <Briefcase className="h-3 w-3" /> Track
                      </button>
                    )}
                    {app && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-500 ml-auto">
                        <CheckCircle2 className="h-3 w-3" /> {app.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* APPLICATIONS */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Applications</h2>
              <p className="text-sm text-muted-foreground">{apps.length} tracked</p>
            </div>
          </div>

          <div className="space-y-2">
            {apps.map((app) => {
              const opp = opps.find(o => o.id === app.opportunityId);
              const statusColors: Record<string, string> = { saved: "text-amber-500 bg-amber-500/10", drafting: "text-blue-500 bg-blue-500/10", submitted: "text-cyan-500 bg-cyan-500/10", accepted: "text-emerald-500 bg-emerald-500/10", rejected: "text-destructive bg-destructive/10", missed: "text-muted-foreground bg-muted" };
              return (
                <div key={app.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 group">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10"><FileText className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{opp?.title || "Unknown opportunity"}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[app.status] || statusColors.saved}`}>{app.status}</span>
                  </div>
                  <button onClick={() => { setEditingApp(app); setForm({ ...form, type: app.status }); }}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteApp(app.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {apps.length === 0 && <p className="text-sm text-muted-foreground/50 text-center py-4">Click &quot;Track&quot; on any opportunity to start an application.</p>}
          </div>
        </div>
      </div>

      {/* NEW/EDIT OPPORTUNITY MODAL */}
      {(showNewOpp || editingOpp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => { setShowNewOpp(false); setEditingOpp(null); }}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingOpp ? "Edit Opportunity" : "New Opportunity"}</h3>
              <button onClick={() => { setShowNewOpp(false); setEditingOpp(null); }} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded-lg border border-border bg-muted/50 p-2.5 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-border bg-muted/50 p-2.5 text-sm">
                  {OPP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="Provider" className="rounded-lg border border-border bg-muted/50 p-2.5 text-sm" />
              </div>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full rounded-lg border border-border bg-muted/50 p-2.5 text-sm resize-none" />
              <textarea value={form.eligibilityCriteria} onChange={e => setForm({ ...form, eligibilityCriteria: e.target.value })} placeholder="Eligibility criteria" rows={2} className="w-full rounded-lg border border-border bg-muted/50 p-2.5 text-sm resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} type="date" className="rounded-lg border border-border bg-muted/50 p-2.5 text-sm" />
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location" className="rounded-lg border border-border bg-muted/50 p-2.5 text-sm" />
              </div>
              <input value={form.applicationUrl} onChange={e => setForm({ ...form, applicationUrl: e.target.value })} placeholder="Application URL" className="w-full rounded-lg border border-border bg-muted/50 p-2.5 text-sm" />
              <button onClick={editingOpp ? handleUpdateOpp : handleCreateOpp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97]">
                <Save className="h-4 w-4" /> {editingOpp ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT APPLICATION STATUS MODAL */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setEditingApp(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Status</h3>
              <button onClick={() => setEditingApp(null)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-border bg-muted/50 p-2.5 text-sm">
                {APP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleUpdateApp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <Save className="h-4 w-4" /> Update
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
