export type UserRole = 'student' | 'admin';

export type CompetitionCategory =
  | 'Case Competitions'
  | 'Business Strategy'
  | 'Consulting'
  | 'Marketing'
  | 'Finance'
  | 'Product Management'
  | 'Entrepreneurship'
  | 'Operations'
  | 'Design'
  | 'Sustainability'
  | 'Hackathons'
  | 'Analytics'
  | 'Technology'
  | 'Other Competitions';

export const COMPETITION_CATEGORIES: CompetitionCategory[] = [
  'Case Competitions',
  'Business Strategy',
  'Consulting',
  'Marketing',
  'Finance',
  'Product Management',
  'Entrepreneurship',
  'Operations',
  'Design',
  'Sustainability',
  'Hackathons',
  'Analytics',
  'Technology',
  'Other Competitions',
];

export type CompetitionMode = 'Online' | 'Offline' | 'Hybrid';

export type DeadlineStatus = 'upcoming' | 'closing_soon' | 'closed';

export type VerificationStatus = 'unverified' | 'verified';

export interface User {
  id: string;
  email: string;
  display_name: string;
  phone_number?: string;
  email_verified?: boolean;
  avatar_url?: string;
  program_of_study?: string;
  year_of_study?: string;
  linkedin_url?: string;
  bio?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  name: string;
  organizer: string;
  description: string;
  category: CompetitionCategory;
  industry?: string;
  registration_deadline: string; // ISO string
  event_start_date?: string;
  event_end_date?: string;
  min_team_size: number;
  max_team_size: number;
  eligibility: string;
  mode: CompetitionMode;
  prize_details?: string;
  entry_fee?: string;
  official_source_url?: string;
  official_registration_url: string;
  poster_url?: string;
  case_brief_url?: string;
  additional_resources?: string;
  additional_notes?: string;
  location?: string;
  uploader_id: string;
  uploader_display_name: string;
  discovery_source?: string; // e.g. 'Unstop', 'Manual Upload'
  discovery_timestamp?: string;
  created_at: string;
  updated_at: string;
  verification_status: VerificationStatus;
  verified_at?: string;
  verified_by?: string;
  is_archived: boolean;
}

// Sensitive metadata isolated from public queries
export interface CompetitionPrivateMetadata {
  competition_id: string;
  uploader_id: string;
  uploader_email: string;
  uploader_phone?: string;
  created_at: string;
}

export interface SavedCompetition {
  id: string;
  user_id: string;
  competition_id: string;
  created_at: string;
}

export interface TeamListing {
  id: string;
  competition_id: string;
  host_id: string;
  host_display_name: string;
  headline: string;
  description: string;
  target_team_size: number;
  contact_method: string;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_listing_id: string;
  user_id: string;
  user_display_name: string;
  user_avatar?: string;
  joined_at: string;
}

export type ReportReason =
  | 'Spam'
  | 'Duplicate competition'
  | 'Incorrect information'
  | 'Expired competition'
  | 'Inappropriate content'
  | 'Broken registration link'
  | 'Other';

export const REPORT_REASONS: ReportReason[] = [
  'Spam',
  'Duplicate competition',
  'Incorrect information',
  'Expired competition',
  'Inappropriate content',
  'Broken registration link',
  'Other',
];

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface Report {
  id: string;
  competition_id: string;
  competition_name?: string;
  reporting_user_id: string;
  reporting_user_name?: string;
  reason: ReportReason;
  additional_details?: string;
  status: ReportStatus;
  created_at: string;
  reviewer_id?: string;
  reviewed_at?: string;
  resolution_notes?: string;
}

export type ResourceCategory =
  | 'Case-solving frameworks'
  | 'Business strategy'
  | 'Market sizing'
  | 'Consulting preparation'
  | 'Presentation design'
  | 'Financial analysis'
  | 'Marketing strategy'
  | 'Product management'
  | 'Industry research'
  | 'Competition preparation';

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  'Case-solving frameworks',
  'Business strategy',
  'Market sizing',
  'Consulting preparation',
  'Presentation design',
  'Financial analysis',
  'Marketing strategy',
  'Product management',
  'Industry research',
  'Competition preparation',
];

export type ResourceType = 'link' | 'document' | 'framework';

export interface CaseResource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  resource_type: ResourceType;
  url: string;
  created_at: string;
  created_by: string;
}

export type NotificationTemplateType = 'admin_new_upload' | 'closing_soon' | 'saved_update' | 'admin_discovery_summary';

export interface NotificationLog {
  id: string;
  recipient_email: string;
  recipient_name: string;
  user_id?: string;
  subject: string;
  template_type: NotificationTemplateType;
  competition_id: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  payload: Record<string, any>;
  sent_at?: string;
  created_at: string;
}

export interface DiscoveryLog {
  id: string;
  run_id: string;
  source: string;
  started_at: string;
  completed_at: string;
  status: 'success' | 'partial' | 'failed';
  items_found: number;
  items_published: number;
  duplicates_skipped: number;
  errors: string[];
  next_scheduled_at: string;
}

export interface DiscoveryConfig {
  interval_days: number; // 2 or 3 days
  enabled: boolean;
  last_successful_discovery_at?: string;
  sources: string[];
}

export interface CompetitionFilterParams {
  search?: string;
  category?: string;
  industry?: string;
  organizer?: string;
  deadlineStatus?: 'all' | 'upcoming' | 'closing_soon' | 'closed';
  mode?: string;
  teamSize?: string;
  eligibility?: string;
  participationFee?: 'all' | 'free' | 'paid';
  sort?: 'newest' | 'deadline_soonest' | 'alphabetical';
  page?: number;
  limit?: number;
}

export interface AuthCredential {
  user_id: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
  updated_at: string;
}

export interface EmailVerificationOtp {
  id: string;
  email: string;
  otp_hash: string;
  salt: string;
  verification_token?: string;
  attempts: number;
  max_attempts: number;
  resend_available_at: string;
  expires_at: string;
  created_at: string;
  full_name: string;
  program_of_study: string;
  year_of_study: string;
  phone_number?: string;
  verified: boolean;
}

