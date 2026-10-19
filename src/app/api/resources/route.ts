import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/storage';
import { requireAdminUserServer } from '@/lib/auth/server';
import { ResourceCategory, ResourceType } from '@/lib/db/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const resources = db.getCaseResources(category);
    return NextResponse.json({ resources });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUserServer();
    const { title, description, category, resource_type, url } = await req.json();

    if (!title || !description || !category || !resource_type || !url) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const newRes = db.createCaseResource({
      title: title.trim(),
      description: description.trim(),
      category: category as ResourceCategory,
      resource_type: resource_type as ResourceType,
      url: url.trim(),
      created_by: admin.display_name,
    });

    return NextResponse.json({ success: true, resource: newRes }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
