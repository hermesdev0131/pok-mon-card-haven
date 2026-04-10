import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }
    const clean = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(clean)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    // List all users (paginated). For a marketplace, thousands of users is manageable.
    // In the future this should be replaced with a dedicated RPC function for scale.
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) {
      console.error('[check-email]', error);
      return NextResponse.json({ error: 'Erro ao verificar email' }, { status: 500 });
    }

    const exists = (data?.users ?? []).some(
      (u: { email?: string | null }) => u.email?.toLowerCase() === clean,
    );

    return NextResponse.json({ exists });
  } catch (err) {
    console.error('[check-email]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
