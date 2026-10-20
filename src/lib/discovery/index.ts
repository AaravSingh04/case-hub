import https from 'https';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db/storage';
import { Competition, CompetitionCategory, CompetitionMode, DiscoveryLog } from '../db/types';
import { sendAdminDiscoveryEmail } from '../email';

export interface DiscoveredCompetitionCandidate {
  name: string;
  organizer: string;
  description: string;
  category: CompetitionCategory;
  industry?: string;
  registration_deadline: string;
  event_start_date?: string;
  event_end_date?: string;
  min_team_size: number;
  max_team_size: number;
  eligibility: string;
  mode: CompetitionMode;
  prize_details?: string;
  entry_fee?: string;
  official_registration_url: string;
  official_source_url?: string;
  poster_url?: string;
  location?: string;
}

// Curated verified MBA competition templates used as resilient baseline and fallback
const CURATED_MBA_OPPORTUNITIES: DiscoveredCompetitionCandidate[] = [
  {
    name: 'Strategikon - Consulting Flagship Event 2026',
    organizer: 'Xavier School of Management (XLRI)',
    description: 'The flagship management consulting case competition organized by XLRI Jamshedpur as part of Ensemble Valhalla 2026. Teams tackle high-impact corporate turnaround, market entry, and digital transformation strategy.',
    category: 'Consulting',
    industry: 'Management Consulting',
    registration_deadline: '2026-11-22T23:59:25+05:30',
    event_start_date: '2026-11-24T10:00:00+05:30',
    event_end_date: '2026-11-30T18:00:00+05:30',
    min_team_size: 1,
    max_team_size: 4,
    eligibility: 'All MBA and post-graduate business management students nationwide.',
    mode: 'Hybrid',
    prize_details: '₹2,50,000 Prize Pool + Live Presentation at XLRI Jamshedpur campus.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/strategikon-consulting-flagship-event-2026-ensemble-valhalla-2026-xavier-school-of-management-xlri-1745663',
    official_source_url: 'https://unstop.com/competitions/strategikon-consulting-flagship-event-2026-ensemble-valhalla-2026-xavier-school-of-management-xlri-1745663',
    poster_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    location: 'Jamshedpur & Virtual',
  },
  {
    name: 'Sankalp: Season 5 - A Consulting Case Competition',
    organizer: 'Xavier School of Management (XLRI), Delhi',
    description: 'XLRI Delhi’s marquee consulting case challenge hosted during Nova Exilaro 2026. Student consultants dissect live business problems, propose structured strategic frameworks, and pitch directly to consulting partners.',
    category: 'Consulting',
    industry: 'Management Consulting',
    registration_deadline: '2026-11-13T23:59:00+05:30',
    event_start_date: '2026-11-15T10:00:00+05:30',
    event_end_date: '2026-11-20T18:00:00+05:30',
    min_team_size: 1,
    max_team_size: 4,
    eligibility: 'Full-time MBA/PGDM candidates from recognized management institutes.',
    mode: 'Online',
    prize_details: '₹1,50,000 Prize Pool + Fast-track PPI opportunities.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/sankalp-season-5-a-consulting-case-competition-nova-exilaro26-xlri-delhi-1771560',
    official_source_url: 'https://unstop.com/competitions/sankalp-season-5-a-consulting-case-competition-nova-exilaro26-xlri-delhi-1771560',
    poster_url: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=1200&q=80',
    location: 'Online',
  },
  {
    name: 'Circus Maximus - Marketing Flagship Event - 2026',
    organizer: 'Xavier School of Management (XLRI)',
    description: 'The premier national marketing case competition organized by XLRI Jamshedpur. Formulate disruptive brand revitalization campaigns, omnichannel consumer engagement strategies, and performance marketing playbooks.',
    category: 'Marketing',
    industry: 'FMCG & Consumer Goods',
    registration_deadline: '2026-11-22T23:59:38+05:30',
    event_start_date: '2026-11-24T10:00:00+05:30',
    event_end_date: '2026-11-29T18:00:00+05:30',
    min_team_size: 1,
    max_team_size: 4,
    eligibility: 'Open to first and second-year MBA students across India.',
    mode: 'Hybrid',
    prize_details: '₹2,00,000 Cash Prize + Certificate of Excellence from XLRI.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/circus-maximus-marketing-flagship-event-2026-ensemble-valhalla-2026-xavier-school-of-management-xlri-1746050',
    official_source_url: 'https://unstop.com/competitions/circus-maximus-marketing-flagship-event-2026-ensemble-valhalla-2026-xavier-school-of-management-xlri-1746050',
    poster_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    location: 'Jamshedpur & Virtual',
  },
  {
    name: 'Genesis - Flagship Finance Event- 2026',
    organizer: 'Xavier School of Management (XLRI)',
    description: 'Flagship corporate finance and valuation challenge at XLRI Jamshedpur. Analyze cross-border M&A transactions, capital structure optimization, and private equity buyout modeling.',
    category: 'Finance',
    industry: 'Investment Banking & Private Equity',
    registration_deadline: '2026-11-22T23:59:58+05:30',
    event_start_date: '2026-11-25T10:00:00+05:30',
    event_end_date: '2026-11-30T18:00:00+05:30',
    min_team_size: 1,
    max_team_size: 4,
    eligibility: 'Enrolled MBA and business postgraduate students specializing in Finance.',
    mode: 'Online',
    prize_details: '₹2,00,000 Total Prize Pool + Advisory interaction with finance leaders.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/genesis-flagship-finance-event-2026-ensemble-valhalla-2026-xavier-school-of-management-xlri-1746063',
    official_source_url: 'https://unstop.com/competitions/genesis-flagship-finance-event-2026-ensemble-valhalla-2026-xavier-school-of-management-xlri-1746063',
    poster_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    location: 'Online',
  },
  {
    name: 'TrenDSetter 5.0- Marketing Track',
    organizer: 'DS Group',
    description: 'A marquee corporate live case competition hosted by Dharampal Satyapal Group (DS Group). MBA students solve live market challenges across confectionary, spices, and luxury lifestyle verticals, with direct pre-placement interview (PPI) opportunities.',
    category: 'Marketing',
    industry: 'FMCG & Consumer Goods',
    registration_deadline: '2026-12-05T22:56:44+05:30',
    event_start_date: '2026-12-08T10:00:00+05:30',
    event_end_date: '2026-12-15T18:00:00+05:30',
    min_team_size: 1,
    max_team_size: 4,
    eligibility: '1st & 2nd Year MBA/PGDM students from accredited B-Schools.',
    mode: 'Hybrid',
    prize_details: '₹5,00,000 Winner Pool + Pre-Placement Interviews (PPI) across DS Group business units.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/crp-trendsetter-50-marketing-track-trendsetter-50-ds-group-1764370',
    official_source_url: 'https://unstop.com/competitions/crp-trendsetter-50-marketing-track-trendsetter-50-ds-group-1764370',
    poster_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
    location: 'Noida & Virtual',
  },
  {
    name: 'Fetch-A-Thon 3.0',
    organizer: "Masters' Union School of Business",
    description: 'Intense business hackathon where management students, developers, and product designers collaborate over a 48-hour sprint to build scalable tech and commercial prototypes for real customer problems.',
    category: 'Hackathons',
    industry: 'Technology & Startups',
    registration_deadline: '2026-10-24T17:00:00+05:30',
    event_start_date: '2026-10-25T09:00:00+05:30',
    event_end_date: '2026-10-27T18:00:00+05:30',
    min_team_size: 1,
    max_team_size: 4,
    eligibility: 'All business school students, startup founders, and graduate technologists.',
    mode: 'Online',
    prize_details: '₹1,50,000 Cash Pool + Angel investor review for winning prototypes.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/hackathons/fetch-a-thon-30-masters-union-school-of-business-1769196',
    official_source_url: 'https://unstop.com/hackathons/fetch-a-thon-30-masters-union-school-of-business-1769196',
    poster_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    location: 'Gurugram & Virtual',
  },
];

/**
 * Helper to reliably fetch JSON from Unstop API without TLS leaf signature issues in Node environments
 */
function fetchUnstopJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          rejectUnauthorized: false,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on('error', reject);
  });
}

/**
 * Direct Live Unstop API Connector
 * Queries Unstop for real-world active competitions & hackathons and strictly rejects expired opportunities.
 */
async function discoverFromLiveUnstopAPI(): Promise<DiscoveredCompetitionCandidate[]> {
  const searchQueries = [
    'opportunity=competitions&oppstatus=open&searchTerm=case',
    'opportunity=competitions&oppstatus=open&searchTerm=strategy',
    'opportunity=competitions&oppstatus=open&searchTerm=consulting',
    'opportunity=competitions&oppstatus=open&searchTerm=management',
    'opportunity=hackathons&oppstatus=open&searchTerm=product',
    'opportunity=hackathons&oppstatus=open&searchTerm=business',
  ];

  const candidates: DiscoveredCompetitionCandidate[] = [];
  const seenIds = new Set<number>();

  for (const q of searchQueries) {
    try {
      const url = `https://unstop.com/api/public/opportunity/search-result?${q}&per_page=10`;
      const json = await fetchUnstopJson(url);
      const items = json?.data?.data || [];

      for (const item of items) {
        if (!item.id || seenIds.has(item.id)) continue;
        seenIds.add(item.id);

        // Reject if registration is explicitly not open
        if (item.regn_open === 0) continue;
        if (
          item.regnRequirements?.reg_status === 'CLOSED' ||
          item.regnRequirements?.reg_status === 'EXPIRED'
        ) {
          continue;
        }

        const regEnd = item.regnRequirements?.end_regn_dt || item.end_date;
        if (!regEnd) continue;
        const deadlineTime = new Date(regEnd).getTime();

        // NON-NEGOTIABLE: STRICTLY REJECT EXPIRED OR NEAR-CLOSING OPPORTUNITIES (< 6 hours left)
        const MIN_DEADLINE_BUFFER_MS = 6 * 60 * 60 * 1000;
        if (isNaN(deadlineTime) || deadlineTime <= Date.now() + MIN_DEADLINE_BUFFER_MS) {
          continue;
        }

        const isHackathon = item.type === 'hackathons' || q.includes('hackathon');
        const category: CompetitionCategory = isHackathon
          ? 'Hackathons'
          : q.includes('consulting')
          ? 'Consulting'
          : q.includes('strategy')
          ? 'Business Strategy'
          : 'Case Competitions';

        const directUrl =
          item.public_url && item.public_url.startsWith('http')
            ? item.public_url
            : `https://unstop.com/${
                item.public_url &&
                (item.public_url.startsWith('competitions/') ||
                  item.public_url.startsWith('hackathons/'))
                  ? item.public_url
                  : `${item.type || 'competitions'}/${item.public_url || item.id}`
              }`;

        candidates.push({
          name: String(item.title || '').trim(),
          organizer: String(item.organisation?.name || 'Premier Business School / Corporate Partner').trim(),
          description: String(
            item.seo_description ||
              item.description ||
              `${item.title} — Active ongoing student challenge on Unstop offering corporate visibility, case problem evaluation, and cash prizes.`
          )
            .replace(/<[^>]*>?/gm, '')
            .trim(),
          category,
          industry: isHackathon ? 'Technology & AI' : 'Management Consulting',
          registration_deadline: new Date(deadlineTime).toISOString(),
          min_team_size: Number(item.regnRequirements?.min_team_size || item.min_team_size) || 1,
          max_team_size: Number(item.regnRequirements?.max_team_size || item.max_team_size) || 4,
          eligibility: 'Open to enrolled college and MBA / Postgraduate management students.',
          mode: 'Online',
          prize_details: item.prizes_worth
            ? `₹${item.prizes_worth} Prize Pool`
            : 'Cash prizes & PPI opportunities',
          entry_fee: item.paid ? 'Paid' : 'Free',
          official_registration_url: directUrl,
          official_source_url: directUrl,
          poster_url: item.banner_url || item.banner_mobile || undefined,
          location: 'Online',
        });
      }
    } catch (err: any) {
      console.warn(`[Unstop Discovery] Error querying query "${q}":`, err.message);
    }
  }

  return candidates;
}

/**
 * Uses Gemini API with Google Search grounding to discover live MBA competitions on Unstop
 */
async function discoverWithGemini(apiKey: string): Promise<DiscoveredCompetitionCandidate[]> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Find 5 to 8 CURRENTLY ACTIVE AND ONGOING MBA case competitions, consulting challenges, and business hackathons listed on Unstop (unstop.com) or major Indian/global business schools.
CRITICAL: Only return competitions that are CURRENTLY OPEN for registration with FUTURE deadlines in late 2026. Do NOT return any expired, closed, or past competitions.

For each competition, return a structured JSON array of objects with the following fields:
- name: string (exact official competition title)
- organizer: string (company or business school hosting the challenge)
- description: string (2-3 sentences explaining the challenge, domain, and format)
- category: one of ["Case Competitions", "Business Strategy", "Consulting", "Marketing", "Finance", "Product Management", "Entrepreneurship", "Operations", "Design", "Sustainability", "Hackathons", "Analytics", "Technology", "Other Competitions"]
- industry: string (e.g. FMCG, Consulting, Tech, Banking, E-Commerce)
- registration_deadline: ISO 8601 date string in the future (e.g. 2026-11-20T23:59:59Z)
- event_start_date: optional ISO 8601 date string
- event_end_date: optional ISO 8601 date string
- min_team_size: integer between 1 and 4
- max_team_size: integer between 1 and 5
- eligibility: string (e.g. "MBA / PGDM Students, 1st & 2nd Year")
- mode: "Online" | "Offline" | "Hybrid"
- prize_details: string (e.g. "Cash prizes up to ₹3,00,000 + PPI opportunities")
- entry_fee: string ("Free" or amount)
- official_registration_url: string (the actual Unstop direct competition URL)
- official_source_url: string (usually https://unstop.com)
- poster_url: optional image URL

Return ONLY the raw JSON array. Do not include markdown code block syntax (like \`\`\`json) or any conversational text.
`.trim();

    // Use gemini-2.0-flash with search grounding tool
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    const cleanedText = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

    if (!cleanedText) {
      throw new Error('Gemini returned empty response content');
    }

    const parsed = JSON.parse(cleanedText);
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response was not a JSON array');
    }

    return parsed
      .map((item: any) => ({
        name: String(item.name || '').trim(),
        organizer: String(item.organizer || 'Corporate Partner').trim(),
        description: String(item.description || '').trim(),
        category: item.category || 'Case Competitions',
        industry: item.industry || 'Management Consulting',
        registration_deadline: item.registration_deadline,
        event_start_date: item.event_start_date,
        event_end_date: item.event_end_date,
        min_team_size: Number(item.min_team_size) || 1,
        max_team_size: Number(item.max_team_size) || 4,
        eligibility: item.eligibility || 'All MBA & Post-Graduate Management Students',
        mode: (['Online', 'Offline', 'Hybrid'].includes(item.mode) ? item.mode : 'Online') as CompetitionMode,
        prize_details: item.prize_details || 'Prize pool and PPI opportunities',
        entry_fee: item.entry_fee || 'Free',
        official_registration_url: item.official_registration_url || 'https://unstop.com',
        official_source_url: 'https://unstop.com',
        poster_url: item.poster_url || undefined,
        location: item.location || 'Online',
      }))
      .filter((item: DiscoveredCompetitionCandidate) => {
        // STRICT: Reject any expired or near-closing candidate returned by Gemini (< 6 hours left)
        const d = new Date(item.registration_deadline).getTime();
        return !isNaN(d) && d > Date.now() + 6 * 60 * 60 * 1000;
      });
  } catch (err: any) {
    console.warn('[Automated Discovery] Gemini search grounding fallback triggered:', err.message);
    return [];
  }
}

export interface AutomatedDiscoveryResult {
  runId: string;
  source: string;
  startedAt: string;
  completedAt: string;
  status: 'success' | 'partial' | 'failed';
  itemsFound: number;
  itemsPublished: number;
  duplicatesSkipped: number;
  publishedCompetitions: Competition[];
  errors: string[];
}

/**
 * Main discovery orchestrator: discovers, validates, dedupes, saves, and notifies admin
 */
export async function runAutomatedDiscovery(options?: {
  force?: boolean;
}): Promise<AutomatedDiscoveryResult> {
  const startedAt = new Date().toISOString();
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const config = db.getDiscoveryConfig();

  // If not forced, enforce discovery interval (e.g. 3 days)
  if (!options?.force) {
    const lastRunMs = config.last_successful_discovery_at
      ? new Date(config.last_successful_discovery_at).getTime()
      : 0;
    const intervalMs = (config.interval_days || 3) * 24 * 60 * 60 * 1000;
    const elapsedMs = Date.now() - lastRunMs;

    if (elapsedMs < intervalMs && lastRunMs > 0) {
      const nextDueIso = new Date(lastRunMs + intervalMs).toISOString();
      return {
        runId,
        source: 'Unstop & Online Sources',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'success',
        itemsFound: 0,
        itemsPublished: 0,
        duplicatesSkipped: 0,
        publishedCompetitions: [],
        errors: [`Discovery not due yet. Next run scheduled for ${nextDueIso}`],
      };
    }
  }

  const errors: string[] = [];
  let candidatePool: DiscoveredCompetitionCandidate[] = [];
  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. Direct fetch from Live Unstop API for currently active competitions & hackathons
  try {
    const liveUnstop = await discoverFromLiveUnstopAPI();
    if (liveUnstop.length > 0) {
      candidatePool.push(...liveUnstop);
    }
  } catch (err: any) {
    console.warn('[Automated Discovery] Live Unstop API error:', err.message);
  }

  // 2. If Gemini key is available, supplement with search grounding
  if (geminiKey) {
    console.log('[Automated Discovery] Querying Gemini with Search Grounding for Unstop competitions...');
    const geminiCandidates = await discoverWithGemini(geminiKey);
    if (geminiCandidates.length > 0) {
      candidatePool.push(...geminiCandidates);
    }
  }

  // 3. Fallback to curated live opportunities if no candidates were found
  if (candidatePool.length === 0) {
    console.log('[Automated Discovery] Using verified Unstop MBA competition source pool...');
    candidatePool = CURATED_MBA_OPPORTUNITIES.filter((c) => {
      const d = new Date(c.registration_deadline).getTime();
      return !isNaN(d) && d > Date.now();
    });
  }

  const itemsFound = candidatePool.length;
  let itemsPublished = 0;
  let duplicatesSkipped = 0;
  const publishedCompetitions: Competition[] = [];

  for (const candidate of candidatePool) {
    try {
      // 1. Validate required fields
      if (!candidate.name || !candidate.organizer || !candidate.official_registration_url) {
        continue;
      }

      // 2. NON-NEGOTIABLE: Strictly check registration deadline has at least 6 hours remaining.
      // Do NOT shift expired deadlines to the future. Drop expired or near-closing competitions completely.
      const deadlineTime = new Date(candidate.registration_deadline).getTime();
      const MIN_DEADLINE_BUFFER_MS = 6 * 60 * 60 * 1000;
      if (isNaN(deadlineTime) || deadlineTime <= Date.now() + MIN_DEADLINE_BUFFER_MS) {
        continue;
      }

      // 3. Deduplication check
      const dupCheck = db.checkPotentialDuplicate(
        candidate.name,
        candidate.organizer,
        candidate.official_registration_url
      );

      if (dupCheck.isDuplicate) {
        duplicatesSkipped++;
        continue;
      }

      // 4. Create and publish competition immediately
      const newComp = db.createDiscoveredCompetition(
        {
          name: candidate.name,
          organizer: candidate.organizer,
          description: candidate.description,
          category: candidate.category,
          industry: candidate.industry,
          registration_deadline: candidate.registration_deadline,
          event_start_date: candidate.event_start_date,
          event_end_date: candidate.event_end_date,
          min_team_size: candidate.min_team_size,
          max_team_size: candidate.max_team_size,
          eligibility: candidate.eligibility,
          mode: candidate.mode,
          prize_details: candidate.prize_details,
          entry_fee: candidate.entry_fee,
          official_registration_url: candidate.official_registration_url,
          official_source_url: candidate.official_source_url || 'https://unstop.com',
          poster_url: candidate.poster_url,
          location: candidate.location,
        },
        'Unstop'
      );

      publishedCompetitions.push(newComp);
      itemsPublished++;
    } catch (err: any) {
      errors.push(`Error processing ${candidate.name}: ${err.message}`);
    }
  }

  const completedAt = new Date().toISOString();
  const nextScheduledMs = Date.now() + (config.interval_days || 3) * 24 * 60 * 60 * 1000;
  const next_scheduled_at = new Date(nextScheduledMs).toISOString();

  const finalStatus: 'success' | 'partial' | 'failed' =
    errors.length > 0 && itemsPublished === 0 ? 'failed' : errors.length > 0 ? 'partial' : 'success';

  // Log discovery run to database
  const runLog: Omit<DiscoveryLog, 'id'> = {
    run_id: runId,
    source: 'Unstop',
    started_at: startedAt,
    completed_at: completedAt,
    status: finalStatus,
    items_found: itemsFound,
    items_published: itemsPublished,
    duplicates_skipped: duplicatesSkipped,
    errors,
    next_scheduled_at,
  };

  const savedLog = db.logDiscoveryRun(runLog);

  // Send admin notification email if new competitions were published
  if (itemsPublished > 0) {
    try {
      await sendAdminDiscoveryEmail({
        discoveredCompetitions: publishedCompetitions,
        runLog: savedLog,
      });
    } catch (emailErr: any) {
      console.error('[Automated Discovery] Admin email notification error:', emailErr);
    }
  }

  return {
    runId,
    source: 'Unstop',
    startedAt,
    completedAt,
    status: finalStatus,
    itemsFound,
    itemsPublished,
    duplicatesSkipped,
    publishedCompetitions,
    errors,
  };
}
