import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Restrict CORS to your production domain only
const ALLOWED_ORIGINS = [
  "https://stokk-devlopment.vercel.app",
  "http://127.0.0.1:5173",      // local dev
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// UUID v4 regex validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Password strength validation
function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Action: list users (get emails)
    if (action === "list" && req.method === "GET") {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      const userMap = users.map((u) => ({ id: u.id, email: u.email }));
      return new Response(JSON.stringify(userMap), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: create user (server-side, avoids session hijack)
    if (action === "create" && req.method === "POST") {
      const { email, password, companyName, cnpj, address, phone, plan, provider } = await req.json();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: "Email inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!password || !isStrongPassword(password)) {
        return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 8 caracteres com maiúscula, minúscula e número" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!companyName) {
        return new Response(JSON.stringify({ error: "Nome da empresa é obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user via admin API (does not affect caller's session)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError) throw createError;

      // Update profile with company data
      if (newUser.user) {
        await supabaseAdmin.from("profiles").update({
          company_name: companyName,
          cnpj: cnpj || null,
          address: address || null,
          phone: phone || null,
          plan: plan || "free",
          provider: provider || null,
        }).eq("id", newUser.user.id);
      }

      return new Response(JSON.stringify({ message: "Empresa criada com sucesso", userId: newUser.user?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: update user
    if (action === "update" && req.method === "POST") {
      const { userId, email, password } = await req.json();

      // Validate userId is a valid UUID
      if (!userId || !UUID_RE.test(userId)) {
        return new Response(JSON.stringify({ error: "ID de usuário inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent admin from modifying their own account via this endpoint
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "Use as configurações de conta para alterar seus próprios dados" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updateData: Record<string, string> = {};
      if (email) {
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return new Response(JSON.stringify({ error: "Email inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        updateData.email = email;
      }
      if (password) {
        if (!isStrongPassword(password)) {
          return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 8 caracteres com maiúscula, minúscula e número" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        updateData.password = password;
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ message: "Nada para atualizar" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
      if (error) throw error;

      return new Response(JSON.stringify({ message: "Usuário atualizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    // Never leak internal error details to the client
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
