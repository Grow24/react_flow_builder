export const API_BASE =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.SERVER_URL ||
  'http://localhost:3001'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.message || `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export type ApiDiagram = {
  id: string
  name: string
  kind: string
  status: string
  version?: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export type ApiProject = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  diagrams?: ApiDiagram[]
}
