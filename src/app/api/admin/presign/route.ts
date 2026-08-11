import { NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const { filename, contentType, folder } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 });
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folderPrefix = folder ? `${folder}/` : 'uploads/';
    const key = `${folderPrefix}${Date.now()}_${cleanFilename}`;

    const uploadUrl = await getPresignedUploadUrl(key, contentType, 3600);

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate pre-signed URL' }, { status: 500 });
  }
}
