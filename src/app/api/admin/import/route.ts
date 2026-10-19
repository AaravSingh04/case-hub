import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { requireAdminUserServer } from '@/lib/auth/server';
import { COMPETITION_CATEGORIES, CompetitionCategory, CompetitionMode } from '@/lib/db/types';
import { isValidUrl } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUserServer();
    const { rows } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows provided for import' }, { status: 400 });
    }

    const validCompetitions: any[] = [];
    const rowErrors: { rowNumber: number; name?: string; errors: string[] }[] = [];

    rows.forEach((row: any, idx: number) => {
      const rowNum = idx + 1;
      const errors: string[] = [];

      const name = (row.name || row['Competition Name'] || '').toString().trim();
      const organizer = (row.organizer || row['Organizer'] || '').toString().trim();
      const description = (row.description || row['Description'] || '').toString().trim();
      const rawCategory = (row.category || row['Category'] || '').toString().trim();
      const industry = (row.industry || row['Industry'] || '').toString().trim();
      const rawDeadline = (row.registration_deadline || row['Registration Deadline'] || '').toString().trim();
      const rawMode = (row.mode || row['Mode'] || 'Online').toString().trim();
      const rawMinTeam = parseInt(row.min_team_size || row['Min Team Size'] || '1', 10);
      const rawMaxTeam = parseInt(row.max_team_size || row['Max Team Size'] || '1', 10);
      const eligibility = (row.eligibility || row['Eligibility'] || '').toString().trim();
      const regUrl = (row.official_registration_url || row['Official Registration URL'] || '').toString().trim();
      const prize = (row.prize_details || row['Prize Details'] || '').toString().trim();
      const fee = (row.entry_fee || row['Entry Fee'] || 'Free').toString().trim();
      const poster = (row.poster_url || row['Poster URL'] || '').toString().trim();

      if (!name) errors.push('Competition Name is required');
      if (!organizer) errors.push('Organizer is required');
      if (!description || description.length < 10) errors.push('Description must be at least 10 characters');

      // Category match
      let category: CompetitionCategory = 'Case Competitions';
      const matchedCategory = COMPETITION_CATEGORIES.find(
        (c) => c.toLowerCase() === rawCategory.toLowerCase()
      );
      if (matchedCategory) {
        category = matchedCategory;
      } else if (rawCategory) {
        errors.push(`Invalid category "${rawCategory}". Allowed: ${COMPETITION_CATEGORIES.join(', ')}`);
      } else {
        errors.push('Category is required');
      }

      // Deadline validation
      if (!rawDeadline || isNaN(Date.parse(rawDeadline))) {
        errors.push('Valid registration deadline date is required (YYYY-MM-DD)');
      }

      // Mode validation
      const modeNorm = rawMode.toLowerCase();
      let mode: CompetitionMode = 'Online';
      if (modeNorm === 'offline') mode = 'Offline';
      else if (modeNorm === 'hybrid') mode = 'Hybrid';
      else if (modeNorm === 'online') mode = 'Online';
      else errors.push('Competition Mode must be Online, Offline, or Hybrid');

      // Team size validation
      if (isNaN(rawMinTeam) || rawMinTeam < 1) errors.push('Min team size must be at least 1');
      if (isNaN(rawMaxTeam) || rawMaxTeam < rawMinTeam) errors.push('Max team size must be >= min team size');

      if (!eligibility) errors.push('Eligibility criteria is required');
      if (!regUrl || !isValidUrl(regUrl)) errors.push('Valid Official Registration URL is required');

      if (errors.length > 0) {
        rowErrors.push({ rowNumber: rowNum, name: name || 'Unnamed row', errors });
      } else {
        validCompetitions.push({
          name,
          organizer,
          description,
          category,
          industry: industry || undefined,
          registration_deadline: new Date(rawDeadline).toISOString(),
          min_team_size: rawMinTeam,
          max_team_size: rawMaxTeam,
          eligibility,
          mode,
          prize_details: prize || undefined,
          entry_fee: fee || 'Free',
          official_registration_url: regUrl,
          poster_url: poster || undefined,
          uploader_id: admin.id,
          uploader_display_name: `${admin.display_name} (Admin Import)`,
        });
      }
    });

    // Bulk persist valid rows (Instant Publishing!)
    const importedResults: any[] = [];
    for (const comp of validCompetitions) {
      const created = db.createCompetition(comp, admin.email);
      importedResults.push(created);
    }

    return NextResponse.json({
      success: true,
      totalProcessed: rows.length,
      importedCount: importedResults.length,
      errorsCount: rowErrors.length,
      rowErrors,
      importedCompetitions: importedResults,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
