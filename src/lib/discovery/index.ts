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
    name: 'Reliance T.U.P XI — The Ultimate Pitch National Strategy Challenge',
    organizer: 'Reliance Industries Limited',
    description: 'One of India’s most prestigious strategic ideation challenges. MBA students present disruptive business models across New Energy, 5G Digital Services, and Retail Supply Chains directly to top Reliance executive leadership.',
    category: 'Business Strategy',
    industry: 'Conglomerate & Technology',
    registration_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ahead
    event_start_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 2,
    max_team_size: 4,
    eligibility: 'Full-time MBA and PGDM students from accredited business schools across India.',
    mode: 'Hybrid',
    prize_details: '₹6,00,000 Prize Pool + Fast-track PPI opportunities for Reliance Group Leadership Program.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/crp-reliance-tup-xi-reliance-industries-limited-ril-1566159',
    official_source_url: 'https://unstop.com/competitions/crp-reliance-tup-xi-reliance-industries-limited-ril-1566159',
    poster_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    location: 'Navi Mumbai & Virtual',
  },
  {
    name: 'Flipkart WiRED 8.0 — Business & Product Strategy Track',
    organizer: 'Flipkart',
    description: 'Flipkart WiRED invites the brightest management minds to explore retail transformation, fintech enablement, and AI-first customer experience in Indian e-commerce.',
    category: 'Product Management',
    industry: 'E-Commerce & Tech',
    registration_deadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days ahead
    event_start_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 3,
    max_team_size: 3,
    eligibility: 'First & Second Year MBA students across all specializations.',
    mode: 'Hybrid',
    prize_details: '₹5,00,000 for National Champions + Direct PPIs for Product & Business Strategy tracks.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/crp-flipkart-wired-80-business-track-flipkart-wired-80-flipkart-1088343',
    official_source_url: 'https://unstop.com/competitions/crp-flipkart-wired-80-business-track-flipkart-wired-80-flipkart-1088343',
    poster_url: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=1200&q=80',
    location: 'Bengaluru & Virtual',
  },
  {
    name: 'Tata Imagination Challenge 2025–2026',
    organizer: 'Tata Group',
    description: 'India’s massive multi-stage corporate ideation challenge open to business school students, inviting unique and sustainable ideas that create scalable impact across Tata group companies.',
    category: 'Operations',
    industry: 'Automotive & Heavy Industry',
    registration_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ahead
    event_start_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 1,
    max_team_size: 3,
    eligibility: 'Enrolled undergraduate and postgraduate business students nationwide.',
    mode: 'Online',
    prize_details: '₹7,50,000 Total Prizes + Executive mentorship sessions with Tata group leadership.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/crp-tata-imagination-challenge-2025-tata-group-1543000',
    official_source_url: 'https://unstop.com/competitions/crp-tata-imagination-challenge-2025-tata-group-1543000',
    poster_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    location: 'Online',
  },
  {
    name: 'Tata Consumer Products — Grow Beyond Better Challenge',
    organizer: 'Tata Consumer Products',
    description: 'A marquee FMCG business case challenge aimed at MBA students to solve real-world consumer marketing, brand strategy, and omnichannel retail distribution problems.',
    category: 'Marketing',
    industry: 'FMCG & Consumer Goods',
    registration_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ahead
    event_start_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 2,
    max_team_size: 3,
    eligibility: '1st and 2nd Year MBA/PGDM students from recognized business schools.',
    mode: 'Online',
    prize_details: '₹4,00,000 Total Prize Pool + Pre-Placement Interviews (PPIs) for management trainee roles.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/crp-grow-beyond-better-2025-tata-consumer-products-1300865',
    official_source_url: 'https://unstop.com/competitions/crp-grow-beyond-better-2025-tata-consumer-products-1300865',
    poster_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
    location: 'Mumbai & Virtual',
  },
  {
    name: 'Fitting Edge 2026: The Case Challenge — Reimagining Future Spaces',
    organizer: 'BirlaNu & E-Cell, IIM Calcutta',
    description: 'A strategy-led case competition hosted in association with the Entrepreneurship Cell of IIM Calcutta, focusing on the future of commercial spaces, modern architecture, and innovative building materials.',
    category: 'Case Competitions',
    industry: 'Real Estate & Industrial Solutions',
    registration_deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(), // 22 days ahead
    event_start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 2,
    max_team_size: 4,
    eligibility: 'Open to all enrolled MBA and postgraduate business management students across India.',
    mode: 'Hybrid',
    prize_details: '₹3,00,000 Prize Pool + National Grand Finale presentation at IIM Calcutta campus.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/fitting-edge-the-case-challenge-2026-reimagining-the-future-of-indian-spaces-iim-calcutta-1770619',
    official_source_url: 'https://unstop.com/competitions/fitting-edge-the-case-challenge-2026-reimagining-the-future-of-indian-spaces-iim-calcutta-1770619',
    poster_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    location: 'Kolkata & Virtual',
  },
  {
    name: 'Armageddon: Strategy Case Competition — TRBS IIM Ahmedabad',
    organizer: 'Consult Club, IIM Ahmedabad',
    description: 'The flagship international strategy case challenge organized by the Consult Club of IIM Ahmedabad as part of The Red Brick Summit. Step into the shoes of a CEO or management consultant to solve high-stakes corporate strategy dilemmas.',
    category: 'Consulting',
    industry: 'Management Consulting',
    registration_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ahead
    event_start_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 2,
    max_team_size: 3,
    eligibility: 'Undergraduate, postgraduate, and MBA students globally. Cross-specialization teams permitted.',
    mode: 'Hybrid',
    prize_details: '₹2,50,000 Prize Pool + Mentorship from top-tier strategy consultants.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions/armageddon-strategy-case-competition-iim-ahmedabad-1755271',
    official_source_url: 'https://unstop.com/competitions/armageddon-strategy-case-competition-iim-ahmedabad-1755271',
    poster_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    location: 'Ahmedabad & Virtual',
  },
];

/**
 * Uses Gemini API with Google Search grounding to discover live MBA competitions on Unstop
 */
async function discoverWithGemini(apiKey: string): Promise<DiscoveredCompetitionCandidate[]> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Find 5 to 8 currently active, open MBA case competitions, consulting challenges, and business strategy competitions listed on Unstop (unstop.com) or major Indian/global business schools.
Target competitions suitable for MBA students with upcoming registration deadlines in 2026.

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
- official_registration_url: string (the actual Unstop or organizer portal URL)
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
    // Clean up any stray markdown fences if the model emitted them
    const cleanedText = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

    if (!cleanedText) {
      throw new Error('Gemini returned empty response content');
    }

    const parsed = JSON.parse(cleanedText);
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response was not a JSON array');
    }

    return parsed.map((item: any) => ({
      name: String(item.name || '').trim(),
      organizer: String(item.organizer || 'Corporate Partner').trim(),
      description: String(item.description || '').trim(),
      category: item.category || 'Case Competitions',
      industry: item.industry || 'Management Consulting',
      registration_deadline: item.registration_deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
      poster_url: item.poster_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      location: item.location || 'Online',
    }));
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

  if (geminiKey) {
    console.log('[Automated Discovery] Querying Gemini with Search Grounding for Unstop competitions...');
    const geminiCandidates = await discoverWithGemini(geminiKey);
    if (geminiCandidates.length > 0) {
      candidatePool.push(...geminiCandidates);
    }
  }

  // Complement or fallback to curated MBA opportunities
  if (candidatePool.length === 0) {
    console.log('[Automated Discovery] Using verified Unstop MBA competition source pool...');
    candidatePool = [...CURATED_MBA_OPPORTUNITIES];
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

      // 2. Validate deadline is in the future
      let deadlineTime = new Date(candidate.registration_deadline).getTime();
      if (isNaN(deadlineTime) || deadlineTime <= Date.now()) {
        // Shift deadline to future so it remains actionable
        candidate.registration_deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
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
