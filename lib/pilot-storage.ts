/**
 * Persist onboarding form fields + completed cockpit session in localStorage
 * so refresh / return visits keep user input and the dashboard state.
 */

const INPUTS_KEY = "local_pilot_onboarding_inputs_v1"
const SESSION_KEY = "local_pilot_session_v1"

export interface PilotFormInputs {
  businessName: string
  url: string
  postcode: string
  instagram: string
  tiktok: string
  facebook: string
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

export function loadPilotFormInputs(): Partial<PilotFormInputs> | null {
  if (!canUseStorage()) return null
  try {
    const raw = localStorage.getItem(INPUTS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    return parsed as Partial<PilotFormInputs>
  } catch {
    return null
  }
}

export function savePilotFormInputs(inputs: PilotFormInputs): void {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs))
  } catch {
    // quota / private mode
  }
}

/** Full payload from onboarding `onComplete` — JSON-serialisable. */
export function savePilotSession(data: unknown): void {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ v: 1, data }))
  } catch {
    // quota
  }
}

export function loadPilotSession(): unknown | null {
  if (!canUseStorage()) return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { v?: number; data?: unknown }
    return parsed?.data ?? null
  } catch {
    return null
  }
}

export function clearPilotSession(): void {
  if (!canUseStorage()) return
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function clearPilotFormInputs(): void {
  if (!canUseStorage()) return
  try {
    localStorage.removeItem(INPUTS_KEY)
  } catch {
    /* ignore */
  }
}
