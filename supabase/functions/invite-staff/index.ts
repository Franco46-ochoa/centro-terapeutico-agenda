// =============================================================================
// SUPABASE EDGE FUNCTION: invite-staff
// Permite únicamente al rol 'admin' con MFA activo (aal2) invitar personal
// al centro terapéutico (Registro público deshabilitado).
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile } = await userClient
      .from('user_profiles')
      .select('role, center_id, is_active')
      .eq('id', user.id)
      .single();

    if (!callerProfile?.is_active || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Solo Dirección/Admin puede invitar personal' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, fullName, role, licenseNumber } = await req.json();

    if (!['admin', 'profesional', 'recepcion'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Rol inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: invited, error: inviteErr } =
      await adminClient.auth.admin.inviteUserByEmail(email);

    if (inviteErr || !invited.user) {
      return new Response(
        JSON.stringify({ error: inviteErr?.message ?? 'No se pudo enviar la invitación' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await adminClient.from('user_profiles').insert({
      id: invited.user.id,
      center_id: callerProfile.center_id,
      full_name: fullName,
      license_number: licenseNumber ?? null,
      role,
      is_active: true,
    });

    await userClient.from('audit_logs').insert({
      center_id: callerProfile.center_id,
      actor_id: user.id,
      actor_role: callerProfile.role,
      action: 'STAFF_INVITED',
      table_name: 'user_profiles',
      record_id: invited.user.id,
      metadata: { invitedEmail: email, assignedRole: role },
    });

    return new Response(JSON.stringify({ ok: true, userId: invited.user.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
