export type ContactWithTags = {
  id: string
  firstName: string
  lastName: string | null
  fullName: string
  phone: string
  normalizedPhone: string
  church: string | null
  groupName: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  birthDate: Date | null
  notes: string | null
  avatar: string | null
  source: string | null
  status: string
  temperature: string
  score: number
  lastContactAt: Date | null
  nextFollowupAt: Date | null
  optOut: boolean
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
  tags: { tag: { id: string; name: string; color: string } }[]
}

export type ContactFilters = {
  search?: string
  status?: string
  temperature?: string
  church?: string
  groupName?: string
  neighborhood?: string
  tagId?: string
  page?: number
  limit?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type DashboardStats = {
  totalContacts: number
  activeContacts: number
  coldContacts: number
  hotContacts: number
  warmContacts: number
  noResponseContacts: number
  pendingFollowUps: number
  todayInteractions: number
  campaignsSent: number
  contactsByChurch: { church: string; count: number }[]
  contactsByNeighborhood: { neighborhood: string; count: number }[]
  contactsByStatus: { status: string; count: number }[]
}
