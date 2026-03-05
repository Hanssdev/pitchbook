"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Field } from "@/types";

function FieldCard({ field }: { field: Field }) {
  const photo = field.photos[0];
  const today = new Date().getDay() as 0|1|2|3|4|5|6;
  const todaySchedule = field.schedule.days.find((d) => d.day === today);

  return (
    <Link href={`/player/field/${field.id}`}>
      <Card variant="bordered" padding="none" hoverable className="overflow-hidden h-full">
        {/* Foto */}
        <div className="relative aspect-video bg-surface-2">
          {photo ? (
            <Image src={photo} alt={field.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="3" />
                <line x1="12" y1="3" x2="12" y2="9" /><line x1="12" y1="15" x2="12" y2="21" />
                <line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" />
              </svg>
            </div>
          )}
          <div className="absolute bottom-2 right-2 rounded-lg bg-background/80 backdrop-blur-sm px-2.5 py-1">
            <span className="font-mono text-xs font-semibold text-accent">
              ${field.price_per_hour.toLocaleString("es-AR")}/h
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-display font-semibold text-text">{field.name}</h3>
          <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {field.location}
          </p>
          {todaySchedule ? (
            <p className="mt-2 text-xs text-muted font-mono">
              Hoy: <span className="text-text">{todaySchedule.open} – {todaySchedule.close}</span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">Cerrada hoy</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

function FieldCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFields = useCallback(async () => {
    setLoading(true);

    let q = supabase.from("fields").select("*");

    if (query.trim()) {
      q = q.or(`name.ilike.%${query}%,location.ilike.%${query}%`);
    }
    if (maxPrice) {
      q = q.lte("price_per_hour", Number(maxPrice));
    }

    const { data } = await q.order("created_at", { ascending: false });
    setFields((data as Field[]) ?? []);
    setLoading(false);
  }, [query, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(fetchFields, 300);
    return () => clearTimeout(timer);
  }, [fetchFields]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-text">
          Encontrá tu cancha
        </h1>
        <p className="text-muted text-sm mt-1">
          Buscá por zona o nombre y reservá online
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-col sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre o zona..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
        <div className="sm:w-44">
          <Input
            type="number"
            placeholder="Precio máx."
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            prefix="$"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <FieldCardSkeleton key={i} />)}
        </div>
      ) : fields.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Intentá con otro nombre o zona."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
          action={
            <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setMaxPrice(""); }}>
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {fields.map((f) => <FieldCard key={f.id} field={f} />)}
        </div>
      )}
    </div>
  );
}
