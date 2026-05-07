export type Role = 'client' | 'freelancer' | 'admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type HireRequestStatus = 'pending' | 'accepted' | 'declined' | 'completed'

export interface FreelancerProfile {
  id: string
  user_id: string
  full_name: string
  bio: string | null
  skills: string[]
  services: string[]
  hourly_rate: number | null
  availability: boolean
  portfolio_url: string | null
  avatar_url: string | null
  approved: boolean
  approval_status: ApprovalStatus
  approval_notes: string | null
  profile_completed: boolean
  created_at: string
}

export interface ClientProfile {
  id: string
  user_id: string
  full_name: string
  company_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface HireRequest {
  id: string
  client_id: string
  freelancer_id: string
  service: string
  description: string
  status: HireRequestStatus
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  request_id: string
  content: string
  read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  read: boolean
  created_at: string
}

export interface ServiceCatalog {
  id: string
  name: string
  icon: string
  description: string
  active: boolean
}

export interface ChatbotSession {
  id: string
  session_token: string
  email: string | null
  service_needed: string | null
  notes: string | null
  notified: boolean
  created_at: string
}
