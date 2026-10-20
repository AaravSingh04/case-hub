import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  User,
  Competition,
  CompetitionPrivateMetadata,
  SavedCompetition,
  TeamListing,
  TeamMember,
  Report,
  CaseResource,
  NotificationLog,
  DiscoveryLog,
  DiscoveryConfig,
  CompetitionFilterParams,
  UserRole,
  AuthCredential,
  EmailVerificationOtp,
} from './types';
import {
  SEED_USERS,
  SEED_COMPETITIONS,
  SEED_PRIVATE_METADATA,
  SEED_TEAM_LISTINGS,
  SEED_TEAM_MEMBERS,
  SEED_CASE_RESOURCES,
} from './seed';
import { getDeadlineStatus } from '../utils';

interface DatabaseSchema {
  users: User[];
  auth_credentials?: AuthCredential[];
  email_verifications?: EmailVerificationOtp[];
  competitions: Competition[];
  private_metadata: CompetitionPrivateMetadata[];
  saved_competitions: SavedCompetition[];
  team_listings: TeamListing[];
  team_members: TeamMember[];
  reports: Report[];
  case_resources: CaseResource[];
  notification_logs: NotificationLog[];
  discovery_logs: DiscoveryLog[];
  discovery_config: DiscoveryConfig;
}

const LOCAL_DB_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_PATH = path.join(LOCAL_DB_DIR, 'case_hub.db.json');
const TMP_DB_PATH = path.join(os.tmpdir(), 'case_hub.db.json');

// In-memory state cache across warm serverless function invocations
let memoryState: DatabaseSchema | null = null;
let isLocalWritableCached: boolean | null = null;

function getWritableDbPath(): string {
  // If running in Vercel or AWS Lambda, use os.tmpdir() to avoid EROFS read-only filesystem errors
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return TMP_DB_PATH;
  }

  if (isLocalWritableCached === false) {
    return TMP_DB_PATH;
  }
  if (isLocalWritableCached === true) {
    return LOCAL_DB_PATH;
  }

  try {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    const testFile = path.join(LOCAL_DB_DIR, `.write_check_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    isLocalWritableCached = true;
    return LOCAL_DB_PATH;
  } catch {
    isLocalWritableCached = false;
    return TMP_DB_PATH;
  }
}

function normalizeSchema(parsed: any): DatabaseSchema {
  return {
    users: parsed?.users || SEED_USERS,
    auth_credentials: parsed?.auth_credentials || [],
    email_verifications: parsed?.email_verifications || [],
    competitions: parsed?.competitions || SEED_COMPETITIONS,
    private_metadata: parsed?.private_metadata || SEED_PRIVATE_METADATA,
    saved_competitions: parsed?.saved_competitions || [],
    team_listings: parsed?.team_listings || [],
    team_members: parsed?.team_members || [],
    reports: parsed?.reports || [],
    case_resources: parsed?.case_resources || [],
    notification_logs: parsed?.notification_logs || [],
    discovery_logs: parsed?.discovery_logs || [],
    discovery_config: parsed?.discovery_config || {
      interval_days: 3,
      enabled: true,
      last_successful_discovery_at: '2026-10-18T00:00:00Z',
      sources: ['Unstop', 'Corporate & B-School Challenges'],
    },
  };
}

function loadDatabase(): DatabaseSchema {
  const targetPath = getWritableDbPath();

  // 1. Try reading from target writable location
  if (fs.existsSync(targetPath)) {
    try {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryState = normalizeSchema(parsed);
      return memoryState;
    } catch (err) {
      console.error('Error reading database from target path:', err);
    }
  }

  // 2. If targetPath is in /tmp (e.g. Vercel), bootstrap from bundled read-only database
  if (targetPath !== LOCAL_DB_PATH && fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryState = normalizeSchema(parsed);
      try {
        fs.writeFileSync(targetPath, JSON.stringify(memoryState, null, 2), 'utf-8');
      } catch (copyErr) {
        console.warn('Could not mirror bundled DB to tmp storage:', copyErr);
      }
      return memoryState;
    } catch (err) {
      console.error('Error reading bundled database file:', err);
    }
  }

  // 3. If in-memory state already exists, return it
  if (memoryState) {
    return memoryState;
  }

  // 4. Initial seed fallback
  const initialData: DatabaseSchema = {
    users: SEED_USERS,
    auth_credentials: [],
    email_verifications: [],
    competitions: SEED_COMPETITIONS,
    private_metadata: SEED_PRIVATE_METADATA,
    saved_competitions: [
      {
        id: 'saved_001',
        user_id: 'usr_student_001',
        competition_id: 'comp_hul_lime_2026',
        created_at: '2026-10-06T09:00:00Z',
      },
    ],
    team_listings: SEED_TEAM_LISTINGS,
    team_members: SEED_TEAM_MEMBERS,
    reports: [],
    case_resources: SEED_CASE_RESOURCES,
    notification_logs: [],
    discovery_logs: [],
    discovery_config: {
      interval_days: 3,
      enabled: true,
      last_successful_discovery_at: '2026-10-18T00:00:00Z',
      sources: ['Unstop', 'Corporate & B-School Challenges'],
    },
  };

  memoryState = initialData;
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema): void {
  memoryState = data;
  const targetPath = getWritableDbPath();
  const dir = path.dirname(targetPath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (dirErr) {
    console.warn('Could not ensure db directory:', dirErr);
  }

  const tempPath = path.join(dir, `case_hub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.tmp`);
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, targetPath);
  } catch (err: any) {
    // If atomic rename fails (e.g. cross-device link or EROFS on temp path), try direct write
    try {
      fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (writeErr: any) {
      console.error('CRITICAL: Failed to write database to disk:', writeErr?.message || writeErr);
      // memoryState remains preserved in warm memory cache
    }
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
  }
}

// ----------------------------------------------------
// Database Operations
// ----------------------------------------------------

export const db = {
  // Competitions
  getCompetitions(params: CompetitionFilterParams = {}): {
    competitions: Competition[];
    total: number;
    page: number;
    totalPages: number;
  } {
    const state = loadDatabase();
    let items = state.competitions.filter((c) => !c.is_archived);

    // Search
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.organizer.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.industry && c.industry.toLowerCase().includes(q))
      );
    }

    // Category
    if (params.category && params.category !== 'all') {
      items = items.filter((c) => c.category === params.category);
    }

    // Industry
    if (params.industry && params.industry !== 'all') {
      items = items.filter((c) => c.industry && c.industry.toLowerCase() === params.industry?.toLowerCase());
    }

    // Organizer
    if (params.organizer && params.organizer !== 'all') {
      items = items.filter((c) => c.organizer.toLowerCase() === params.organizer?.toLowerCase());
    }

    // Deadline Status
    if (params.deadlineStatus && params.deadlineStatus !== 'all') {
      items = items.filter((c) => getDeadlineStatus(c.registration_deadline) === params.deadlineStatus);
    }

    // Mode
    if (params.mode && params.mode !== 'all') {
      items = items.filter((c) => c.mode.toLowerCase() === params.mode?.toLowerCase());
    }

    // Team Size
    if (params.teamSize && params.teamSize !== 'all') {
      const size = parseInt(params.teamSize, 10);
      if (!isNaN(size)) {
        items = items.filter((c) => c.min_team_size <= size && c.max_team_size >= size);
      }
    }

    // Eligibility
    if (params.eligibility && params.eligibility.trim()) {
      const el = params.eligibility.toLowerCase();
      items = items.filter((c) => c.eligibility.toLowerCase().includes(el));
    }

    // Participation Fee (Free / Paid)
    if (params.participationFee && params.participationFee !== 'all') {
      if (params.participationFee === 'free') {
        items = items.filter(
          (c) => !c.entry_fee || c.entry_fee.toLowerCase() === 'free' || c.entry_fee.trim() === '0'
        );
      } else if (params.participationFee === 'paid') {
        items = items.filter(
          (c) => c.entry_fee && c.entry_fee.toLowerCase() !== 'free' && c.entry_fee.trim() !== '0'
        );
      }
    }

    // Sorting
    const sort = params.sort || 'newest';
    items.sort((a, b) => {
      if (sort === 'deadline_soonest') {
        return new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime();
      }
      if (sort === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      // default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const total = items.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 9);
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = items.slice(offset, offset + limit);

    return {
      competitions: paginated,
      total,
      page,
      totalPages,
    };
  },

  getAllCompetitionsAdmin(includeArchived = true): Competition[] {
    const state = loadDatabase();
    return includeArchived ? state.competitions : state.competitions.filter((c) => !c.is_archived);
  },

  getCompetitionById(id: string): Competition | null {
    const state = loadDatabase();
    return state.competitions.find((c) => c.id === id) || null;
  },

  getCompetitionPrivateMetadata(competitionId: string): CompetitionPrivateMetadata | null {
    const state = loadDatabase();
    return state.private_metadata.find((m) => m.competition_id === competitionId) || null;
  },

  createCompetition(
    competition: Omit<Competition, 'id' | 'created_at' | 'updated_at' | 'verification_status' | 'is_archived'>,
    uploaderEmail: string
  ): Competition {
    const state = loadDatabase();
    const id = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newComp: Competition = {
      ...competition,
      id,
      created_at: nowIso,
      updated_at: nowIso,
      verification_status: 'unverified',
      is_archived: false,
    };

    const privateMeta: CompetitionPrivateMetadata = {
      competition_id: id,
      uploader_id: competition.uploader_id,
      uploader_email: uploaderEmail,
      created_at: nowIso,
    };

    state.competitions.unshift(newComp);
    state.private_metadata.push(privateMeta);
    saveDatabase(state);

    return newComp;
  },

  updateCompetition(
    id: string,
    updates: Partial<Competition>,
    userId: string,
    isAdmin = false
  ): { competition: Competition | null; changedFields: string[]; previousValues: Record<string, any> } {
    const state = loadDatabase();
    const index = state.competitions.findIndex((c) => c.id === id);
    if (index === -1) {
      return { competition: null, changedFields: [], previousValues: {} };
    }

    const existing = state.competitions[index];

    // Authorization check
    if (!isAdmin && existing.uploader_id !== userId) {
      throw new Error('Unauthorized to edit this competition');
    }

    // Detect important date changes for saved-competition notifications
    const changedFields: string[] = [];
    const previousValues: Record<string, any> = {};

    if (updates.registration_deadline && updates.registration_deadline !== existing.registration_deadline) {
      changedFields.push('registration_deadline');
      previousValues.registration_deadline = existing.registration_deadline;
    }
    if (updates.event_start_date && updates.event_start_date !== existing.event_start_date) {
      changedFields.push('event_start_date');
      previousValues.event_start_date = existing.event_start_date;
    }
    if (updates.event_end_date && updates.event_end_date !== existing.event_end_date) {
      changedFields.push('event_end_date');
      previousValues.event_end_date = existing.event_end_date;
    }

    // Prevent non-admin from modifying privileged fields
    const safeUpdates: Partial<Competition> = { ...updates };
    if (!isAdmin) {
      delete safeUpdates.verification_status;
      delete safeUpdates.verified_at;
      delete safeUpdates.verified_by;
      delete safeUpdates.uploader_id;
      delete safeUpdates.is_archived;
    }

    const updatedComp: Competition = {
      ...existing,
      ...safeUpdates,
      updated_at: new Date().toISOString(),
    };

    state.competitions[index] = updatedComp;
    saveDatabase(state);

    return { competition: updatedComp, changedFields, previousValues };
  },

  deleteCompetition(id: string, userId: string, isAdmin = false): boolean {
    const state = loadDatabase();
    const index = state.competitions.findIndex((c) => c.id === id);
    if (index === -1) return false;

    const comp = state.competitions[index];
    if (!isAdmin && comp.uploader_id !== userId) {
      throw new Error('Unauthorized to delete this competition');
    }

    // Remove competition
    state.competitions.splice(index, 1);
    // Cascade remove private metadata
    state.private_metadata = state.private_metadata.filter((m) => m.competition_id !== id);
    // Cascade remove saved associations
    state.saved_competitions = state.saved_competitions.filter((s) => s.competition_id !== id);
    // Cascade remove team listings and members
    const teamIds = state.team_listings.filter((t) => t.competition_id === id).map((t) => t.id);
    state.team_listings = state.team_listings.filter((t) => t.competition_id !== id);
    state.team_members = state.team_members.filter((tm) => !teamIds.includes(tm.team_listing_id));
    // Cascade remove reports
    state.reports = state.reports.filter((r) => r.competition_id !== id);

    saveDatabase(state);
    return true;
  },

  archiveCompetition(id: string, isArchived: boolean): Competition | null {
    const state = loadDatabase();
    const comp = state.competitions.find((c) => c.id === id);
    if (!comp) return null;
    comp.is_archived = isArchived;
    comp.updated_at = new Date().toISOString();
    saveDatabase(state);
    return comp;
  },

  verifyCompetition(id: string, adminName: string): Competition | null {
    const state = loadDatabase();
    const comp = state.competitions.find((c) => c.id === id);
    if (!comp) return null;
    comp.verification_status = 'verified';
    comp.verified_at = new Date().toISOString();
    comp.verified_by = adminName;
    comp.updated_at = new Date().toISOString();
    saveDatabase(state);
    return comp;
  },

  checkPotentialDuplicate(name: string, organizer: string, registrationUrl: string): { isDuplicate: boolean; matches: Competition[] } {
    const state = loadDatabase();
    const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normOrg = organizer.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normUrl = registrationUrl.toLowerCase().trim();

    const matches = state.competitions.filter((c) => {
      const matchUrl = c.official_registration_url.toLowerCase().trim() === normUrl;
      const cNormName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cNormOrg = c.organizer.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchNameOrg = cNormName.includes(normName) || normName.includes(cNormName);
      const matchOrg = cNormOrg === normOrg;

      return matchUrl || (matchNameOrg && matchOrg);
    });

    return {
      isDuplicate: matches.length > 0,
      matches,
    };
  },

  // Saved Competitions
  isCompetitionSaved(userId: string, competitionId: string): boolean {
    const state = loadDatabase();
    return state.saved_competitions.some((s) => s.user_id === userId && s.competition_id === competitionId);
  },

  toggleSaveCompetition(userId: string, competitionId: string): { saved: boolean } {
    const state = loadDatabase();
    const existingIndex = state.saved_competitions.findIndex(
      (s) => s.user_id === userId && s.competition_id === competitionId
    );

    if (existingIndex !== -1) {
      state.saved_competitions.splice(existingIndex, 1);
      saveDatabase(state);
      return { saved: false };
    } else {
      state.saved_competitions.push({
        id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        competition_id: competitionId,
        created_at: new Date().toISOString(),
      });
      saveDatabase(state);
      return { saved: true };
    }
  },

  getSavedCompetitions(userId: string): Competition[] {
    const state = loadDatabase();
    const savedIds = new Set(
      state.saved_competitions.filter((s) => s.user_id === userId).map((s) => s.competition_id)
    );
    return state.competitions.filter((c) => savedIds.has(c.id));
  },

  getUsersWhoSavedCompetition(competitionId: string): User[] {
    const state = loadDatabase();
    const userIds = new Set(
      state.saved_competitions.filter((s) => s.competition_id === competitionId).map((s) => s.user_id)
    );
    return state.users.filter((u) => userIds.has(u.id));
  },

  // Team Finder
  getTeamListings(competitionId: string): TeamListing[] {
    const state = loadDatabase();
    const listings = state.team_listings.filter((t) => t.competition_id === competitionId);
    return listings.map((l) => ({
      ...l,
      members: state.team_members.filter((m) => m.team_listing_id === l.id),
    }));
  },

  createTeamListing(
    competitionId: string,
    host: User,
    data: { headline: string; description: string; target_team_size: number; contact_method: string }
  ): TeamListing {
    const state = loadDatabase();
    const comp = state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');

    if (data.target_team_size < comp.min_team_size || data.target_team_size > comp.max_team_size) {
      throw new Error(`Target team size must be between ${comp.min_team_size} and ${comp.max_team_size}`);
    }

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newTeam: TeamListing = {
      id: teamId,
      competition_id: competitionId,
      host_id: host.id,
      host_display_name: host.display_name,
      headline: data.headline,
      description: data.description,
      target_team_size: data.target_team_size,
      contact_method: data.contact_method,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const hostMember: TeamMember = {
      id: `tm_${Date.now()}_1`,
      team_listing_id: teamId,
      user_id: host.id,
      user_display_name: host.display_name,
      user_avatar: host.avatar_url,
      joined_at: nowIso,
    };

    state.team_listings.unshift(newTeam);
    state.team_members.push(hostMember);
    saveDatabase(state);

    return {
      ...newTeam,
      members: [hostMember],
    };
  },

  joinTeam(teamListingId: string, user: User): TeamMember {
    const state = loadDatabase();
    const team = state.team_listings.find((t) => t.id === teamListingId);
    if (!team) throw new Error('Team listing not found');

    const currentMembers = state.team_members.filter((m) => m.team_listing_id === teamListingId);

    // Prevent duplicate joining
    if (currentMembers.some((m) => m.user_id === user.id)) {
      throw new Error('You are already a member of this team');
    }

    // Size limit check
    if (currentMembers.length >= team.target_team_size) {
      throw new Error('This team has already reached its target size');
    }

    const newMember: TeamMember = {
      id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      team_listing_id: teamListingId,
      user_id: user.id,
      user_display_name: user.display_name,
      user_avatar: user.avatar_url,
      joined_at: new Date().toISOString(),
    };

    state.team_members.push(newMember);
    saveDatabase(state);
    return newMember;
  },

  leaveTeam(teamListingId: string, userId: string): boolean {
    const state = loadDatabase();
    const team = state.team_listings.find((t) => t.id === teamListingId);
    if (!team) return false;

    // If host leaves and is only one, delete listing
    const members = state.team_members.filter((m) => m.team_listing_id === teamListingId);
    const memberIndex = state.team_members.findIndex(
      (m) => m.team_listing_id === teamListingId && m.user_id === userId
    );

    if (memberIndex === -1) return false;

    state.team_members.splice(memberIndex, 1);

    // If no members left or host left, update host or remove
    if (members.length <= 1) {
      state.team_listings = state.team_listings.filter((t) => t.id !== teamListingId);
    } else if (team.host_id === userId) {
      // Transfer host to first remaining member
      const nextMember = state.team_members.find((m) => m.team_listing_id === teamListingId);
      if (nextMember) {
        team.host_id = nextMember.user_id;
        team.host_display_name = nextMember.user_display_name;
      }
    }

    saveDatabase(state);
    return true;
  },

  // Reports
  createReport(
    competitionId: string,
    reportingUser: User,
    reason: Report['reason'],
    details?: string
  ): Report {
    const state = loadDatabase();
    const comp = state.competitions.find((c) => c.id === competitionId);
    const report: Report = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      competition_id: competitionId,
      competition_name: comp?.name || 'Unknown Competition',
      reporting_user_id: reportingUser.id,
      reporting_user_name: reportingUser.display_name,
      reason,
      additional_details: details,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    state.reports.unshift(report);
    saveDatabase(state);
    return report;
  },

  getReports(): Report[] {
    const state = loadDatabase();
    return state.reports;
  },

  updateReportStatus(
    reportId: string,
    status: Report['status'],
    reviewerId: string,
    resolutionNotes?: string
  ): Report | null {
    const state = loadDatabase();
    const report = state.reports.find((r) => r.id === reportId);
    if (!report) return null;

    report.status = status;
    report.reviewer_id = reviewerId;
    report.reviewed_at = new Date().toISOString();
    if (resolutionNotes) {
      report.resolution_notes = resolutionNotes;
    }

    saveDatabase(state);
    return report;
  },

  // Case Resources
  getCaseResources(category?: string): CaseResource[] {
    const state = loadDatabase();
    if (category && category !== 'all') {
      return state.case_resources.filter((r) => r.category === category);
    }
    return state.case_resources;
  },

  createCaseResource(resource: Omit<CaseResource, 'id' | 'created_at'>): CaseResource {
    const state = loadDatabase();
    const newRes: CaseResource = {
      ...resource,
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    state.case_resources.unshift(newRes);
    saveDatabase(state);
    return newRes;
  },

  deleteCaseResource(id: string): boolean {
    const state = loadDatabase();
    const idx = state.case_resources.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    state.case_resources.splice(idx, 1);
    saveDatabase(state);
    return true;
  },

  // Users & Profiles
  getUsers(): User[] {
    const state = loadDatabase();
    return state.users;
  },

  getUserById(id: string): User | null {
    const state = loadDatabase();
    return state.users.find((u) => u.id === id) || null;
  },

  getUserByEmail(email: string): User | null {
    const state = loadDatabase();
    return state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  updateUserProfile(id: string, updates: Partial<User>): User | null {
    const state = loadDatabase();
    const user = state.users.find((u) => u.id === id);
    if (!user) return null;

    // Protect role from student modification
    delete updates.role;
    delete updates.id;

    Object.assign(user, updates, { updated_at: new Date().toISOString() });
    saveDatabase(state);
    return user;
  },

  updateUserRole(userId: string, newRole: UserRole, adminId: string): User | null {
    const state = loadDatabase();
    const admin = state.users.find((u) => u.id === adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Only administrators can update user roles');
    }

    const targetUser = state.users.find((u) => u.id === userId);
    if (!targetUser) return null;

    targetUser.role = newRole;
    targetUser.updated_at = new Date().toISOString();
    saveDatabase(state);
    return targetUser;
  },

  createUser(user: User): User {
    const state = loadDatabase();
    const existingIndex = state.users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      state.users[existingIndex] = { ...state.users[existingIndex], ...user, updated_at: new Date().toISOString() };
    } else {
      state.users.push(user);
    }
    saveDatabase(state);
    return user;
  },

  getAuthCredentialByEmail(email: string): AuthCredential | null {
    const state = loadDatabase();
    if (!state.auth_credentials) return null;
    return state.auth_credentials.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
  },

  saveAuthCredential(cred: AuthCredential): void {
    const state = loadDatabase();
    if (!state.auth_credentials) state.auth_credentials = [];
    const index = state.auth_credentials.findIndex((c) => c.email.toLowerCase() === cred.email.toLowerCase());
    if (index >= 0) {
      state.auth_credentials[index] = cred;
    } else {
      state.auth_credentials.push(cred);
    }
    saveDatabase(state);
  },

  getEmailVerificationByEmail(email: string): EmailVerificationOtp | null {
    const state = loadDatabase();
    if (!state.email_verifications) return null;
    return state.email_verifications.find((v) => v.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getEmailVerificationByToken(token: string): EmailVerificationOtp | null {
    const state = loadDatabase();
    if (!state.email_verifications) return null;
    return state.email_verifications.find((v) => v.verification_token === token) || null;
  },

  saveEmailVerification(verif: EmailVerificationOtp): void {
    const state = loadDatabase();
    if (!state.email_verifications) state.email_verifications = [];
    const index = state.email_verifications.findIndex((v) => v.email.toLowerCase() === verif.email.toLowerCase());
    if (index >= 0) {
      state.email_verifications[index] = verif;
    } else {
      state.email_verifications.push(verif);
    }
    saveDatabase(state);
  },

  deleteEmailVerification(email: string): void {
    const state = loadDatabase();
    if (!state.email_verifications) return;
    state.email_verifications = state.email_verifications.filter((v) => v.email.toLowerCase() !== email.toLowerCase());
    saveDatabase(state);
  },

  // Notifications
  logNotification(log: Omit<NotificationLog, 'id' | 'created_at'>): NotificationLog {
    const state = loadDatabase();
    const newLog: NotificationLog = {
      ...log,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    state.notification_logs.unshift(newLog);
    saveDatabase(state);
    return newLog;
  },

  getNotificationLogs(): NotificationLog[] {
    const state = loadDatabase();
    return state.notification_logs;
  },

  updateNotificationStatus(id: string, status: 'sent' | 'failed', errorMessage?: string): NotificationLog | null {
    const state = loadDatabase();
    const log = state.notification_logs.find((n) => n.id === id);
    if (!log) return null;

    log.status = status;
    if (status === 'sent') {
      log.sent_at = new Date().toISOString();
      log.error_message = undefined;
    } else {
      log.error_message = errorMessage;
    }

    saveDatabase(state);
    return log;
  },

  getRegisteredVerifiedUsers(): User[] {
    const state = loadDatabase();
    return state.users.filter((u) => u.email && u.email_verified !== false);
  },

  // Discovery Management
  getDiscoveryConfig(): DiscoveryConfig {
    const state = loadDatabase();
    return (
      state.discovery_config || {
        interval_days: 3,
        enabled: true,
        last_successful_discovery_at: '2026-10-18T00:00:00Z',
        sources: ['Unstop', 'Corporate & B-School Challenges'],
      }
    );
  },

  updateDiscoveryConfig(updates: Partial<DiscoveryConfig>): DiscoveryConfig {
    const state = loadDatabase();
    state.discovery_config = {
      ...state.discovery_config,
      ...updates,
    };
    saveDatabase(state);
    return state.discovery_config;
  },

  logDiscoveryRun(log: Omit<DiscoveryLog, 'id'>): DiscoveryLog {
    const state = loadDatabase();
    const newLog: DiscoveryLog = {
      ...log,
      id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    if (!state.discovery_logs) state.discovery_logs = [];
    state.discovery_logs.unshift(newLog);
    if (log.status === 'success') {
      state.discovery_config.last_successful_discovery_at = log.completed_at;
    }
    saveDatabase(state);
    return newLog;
  },

  getDiscoveryLogs(): DiscoveryLog[] {
    const state = loadDatabase();
    return state.discovery_logs || [];
  },

  createDiscoveredCompetition(
    competition: Omit<
      Competition,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'verification_status'
      | 'is_archived'
      | 'uploader_id'
      | 'uploader_display_name'
    >,
    source = 'Unstop'
  ): Competition {
    const state = loadDatabase();
    const id = `comp_disc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newComp: Competition = {
      ...competition,
      id,
      uploader_id: 'system_discovery',
      uploader_display_name: 'Discovered by Case Hub',
      discovery_source: source,
      discovery_timestamp: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      verification_status: 'verified',
      verified_at: nowIso,
      verified_by: 'Case Hub Automated Discovery',
      is_archived: false,
    };

    const privateMeta: CompetitionPrivateMetadata = {
      competition_id: id,
      uploader_id: 'system_discovery',
      uploader_email: 'discovery@casehub.internal',
      created_at: nowIso,
    };

    state.competitions.unshift(newComp);
    state.private_metadata.push(privateMeta);
    saveDatabase(state);

    return newComp;
  },

  // Dashboard & Admin Stats
  getAdminStats() {
    const state = loadDatabase();
    const nowIso = new Date().toISOString();
    let upcoming = 0;
    let closingSoon = 0;
    let closed = 0;

    for (const c of state.competitions) {
      if (c.is_archived) continue;
      const status = getDeadlineStatus(c.registration_deadline);
      if (status === 'upcoming') upcoming++;
      else if (status === 'closing_soon') closingSoon++;
      else closed++;
    }

    const config = state.discovery_config || {
      interval_days: 3,
      enabled: true,
      last_successful_discovery_at: '2026-10-18T00:00:00Z',
      sources: ['Unstop', 'Corporate & B-School Challenges'],
    };

    const lastDiscoveryMs = config.last_successful_discovery_at
      ? new Date(config.last_successful_discovery_at).getTime()
      : Date.now() - 3 * 24 * 60 * 60 * 1000;
    const nextDiscoveryMs = lastDiscoveryMs + config.interval_days * 24 * 60 * 60 * 1000;
    const nextDiscoveryIso = new Date(nextDiscoveryMs).toISOString();

    const discLogs = state.discovery_logs || [];
    const discoveredComps = state.competitions.filter((c) => c.uploader_id === 'system_discovery');

    return {
      totalCompetitions: state.competitions.length,
      activeCompetitions: state.competitions.filter((c) => !c.is_archived).length,
      upcoming,
      closingSoon,
      closed,
      registeredUsers: state.users.length,
      totalReports: state.reports.length,
      pendingReports: state.reports.filter((r) => r.status === 'pending').length,
      notificationLogsCount: state.notification_logs.length,
      recentCompetitions: state.competitions.slice(0, 5),
      lastSuccessfulDiscoveryAt: config.last_successful_discovery_at,
      nextScheduledDiscoveryAt: nextDiscoveryIso,
      discoveryIntervalDays: config.interval_days,
      discoveryEnabled: config.enabled,
      discoverySources: config.sources,
      totalDiscoveredItems: discoveredComps.length,
      failedDiscoveryRuns: discLogs.filter((l) => l.status === 'failed').length,
      recentDiscoveryLogs: discLogs.slice(0, 5),
    };
  },

  getStudentStats(userId: string) {
    const state = loadDatabase();
    const myPosts = state.competitions.filter((c) => c.uploader_id === userId);
    const saved = db.getSavedCompetitions(userId);

    // Find closing soon from saved
    const closingSoonSaved = saved.filter(
      (c) => getDeadlineStatus(c.registration_deadline) === 'closing_soon'
    );

    // My team activity
    const myTeamsJoined = state.team_members.filter((m) => m.user_id === userId);

    return {
      uploadedCount: myPosts.length,
      savedCount: saved.length,
      closingSoonCount: closingSoonSaved.length,
      teamsJoinedCount: myTeamsJoined.length,
      myPosts,
      savedCompetitions: saved,
      closingSoonSaved,
    };
  },
};
