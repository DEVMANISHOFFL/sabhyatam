const BASE = process.env.NEXT_PUBLIC_API_BASE!

export async function api<T>(
  path: string,
  params?: Record<string, string | string[]>
) {
  const url = new URL(BASE + path)

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach(val => url.searchParams.append(k, val))
      } else if (v !== undefined && v !== '') {
        url.searchParams.set(k, v)
      }
    })
  }

  const res = await fetch(url.toString(), {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }

  return res.json() as Promise<T>
}
