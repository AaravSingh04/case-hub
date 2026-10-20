import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getCurrentUserServer } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required for uploads' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'poster';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate size (10MB for posters, 25MB for briefs)
    const maxPosterSize = 10 * 1024 * 1024;
    const maxBriefSize = 25 * 1024 * 1024;

    if (type === 'poster' && buffer.length > maxPosterSize) {
      return NextResponse.json({ error: 'Poster image size cannot exceed 10MB' }, { status: 400 });
    }
    if (type === 'brief' && buffer.length > maxBriefSize) {
      return NextResponse.json({ error: 'Case brief size cannot exceed 25MB' }, { status: 400 });
    }

    // Determine extension
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase() || (type === 'poster' ? '.jpg' : '.pdf');

    // Allowed extensions
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    const allowedDocExts = ['.pdf', '.doc', '.docx', '.txt'];

    if (type === 'poster' && !allowedImageExts.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported image format (${ext}). Allowed: JPG, PNG, WEBP, SVG` },
        { status: 400 }
      );
    }

    if (type === 'brief' && !allowedDocExts.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported document format (${ext}). Allowed: PDF, DOC, DOCX` },
        { status: 400 }
      );
    }

    // Save to public/uploads if filesystem is writable; fallback to data URI on read-only serverless platforms (Vercel)
    let publicUrl = '';
    const cleanBaseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const filename = `${type}_${Date.now()}_${cleanBaseName}${ext}`;

    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const destinationPath = path.join(uploadDir, filename);
      fs.writeFileSync(destinationPath, buffer);
      publicUrl = `/uploads/${filename}`;
    } catch (writeErr) {
      // Serverless read-only fallback: encode as data URI
      const mime = file.type || (type === 'poster' ? 'image/jpeg' : 'application/pdf');
      publicUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
