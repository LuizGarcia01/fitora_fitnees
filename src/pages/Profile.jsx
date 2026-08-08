import React, { useRef, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LogOut, Dumbbell, Target, Calendar, Trash2, ChevronRight, Camera, Scale, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const goalLabels = {
  massa_muscular: "Massa Muscular",
  forca: "Força",
  resistencia: "Resistência",
  emagrecimento: "Emagrecimento"
};

const levelLabels = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado"
};

export default function Profile() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ["workout-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("workout_plans").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["workout-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("workout_logs").select("*").order("date", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const activePlan = plans[0];

  const handleDeletePlan = async () => {
    if (activePlan) {
      await supabase.from("workout_plans").update({ is_active: false }).eq("id", activePlan.id);
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const path = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: cacheBustedUrl },
      });
      if (updateError) throw updateError;
    } catch (err) {
      setPhotoError("Erro ao enviar foto. Verifique se o bucket 'avatars' existe no Supabase.");
      console.error('Photo upload error:', err);
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } });
    setSavingName(false);
    setEditingName(false);
  };

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-5 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sua conta</p>
            <h1 className="text-2xl font-heading font-bold text-foreground mt-0.5">Perfil</h1>
          </div>
          <button
            onClick={logout}
            className="w-10 h-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center hover:border-destructive/30 transition-colors"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
        {/* Avatar + nome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-card border border-border/50 rounded-2xl p-5"
        >
          {/* Avatar com botão de câmera */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-heading font-bold text-primary">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
            >
              {uploadingPhoto ? (
                <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Nome + editar */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  className="flex-1 text-sm font-heading font-bold text-foreground bg-secondary border border-border rounded-lg px-2 py-1 min-w-0 outline-none focus:border-primary"
                  autoFocus
                />
                <button onClick={handleSaveName} disabled={savingName} className="text-primary shrink-0">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-heading font-bold text-foreground truncate">{name || "Atleta"}</h2>
                <button
                  onClick={() => { setNameInput(name); setEditingName(true); }}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            {photoError && (
              <p className="text-xs text-destructive mt-1 leading-tight">{photoError}</p>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
            <Dumbbell className="w-5 h-5 text-primary mx-auto mb-2" />
            <span className="text-xl font-heading font-bold text-foreground block">{logs.length}</span>
            <span className="text-[10px] text-muted-foreground">Treinos</span>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-2" />
            <span className="text-base font-heading font-bold text-foreground block leading-tight">
              {activePlan ? goalLabels[activePlan.goal]?.split(" ")[0] || "—" : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">Objetivo</span>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
            <span className="text-xl font-heading font-bold text-foreground block">
              {activePlan?.days_per_week || "—"}x
            </span>
            <span className="text-[10px] text-muted-foreground">Semana</span>
          </div>
        </motion.div>

        {/* Plano Ativo */}
        {activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border/50 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <h3 className="font-heading font-semibold text-foreground text-sm">Plano Ativo</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "Nome", value: activePlan.name },
                { label: "Nível", value: levelLabels[activePlan.level] || activePlan.level },
                { label: "Objetivo", value: goalLabels[activePlan.goal] },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-sm py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium truncate max-w-[60%] text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Ações */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <Link to="/medidas" className="flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-heading font-semibold text-foreground">Minhas Medidas</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <Link to="/novo-plano" className="flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-heading font-semibold text-foreground">
              {activePlan ? "Criar Novo Plano" : "Criar Plano de Treino"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          {activePlan && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-4 hover:border-destructive/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="flex-1 text-left text-sm font-heading font-semibold text-destructive">Desativar Plano Atual</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Desativar plano?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso vai desativar seu plano atual. Você pode criar um novo a qualquer momento.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground">
                    Desativar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </motion.div>
      </div>
    </div>
  );
}
