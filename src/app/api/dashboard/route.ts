import { NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { getCurrentUserServer } from '@/lib/auth/server';
import { getDeadlineStatus } from '@/lib/utils';

export async function GET() {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const stats = db.getStudentStats(user.id);
    const allActive = db.getCompetitions({ limit: 50 }).competitions;

    // Filter upcoming deadlines from saved
    const upcomingDeadlines = stats.savedCompetitions
      .filter((c) => getDeadlineStatus(c.registration_deadline) !== 'closed')
      .sort((a, b) => new Date(a.registration_deadline).getTime() - new Date(b.registration_deadline).getTime());

    // Team activity
    const allTeams = db.getTeamListings('');
    const state = (db as any);
    // Find all team listings where user is a member
    const teamState = db.getTeamListings('comp_mck_strat_2026').concat(db.getTeamListings('comp_hul_lime_2026'));

    // Intelligent recommendations based on saved or program of study
    const savedCategories = new Set(stats.savedCompetitions.map((c) => c.category));
    let recommended = allActive.filter(
      (c) =>
        c.uploader_id !== user.id &&
        !stats.savedCompetitions.some((s) => s.id === c.id) &&
        (savedCategories.size === 0 || savedCategories.has(c.category))
    );

    if (recommended.length < 3) {
      recommended = allActive.filter(
        (c) => c.uploader_id !== user.id && !stats.savedCompetitions.some((s) => s.id === c.id)
      );
    }

    return NextResponse.json({
      user,
      stats: {
        uploadedCount: stats.uploadedCount,
        savedCount: stats.savedCount,
        closingSoonCount: stats.closingSoonCount,
        teamsJoinedCount: stats.teamsJoinedCount,
      },
      upcomingDeadlines,
      myPosts: stats.myPosts,
      savedCompetitions: stats.savedCompetitions,
      closingSoonAlerts: stats.closingSoonSaved,
      recommended: recommended.slice(0, 4),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
