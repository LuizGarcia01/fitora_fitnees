import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, Scale, Ruler, TrendingUp, TrendingDown, Minus, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const FIELDS = [
  { key: "weight_kg",    label: "Peso",       unit: "kg",  icon: "⚖️",  step: "0.1", primary: true },
  { key: "body_fat_pct", label: "% Gordura",  unit: "%",   icon: "🔥",  step: "0.1" },
  { key: "chest_cm",     label: "Peitoral",   unit: "cm",  icon: "💪",  step: "0.5" },
  { key: "waist_cm",     label: "Cintura",    unit: "cm",  icon: "📏",  step: "0.5" },
  { key: "hips_cm",      label: "Quadril",    unit: "cm",  icon: "📐",  step: "0.5" },
  { key: "arms_cm",      label: "Braços",     unit: "cm",  icon: "💪",  step: "0.5" },
  { key: "thighs_cm",    label: "Coxas",      unit: "cm",  icon: "🦵",  step: "0.5" },
];

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function MiniChart({ data, dataKey, color = "var(--primary)" }) {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: color }} />
        <XAxis dataKey="date" hide />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 11 }}
          formatter={v => [v, ""]}
          labelFormatter={l => formatDate(l)}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Delta({ current, previous }) {
  if (previous == null || current == null) return null;
  const diff = (current - previous).toFixed(1);
  const isPositive = diff > 0;
  const Icon = isPositive ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const color = isPositive ? "text-destructive" : diff < 0 ? "text-primary" : "text-muted-foreground";
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {isPositive ? "+" : ""}{diff}
    </span>
  );
}

const emptyForm = () =>
  FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), { date: new Date().toISOString().split("T")[0], notes: "" });

export default function Measurements() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeChart, setActiveChart] = useState("weight_kg");
  const [saveError, setSaveError] = useState("");

  const { data: measurements = [] } = useQuery({
    queryKey: ["body-measurements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("body_measurements")
        .select("*")
        .order("date", { ascending: true });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const clean = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== "" && v !== null)
      );
      const { error } = await supabase.from("body_measurements").insert({ ...clean, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-measurements"] });
      setSaveError("");
      setShowForm(false);
      setForm(emptyForm());
    },
    onError: (err) => {
      setSaveError(err.message || "Erro ao salvar. Tente novamente.");
    },
  });

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];

  const chartData = measurements.map(m => ({
    date: m.date,
    weight_kg: m.weight_kg,
    body_fat_pct: m.body_fat_pct,
    chest_cm: m.chest_cm,
    waist_cm: m.waist_cm,
    hips_cm: m.hips_cm,
    arms_cm: m.arms_cm,
    thighs_cm: m.thighs_cm,
  }));

  const activeField = FIELDS.find(f => f.key === activeChart);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-5 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Progresso</p>
            <h1 className="text-lg font-heading font-bold text-foreground">Medidas Corporais</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-5">

        {/* Latest stats */}
        {latest && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3">
            {FIELDS.filter(f => latest[f.key] != null).map(f => (
              <div key={f.key} className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{f.icon} {f.label}</p>
                <p className="text-xl font-heading font-bold text-foreground">
                  {latest[f.key]}<span className="text-sm font-normal text-muted-foreground ml-1">{f.unit}</span>
                </p>
                <Delta current={latest[f.key]} previous={previous?.[f.key]} />
              </div>
            ))}
          </motion.div>
        )}

        {/* Chart */}
        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm font-heading font-semibold text-foreground mb-3">Evolução</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {FIELDS.filter(f => chartData.some(d => d[f.key] != null)).map(f => (
                  <button key={f.key} onClick={() => setActiveChart(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-all ${
                      activeChart === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData.filter(d => d[activeChart] != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="date" tickFormatter={formatDate}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                    width={36} tickFormatter={v => `${v}${activeField?.unit}`} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    formatter={v => [`${v}${activeField?.unit}`, activeField?.label]}
                    labelFormatter={l => formatDate(l)}
                  />
                  <Line type="monotone" dataKey={activeChart} stroke="var(--primary)" strokeWidth={2.5}
                    dot={{ fill: "var(--primary)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "var(--primary)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* History list */}
        {measurements.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium px-1">Histórico</p>
            {[...measurements].reverse().slice(0, 10).map(m => (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-heading font-bold text-foreground">
                    {new Date(m.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                  </p>
                  {m.weight_kg && (
                    <span className="text-sm font-heading font-bold text-primary">{m.weight_kg}kg</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {FIELDS.filter(f => f.key !== "weight_kg" && m[f.key] != null).map(f => (
                    <span key={f.key} className="text-xs text-muted-foreground">
                      {f.label}: <span className="text-foreground font-medium">{m[f.key]}{f.unit}</span>
                    </span>
                  ))}
                </div>
                {m.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{m.notes}"</p>}
              </div>
            ))}
          </div>
        )}

        {measurements.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center pt-16 space-y-3">
            <Scale className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-lg font-heading font-bold text-foreground">Nenhuma medida ainda</p>
            <p className="text-sm text-muted-foreground">Registre seu peso e medidas para acompanhar sua evolução.</p>
            <button onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-heading font-semibold text-sm">
              Registrar primeira medida
            </button>
          </motion.div>
        )}
      </div>

      {/* Add form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); setSaveError(""); }} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border overflow-y-auto"
              style={{ maxHeight: "90vh" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="max-w-lg mx-auto px-5 pt-5 pb-10">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                <h2 className="text-lg font-heading font-bold text-foreground mb-5">Nova medição</h2>

                {/* Date */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1.5">Data</p>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {FIELDS.map(f => (
                    <div key={f.key}>
                      <p className="text-xs text-muted-foreground mb-1.5">{f.icon} {f.label} ({f.unit})</p>
                      <input type="number" step={f.step} min="0" placeholder="—"
                        value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="mb-5">
                  <p className="text-xs text-muted-foreground mb-1.5">Observações (opcional)</p>
                  <textarea rows={2} placeholder="Ex: após café, em jejum..."
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
                </div>

                {saveError && (
                  <p className="text-sm text-destructive text-center mb-3">{saveError}</p>
                )}
                <button onClick={() => addMutation.mutate(form)} disabled={addMutation.isPending}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50">
                  {addMutation.isPending
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><Check className="w-5 h-5" /> Salvar medição</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
