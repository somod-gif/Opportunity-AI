"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Search, ExternalLink, Plus, Edit3, Trash2, CheckCircle2, X, Save, FileText, Briefcase, Stamp as StampIcon } from "lucide-react";
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
    <main className="min-h-screen bg-[#0B0E13] text-[#F3EEE1] py-8 px-4">
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      <div className="mx-auto max-w-6xl relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/dashboard/${sessionId}`} className="text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60 transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-medium" style={{ fontFamily: "var(--font-display)" }}>Opportunity Workspace</h1>
            <p className="text-sm text-[#F3EEE1]/40 line-clamp-1">{missionGoal}</p>
          </div>
          <button onClick={() => { resetForm(); setShowNewOpp(true); }}
            className="inline-flex items-center gap-2 rounded-sm bg-[#C9A227] px-4 py-2.5 text-sm font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5">
            <Plus className="h-4 w-4" strokeWidth={2} /> New
          </button>
        </div>

        {/* OPPORTUNITIES */}
        <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/10">
              <Search className="h-5 w-5 text-[#C9A227]" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F3EEE1]">Opportunities</h2>
              <p className="text-sm text-[#F3EEE1]/40">{opps.length} total</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opps.map((opp) => {
              const app = apps.find(a => a.opportunityId === opp.id);
              return (
                <div key={opp.id} className="rounded-sm border border-[#F3EEE1]/[0.06] bg-[#F3EEE1]/[0.02] p-4 hover:border-[#C9A227]/20 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center rounded-sm bg-[#C9A227]/10 px-2 py-0.5 text-xs font-medium text-[#C9A227] uppercase font-mono">{opp.type}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditOpp(opp)} className="p-1 rounded-sm hover:bg-[#F3EEE1]/[0.03] text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60"><Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} /></button>
                      <button onClick={() => handleDeleteOpp(opp.id)} className="p-1 rounded-sm hover:bg-[#C2703D]/10 text-[#F3EEE1]/30 hover:text-[#C2703D]"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /></button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-[#F3EEE1]/90">{opp.title}</h3>
                  <p className="text-xs text-[#F3EEE1]/40 mb-3">{opp.provider}</p>
                  <p className="text-xs text-[#F3EEE1]/30 line-clamp-2 mb-3">{opp.description}</p>
                  <div className="flex gap-2">
                    {opp.applicationUrl && (
                      <a href={opp.applicationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#C9A227]/70 hover:text-[#C9A227] transition-colors">
                        Apply <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                      </a>
                    )}
                    {!app && (
                      <button onClick={() => handleCreateApp(opp.id)} className="inline-flex items-center gap-1 text-xs text-[#F3EEE1]/40 hover:text-[#F3EEE1]/70 ml-auto transition-colors">
                        <Briefcase className="h-3 w-3" strokeWidth={1.75} /> Track
                      </button>
                    )}
                    {app && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#3FA78E] ml-auto">
                        <CheckCircle2 className="h-3 w-3" strokeWidth={2} /> {app.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* APPLICATIONS */}
        <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#3FA78E]/30 bg-[#3FA78E]/10">
              <FileText className="h-5 w-5 text-[#3FA78E]" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F3EEE1]">Applications</h2>
              <p className="text-sm text-[#F3EEE1]/40">{apps.length} tracked</p>
            </div>
          </div>

          <div className="space-y-2">
            {apps.map((app) => {
              const opp = opps.find(o => o.id === app.opportunityId);
              const statusColors: Record<string, string> = {
                saved: "text-[#C9A227] bg-[#C9A227]/10",
                drafting: "text-[#3FA78E] bg-[#3FA78E]/10",
                submitted: "text-[#C9A227] bg-[#C9A227]/10",
                accepted: "text-[#3FA78E] bg-[#3FA78E]/10",
                rejected: "text-[#C2703D] bg-[#C2703D]/10",
                missed: "text-[#F3EEE1]/30 bg-[#F3EEE1]/[0.03]",
              };
              return (
                <div key={app.id} className="flex items-center gap-3 rounded-sm border border-[#F3EEE1]/[0.06] bg-[#F3EEE1]/[0.02] p-3 group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#C9A227]/20 bg-[#C9A227]/10">
                    <FileText className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F3EEE1]/80 truncate">{opp?.title || "Unknown opportunity"}</p>
                    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium font-mono ${statusColors[app.status] || statusColors.saved}`}>{app.status}</span>
                  </div>
                  <button onClick={() => { setEditingApp(app); setForm({ ...form, type: app.status }); }}
                    className="p-1.5 rounded-sm hover:bg-[#F3EEE1]/[0.03] text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60 opacity-0 group-hover:opacity-100 transition-all">
                    <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                  <button onClick={() => handleDeleteApp(app.id)}
                    className="p-1.5 rounded-sm hover:bg-[#C2703D]/10 text-[#F3EEE1]/30 hover:text-[#C2703D] opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              );
            })}
            {apps.length === 0 && <p className="text-sm text-[#F3EEE1]/30 text-center py-4">Click "Track" on any opportunity to start an application.</p>}
          </div>
        </div>
      </div>

      {/* NEW/EDIT OPPORTUNITY MODAL */}
      {(showNewOpp || editingOpp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E13]/80 backdrop-blur-sm" onClick={() => { setShowNewOpp(false); setEditingOpp(null); }}>
          <div className="w-full max-w-lg rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>{editingOpp ? "Edit Opportunity" : "New Opportunity"}</h3>
              <button onClick={() => { setShowNewOpp(false); setEditingOpp(null); }} className="p-1 rounded-sm hover:bg-[#F3EEE1]/[0.03] text-[#F3EEE1]/30"><X className="h-4 w-4" strokeWidth={1.75} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-[15px] text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] focus:border-[#C9A227] focus:outline-none transition-colors">
                  {OPP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="Provider" className="border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors" />
              </div>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors resize-none" />
              <textarea value={form.eligibilityCriteria} onChange={e => setForm({ ...form, eligibilityCriteria: e.target.value })} placeholder="Eligibility criteria" rows={2} className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} type="date" className="border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] focus:border-[#C9A227] focus:outline-none transition-colors" />
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location" className="border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors" />
              </div>
              <input value={form.applicationUrl} onChange={e => setForm({ ...form, applicationUrl: e.target.value })} placeholder="Application URL" className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors" />
              <button onClick={editingOpp ? handleUpdateOpp : handleCreateOpp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-4 py-2.5 text-sm font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5">
                <Save className="h-4 w-4" strokeWidth={2} /> {editingOpp ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT APPLICATION STATUS MODAL */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E13]/80 backdrop-blur-sm" onClick={() => setEditingApp(null)}>
          <div className="w-full max-w-sm rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>Update Status</h3>
              <button onClick={() => setEditingApp(null)} className="p-1 rounded-sm hover:bg-[#F3EEE1]/[0.03] text-[#F3EEE1]/30"><X className="h-4 w-4" strokeWidth={1.75} /></button>
            </div>
            <div className="space-y-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] focus:border-[#C9A227] focus:outline-none transition-colors">
                {APP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleUpdateApp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-4 py-2.5 text-sm font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5">
                <Save className="h-4 w-4" strokeWidth={2} /> Update
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}