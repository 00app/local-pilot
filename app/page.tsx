import { Dashboard } from "@/components/dashboard"

interface PageProps {
  params: Promise<Record<string, never>>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Server-component wrapper that pre-resolves Next.js 16's async dynamic-API
 * proxies (`params` / `searchParams`) at the boundary, so when Cursor's DOM
 * inspector (or any mousemove listener) enumerates React page props it walks
 * resolved plain objects rather than tripping the Proxy's `ownKeys` trap and
 * flooding the dev overlay with `sync-dynamic-apis` warnings.
 */
export default async function Page({ params, searchParams }: PageProps) {
  await params
  await searchParams
  return <Dashboard />
}
