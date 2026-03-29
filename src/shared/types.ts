export const STAGES = [
  'inquiry',
  'offer_sent',
  'in_progress',
  'completed',
  'lost'
] as const

export type Stage = (typeof STAGES)[number]

export const STAGE_LABELS: Record<Stage, string> = {
  inquiry: 'Inquiry',
  offer_sent: 'Offer Sent',
  in_progress: 'In Progress',
  completed: 'Completed',
  lost: 'Lost'
}

export const STAGE_COLORS: Record<Stage, string> = {
  inquiry: 'bg-blue-100 text-blue-700',
  offer_sent: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700'
}

export const ACTIVE_STAGES = STAGES.filter(
  (s) => s !== 'completed' && s !== 'lost'
)

export const CLIENT_TYPES = ['b2b', 'b2c'] as const
export type ClientType = (typeof CLIENT_TYPES)[number]

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  b2b: 'B2B',
  b2c: 'B2C'
}

export const DOC_TYPES = ['contract', 'offer', 'invoice', 'other'] as const
export type DocType = (typeof DOC_TYPES)[number]

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  contract: 'Contract',
  offer: 'Offer',
  invoice: 'Invoice',
  other: 'Other'
}
