// ==========================
// FUNCIONES DE NORMALIZACIÓN (Añadidas por NOVA)
// ==========================

export function normalizeCommandStatus(status: string | null | undefined): string {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (['pending', 'processing', 'completed', 'failed', 'rejected'].includes(s)) return s;
  return 'pending';
}

export function normalizeEventLevel(level: string | null | undefined): string {
  if (!level) return 'info';
  const l = level.toLowerCase();
  if (['info', 'warning', 'error', 'critical', 'debug'].includes(l)) return l;
  return 'info';
}

export function normalizeSupplyOrderStatus(status: string | null | undefined): string {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (['pending', 'approved', 'shipped', 'delivered', 'cancelled'].includes(s)) return s;
  return 'pending';
}