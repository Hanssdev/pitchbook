Construye el flujo completo de PITCHBOOK — todas las fases restantes.

## FASE 2 — Flujo Owner (Desktop priority, responsive mobile)

### /owner/dashboard
- Resumen: reservas de hoy, ocupación semanal, ingresos estimados
- Cards con acceso rápido a: Mi Cancha, Calendario, Solicitudes
- Si no tiene cancha → CTA para crear una

### /owner/field/setup
- Formulario registro/edición de cancha
- Campos: nombre, dirección, fotos (múltiples con preview), precio/hora, horario disponible por día, descripción
- Guardar en Supabase tabla fields

### /owner/calendar
- Calendario mensual con bloques de hora
- Colores: verde (libre), amarillo (pendiente), azul (confirmado), gris (bloqueado)
- Click en reservado → detalle
- Click en libre → opción de bloquear

### /owner/reservations
- Lista de solicitudes con filtros: Pendientes / Confirmadas / Rechazadas
- Card por reserva: nombre jugador, fecha, hora, contacto
- Acciones: Aprobar / Rechazar → actualiza Supabase

---

## FASE 3 — Flujo Player (Mobile first, desktop funcional)

### /player/search
- Búsqueda de canchas por zona y fecha
- Grid de cards por cancha: foto, nombre, precio/hora, horarios disponibles
- Filtro por precio y disponibilidad

### /player/field/[id]
- Detalle de cancha: fotos, descripción, precio, horarios disponibles
- Selector de fecha y bloque de hora
- Botón para iniciar reserva

### /player/reserve/[fieldId]
- Formulario de reserva:
  - Datos de contacto: nombre, teléfono, email
  - Número de jugadores por equipo
  - Mensaje opcional al owner
- Genera reserva en Supabase con slug único para compartir
- Redirige al tablero de equipo tras confirmar

---

## FASE 4 — Tablero de Equipo

### /player/reserve/[id]/lineup
- Vista de cancha de fútbol top-down (SVG o canvas)
- Dos equipos con colores seleccionables (color picker por equipo)
- Fichas arrastrables con nombre del jugador (dnd-kit)
- Posiciones libres en toda la cancha
- Botón para agregar jugador manualmente
- El creador puede quitar jugadores
- Estado sincronizado en Supabase realtime (tabla reservation_players con position_x, position_y)

---

## FASE 5 — Links compartibles y gestión de jugadores

### /r/[slug] (ruta pública)
- Vista pública de la reserva
- Muestra: cancha, fecha, hora, estado de aprobación, tablero de equipo en readonly
- Botón "Agregarme como jugador" → formulario simple (nombre, teléfono)
- Solo el creador de la reserva puede quitar jugadores agregados por el link
- El creador puede agregar jugadores directamente sin límite

---

## FASE 6 — Polish de diseño

- Animaciones de entrada en todas las páginas (staggered reveals)
- Hover states con micro-interacciones
- Loading skeletons en lugar de spinners
- Empty states diseñados para cada sección
- Toasts para confirmaciones y errores
- Transiciones entre rutas suaves

---

## Navegación global
- Owner: sidebar fija en desktop, bottom nav en mobile
- Player: top navbar en desktop, bottom nav en mobile
- Rutas protegidas por rol via Clerk middleware

## Consideraciones generales
- Todo TypeScript estricto
- Conectar a Supabase con datos reales
- Usar componentes ui/ ya creados
- Aplicar sistema de diseño establecido
- Mobile first para player, desktop priority para owner
- Supabase Realtime activo para el tablero de equipo y estados de reserva