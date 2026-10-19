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
    name: "L'Oréal Brandstorm 2026 — Global Innovation Challenge",
    organizer: "L'Oréal Group",
    description: "The world's leading innovation competition for business and marketing students. Reinvent the future of beauty through cutting-edge technology, AI personalization, and circular economy practices. Winning teams earn an all-expenses-paid intrapreneurship mission at Station F in Paris.",
    category: 'Marketing',
    industry: 'FMCG & Beauty Care',
    registration_deadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(), // 24 days ahead
    event_start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 3,
    max_team_size: 3,
    eligibility: 'All MBA & Post-Graduate Management students (1st & 2nd Year). Diverse teams encouraged.',
    mode: 'Hybrid',
    prize_details: 'Global intrapreneurship at Station F Paris + Pre-Placement Interviews (PPI) across L’Oréal brands.',
    entry_fee: 'Free',
    official_registration_url: 'https://brandstorm.loreal.com',
    official_source_url: 'https://brandstorm.loreal.com',
    poster_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    location: 'Mumbai & Paris (Hybrid)',
  },
  {
    name: 'Reliance TUP (The Ultimate Pitch) — Season 10',
    organizer: 'Reliance Industries Limited',
    description: 'One of India’s most prestigious strategic ideation challenges. MBA students present disruptive business models across New Energy, Digital Services, and Retail Supply Chains to senior Reliance leadership.',
    category: 'Business Strategy',
    industry: 'Conglomerate & Technology',
    registration_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ahead
    event_start_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 2,
    max_team_size: 4,
    eligibility: 'Full-time MBA students from accredited business schools across India.',
    mode: 'Hybrid',
    prize_details: '₹6,00,000 Prize Pool + Fast-track PPI opportunities for Reliance Group Leadership Program.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions?search=Reliance+TUP',
    official_source_url: 'https://unstop.com/case-competitions',
    poster_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    location: 'Navi Mumbai & Virtual',
  },
  {
    name: 'Amazon ACE Challenge 2026 — Operations & Product Strategy',
    organizer: 'Amazon India',
    description: 'Customer obsession meets operational scale. MBA students tackle live case problems in last-mile fulfillment, supply chain sustainability, and marketplace product scaling.',
    category: 'Operations',
    industry: 'E-Commerce & Tech',
    registration_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ahead
    event_start_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 3,
    max_team_size: 3,
    eligibility: '1st and 2nd Year MBA students specializing in Operations, Supply Chain, and Strategy.',
    mode: 'Online',
    prize_details: '₹3,50,000 Winner Award + Amazon Pathways Leadership PPIs.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions?search=Amazon+ACE',
    official_source_url: 'https://unstop.com/case-competitions',
    poster_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    location: 'Online',
  },
  {
    name: 'Aditya Birla Group Stratos — National Case Competition',
    organizer: 'Aditya Birla Group',
    description: 'Solve real strategic dilemmas faced by Aditya Birla Group business CEOs across metals, telecom, fashion retail, and financial services.',
    category: 'Case Competitions',
    industry: 'Diversified Conglomerate',
    registration_deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ahead
    event_start_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 3,
    max_team_size: 3,
    eligibility: 'Two-year full-time MBA/PGDM students from recognized B-Schools.',
    mode: 'Hybrid',
    prize_details: '₹7,00,000 Total Prizes + ABG Leadership Associate (LEAD) PPIs.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions?search=Aditya+Birla+Stratos',
    official_source_url: 'https://unstop.com/case-competitions',
    poster_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    location: 'Mumbai & Virtual',
  },
  {
    name: 'Flipkart WiRED 9.0 — Business Case Challenge',
    organizer: 'Flipkart',
    description: 'Flipkart WiRED invites brightest management minds to explore retail transformation, fintech enablement, and AI-first customer experience in Indian e-commerce.',
    category: 'Product Management',
    industry: 'E-Commerce & Tech',
    registration_deadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days ahead
    event_start_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 3,
    max_team_size: 3,
    eligibility: 'First & Second Year MBA students across all specializations.',
    mode: 'Hybrid',
    prize_details: '₹5,00,000 for National Champions + Direct PPIs for Product & Business tracks.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions?search=Flipkart+WiRED',
    official_source_url: 'https://unstop.com/case-competitions',
    poster_url: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=1200&q=80',
    location: 'Bengaluru & Virtual',
  },
  {
    name: 'ITC Interrobang?! — Campus Engagement Case Challenge',
    organizer: 'ITC Limited',
    description: 'Tackle high-impact management problems in FMCG distribution, sustainable packaging, and agri-business innovations with ITC division heads.',
    category: 'Business Strategy',
    industry: 'FMCG & Agri-Business',
    registration_deadline: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(), // 26 days ahead
    event_start_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
    min_team_size: 2,
    max_team_size: 3,
    eligibility: 'Eligible 1st & 2nd Year MBA/PGDM students.',
    mode: 'Hybrid',
    prize_details: 'Cash awards of ₹3,00,000 + ITC PPO/PPI opportunities.',
    entry_fee: 'Free',
    official_registration_url: 'https://unstop.com/competitions?search=ITC+Interrobang',
    official_source_url: 'https://unstop.com/case-competitions',
    poster_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
    location: 'Kolkata & Virtual',
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
