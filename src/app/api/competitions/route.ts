import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';
import { sendAdminNewUploadNotification } from '@/lib/email';
import { COMPETITION_CATEGORIES } from '@/lib/db/types';

// Zod validation schema for competition submission
const competitionSubmissionSchema = z.object({
  name: z.string().trim().min(3, 'Competition name must be at least 3 characters'),
  organizer: z.string().trim().min(2, 'Organizer name must be at least 2 characters'),
  description: z.string().trim().min(20, 'Description must be at least 20 characters'),
  category: z.enum(COMPETITION_CATEGORIES as [string, ...string[]]),
  industry: z.string().trim().optional(),
  registration_deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid registration deadline date is required',
  }),
  event_start_date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid event start date',
  }),
  event_end_date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid event end date',
  }),
  min_team_size: z.coerce.number().int().min(1, 'Minimum team size must be at least 1'),
  max_team_size: z.coerce.number().int().min(1, 'Maximum team size must be at least 1'),
  eligibility: z.string().trim().min(3, 'Eligibility criteria is required'),
  mode: z.enum(['Online', 'Offline', 'Hybrid']),
  prize_details: z.string().trim().optional(),
  entry_fee: z.string().trim().optional(),
  official_source_url: z.string().trim().optional(),
  official_registration_url: z.string().trim().url('Valid registration URL is required'),
  poster_url: z.string().trim().optional(),
  case_brief_url: z.string().trim().optional(),
  additional_resources: z.string().trim().optional(),
  additional_notes: z.string().trim().optional(),
  location: z.string().trim().optional(),
}).refine((data) => data.max_team_size >= data.min_team_size, {
  message: 'Maximum team size must be greater than or equal to minimum team size',
  path: ['max_team_size'],
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const industry = searchParams.get('industry') || undefined;
    const organizer = searchParams.get('organizer') || undefined;
    const deadlineStatus = (searchParams.get('deadlineStatus') as any) || undefined;
    const mode = searchParams.get('mode') || undefined;
    const teamSize = searchParams.get('teamSize') || undefined;
    const eligibility = searchParams.get('eligibility') || undefined;
    const participationFee = (searchParams.get('participationFee') as any) || undefined;
    const sort = (searchParams.get('sort') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '9', 10);

    const result = db.getCompetitions({
      search,
      category,
      industry,
      organizer,
      deadlineStatus,
      mode,
      teamSize,
      eligibility,
      participationFee,
      sort,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user server-side
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to submit a competition' }, { status: 401 });
    }

    // 2. Parse & validate request payload
    const body = await req.json();
    const parseResult = competitionSubmissionSchema.safeParse(body);

    if (!parseResult.success) {
      const formattedErrors = parseResult.error.format();
      return NextResponse.json(
        { error: 'Validation failed', details: formattedErrors },
        { status: 400 }
      );
    }

    const validData = parseResult.data;

    // 3. Persist competition and private metadata (Instant Publishing!)
    const createdCompetition = db.createCompetition(
      {
        name: validData.name,
        organizer: validData.organizer,
        description: validData.description,
        category: validData.category as any,
        industry: validData.industry || undefined,
        registration_deadline: validData.registration_deadline,
        event_start_date: validData.event_start_date || undefined,
        event_end_date: validData.event_end_date || undefined,
        min_team_size: validData.min_team_size,
        max_team_size: validData.max_team_size,
        eligibility: validData.eligibility,
        mode: validData.mode,
        prize_details: validData.prize_details || undefined,
        entry_fee: validData.entry_fee || 'Free',
        official_source_url: validData.official_source_url || undefined,
        official_registration_url: validData.official_registration_url,
        poster_url: validData.poster_url || undefined,
        case_brief_url: validData.case_brief_url || undefined,
        additional_resources: validData.additional_resources || undefined,
        additional_notes: validData.additional_notes || undefined,
        location: validData.location || undefined,
        uploader_id: user.id,
        uploader_display_name: user.display_name,
      },
      user.email
    );

    // 4. Trigger Administrator notification asynchronously (non-blocking)
    sendAdminNewUploadNotification(createdCompetition, user.email).catch((err) => {
      console.error('Non-blocking admin email trigger error:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Competition published successfully',
        competition: createdCompetition,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error submitting competition:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
