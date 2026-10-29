import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { createProject, listProjects, deleteProject } from '@/lib/files';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await listProjects(session.user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await createProject(session.user.id, {
      name,
      description: typeof body?.description === 'string' ? body.description : undefined,
      color: typeof body?.color === 'string' ? body.color : undefined,
    });

    try {
      await auditLog(session.user.id, 'CREATE_PROJECT', 'project', { projectId: project.id, name: project.name }, request);
    } catch {}

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    if (!projectId) {
      return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
    }

    const result = await deleteProject(session.user.id, projectId);
    if (result.count === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    try {
      await auditLog(session.user.id, 'DELETE_PROJECT', 'project', { projectId }, request);
    } catch {}

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}