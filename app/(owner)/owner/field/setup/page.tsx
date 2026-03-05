"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useOwnerField } from "@/hooks/useOwnerField";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient } from "@supabase/supabase-js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DaySchedule, FieldSchedule } from "@/types";

const DAYS = [
  { day: 0, label: "Dom" },
  { day: 1, label: "Lun" },
  { day: 2, label: "Mar" },
  { day: 3, label: "Mié" },
  { day: 4, label: "Jue" },
  { day: 5, label: "Vie" },
  { day: 6, label: "Sáb" },
] as const;

const DEFAULT_SCHEDULE: FieldSchedule = {
  days: [1, 2, 3, 4, 5].map((day) => ({
    day: day as DaySchedule["day"],
    open: "08:00",
    close: "22:00",
    slot_duration_minutes: 60,
  })),
};

interface FormState {
  name: string;
  location: string;
  price_per_hour: string;
  description: string;
  schedule: FieldSchedule;
  photos: string[];
}

export default function FieldSetupPage() {
  const { userId } = useAuth();
  const { field, isLoading, refetch } = useOwnerField();
  const { success, error: toastError } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [form, setForm] = useState<FormState>({
    name: "",
    location: "",
    price_per_hour: "",
    description: "",
    schedule: DEFAULT_SCHEDULE,
    photos: [],
  });

  // Populate form if editing existing field
  useEffect(() => {
    if (field) {
      setForm({
        name: field.name,
        location: field.location,
        price_per_hour: String(field.price_per_hour),
        description: "",
        schedule: field.schedule,
        photos: field.photos,
      });
      setPreviewUrls(field.photos);
    }
  }, [field]);

  const set = (key: keyof FormState, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ── Schedule helpers ── */
  const isDayEnabled = (day: number) =>
    form.schedule.days.some((d) => d.day === day);

  const toggleDay = (day: DaySchedule["day"]) => {
    const exists = form.schedule.days.find((d) => d.day === day);
    if (exists) {
      set("schedule", { days: form.schedule.days.filter((d) => d.day !== day) });
    } else {
      set("schedule", {
        days: [
          ...form.schedule.days,
          { day, open: "08:00", close: "22:00", slot_duration_minutes: 60 },
        ].sort((a, b) => a.day - b.day),
      });
    }
  };

  const updateDaySchedule = (
    day: number,
    key: "open" | "close",
    value: string
  ) => {
    set("schedule", {
      days: form.schedule.days.map((d) =>
        d.day === day ? { ...d, [key]: value } : d
      ),
    });
  };

  /* ── Photo upload ── */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !userId) return;

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("field-photos")
        .upload(path, file, { upsert: true });

      if (!error) {
        const { data } = supabase.storage
          .from("field-photos")
          .getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
    }

    const newPhotos = [...form.photos, ...uploaded];
    set("photos", newPhotos);
    setPreviewUrls(newPhotos);
    setUploading(false);
  };

  const removePhoto = (url: string) => {
    const newPhotos = form.photos.filter((p) => p !== url);
    set("photos", newPhotos);
    setPreviewUrls(newPhotos);
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    const payload = {
      owner_id: userId,
      name: form.name.trim(),
      location: form.location.trim(),
      price_per_hour: Number(form.price_per_hour),
      photos: form.photos,
      schedule: form.schedule as unknown as Record<string, unknown>,
    };

    const { error } = field
      ? await supabase.from("fields").update(payload).eq("id", field.id)
      : await supabase.from("fields").insert(payload);

    setSaving(false);

    if (error) {
      toastError("Error al guardar la cancha");
    } else {
      success(field ? "Cancha actualizada" : "Cancha creada");
      await refetch();
      router.push("/owner/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" rounded="lg" />)}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-text">
          {field ? "Editar cancha" : "Registrar cancha"}
        </h1>
        <p className="text-muted text-sm mt-1">
          {field ? "Actualizá los datos de tu cancha" : "Completá la info para empezar a recibir reservas"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info básica */}
        <Card variant="bordered" padding="md">
          <CardHeader><CardTitle>Información básica</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Nombre de la cancha"
                placeholder="Ej: Cancha El Barrio"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
              <Input
                label="Dirección"
                placeholder="Av. Corrientes 1234, Buenos Aires"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                required
              />
              <Input
                label="Precio por hora"
                type="number"
                min={0}
                step={500}
                placeholder="15000"
                startAdornment="$"
                value={form.price_per_hour}
                onChange={(e) => set("price_per_hour", e.target.value)}
                required
              />
              <Textarea
                label="Descripción (opcional)"
                placeholder="Cancha de césped sintético, iluminada, vestuarios incluidos..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </div>
          </CardBody>
        </Card>

        {/* Fotos */}
        <Card variant="bordered" padding="md">
          <CardHeader><CardTitle>Fotos</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url) => (
                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                      <Image src={url} alt="foto" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-text opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Subir fotos
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Horarios */}
        <Card variant="bordered" padding="md">
          <CardHeader><CardTitle>Horarios disponibles</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {DAYS.map(({ day, label }) => {
                const enabled = isDayEnabled(day);
                const daySchedule = form.schedule.days.find((d) => d.day === day);

                return (
                  <div key={day} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-12 shrink-0 text-center py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        enabled
                          ? "bg-accent/10 text-accent border border-accent/30"
                          : "bg-surface-2 text-muted border border-border"
                      }`}
                    >
                      {label}
                    </button>
                    {enabled && daySchedule ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={daySchedule.open}
                          onChange={(e) => updateDaySchedule(day, "open", e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-accent/60 focus:outline-none font-mono"
                        />
                        <span className="text-muted text-sm">—</span>
                        <input
                          type="time"
                          value={daySchedule.close}
                          onChange={(e) => updateDaySchedule(day, "close", e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-accent/60 focus:outline-none font-mono"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Cerrado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Button type="submit" variant="primary" size="lg" loading={saving} className="w-full">
          {field ? "Guardar cambios" : "Registrar cancha"}
        </Button>
      </form>
    </div>
  );
}
