import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Restrict CORS to your production domain only
const ALLOWED_ORIGINS = [
  "https://stokk-devlopment.vercel.app",
  "http://127.0.0.1:5173", // local dev
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
<<<<<<< HEAD
  const origin = req.headers.get("Origin");
  console.log(`Request from origin: ${origin}`);
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
=======
  const origin = req.headers.get("Origin") || "";
  // In development, allow any origin; in production, use allowed origins
  const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";
  const allowedOrigin = isDevelopment 
    ? (origin || "*")
    : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
>>>>>>> 3ea5c60
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
<<<<<<< HEAD
    "Access-Control-Max-Age": "86400",
=======
    "Access-Control-Allow-Credentials": "true",
>>>>>>> 3ea5c60
  };
}

// UUID v4 regex validation
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Password strength validation
function isStrongPassword(pw: string): boolean {
  return (
    pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)
  );
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Log request info for debugging
  const hasAuth = !!req.headers.get("Authorization");
  console.log(`${req.method} ${req.url} - Auth: ${hasAuth}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No Authorization header found");
      return new Response(JSON.stringify({ error: "Não autorizado: Token não fornecido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("Empty token after Bearer removal");
      return new Response(JSON.stringify({ error: "Não autorizado: Token vazio" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user: caller },
      error: getUserError,
    } = await supabaseAdmin.auth.getUser(token);
    
    if (getUserError) {
      console.error("getUser error:", getUserError.message);
    } else if (caller) {
      console.log(`Authenticated as: ${caller.email} (${caller.id})`);
    }
    
    if (getUserError) {
      console.error("getUser error:", getUserError);
      return new Response(JSON.stringify({ error: `Token inválido: ${getUserError.message}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!caller) {
      console.error("No user found for token");
      return new Response(JSON.stringify({ error: "Token inválido: Usuário não encontrado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role - using service role key bypasses RLS automatically
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .limit(1);

    const isAdmin = adminRoles && adminRoles.length > 0;

    if (rolesError) {
      console.error("Error checking admin role:", rolesError.message);
      return new Response(JSON.stringify({ 
        error: `Erro ao verificar permissões: ${rolesError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdmin) {
      console.error(`Access denied: ${caller.email} (${caller.id}) is not an admin`);
      return new Response(JSON.stringify({ 
        error: "Acesso negado: Você não tem permissão de administrador. Verifique se sua conta tem a role 'admin' na tabela user_roles."
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Admin access granted: ${caller.email}`);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Action: list users (get emails)
    if (action === "list" && req.method === "GET") {
      const {
        data: { users },
        error,
      } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      const userMap = users.map((u) => ({ id: u.id, email: u.email }));
      return new Response(JSON.stringify(userMap), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: create user (server-side, avoids session hijack)
    if (action === "create" && req.method === "POST") {
      const {
        email,
        password,
        companyName,
        cnpj,
        address,
        phone,
        plan,
        provider,
      } = await req.json();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: "Email inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!password || !isStrongPassword(password)) {
        return new Response(
          JSON.stringify({
            error:
              "Senha deve ter no mínimo 8 caracteres com maiúscula, minúscula e número",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (!companyName) {
        return new Response(
          JSON.stringify({ error: "Nome da empresa é obrigatório" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Create user via admin API (does not affect caller's session)
      // email_confirm: false - usuário pode fazer login imediatamente sem confirmar email
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
<<<<<<< HEAD
          email_confirm: true,
          user_metadata: {
            company_name: companyName,
          },
=======
          email_confirm: false,
>>>>>>> 3ea5c60
        });
      if (createError) throw createError;

      // Ensure profile exists and has company data
      if (newUser.user) {
<<<<<<< HEAD
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: newUser.user.id,
            company_name: companyName,
            cnpj: cnpj || null,
            address: address || null,
            phone: phone || null,
            plan: plan || "free",
            provider: provider || null,
            is_active: true,
          });
        if (profileError) throw profileError;

        // Also assign a default 'user' role
        await supabaseAdmin.from("user_roles").upsert({
          user_id: newUser.user.id,
          role: "user",
        });
=======
        // Wait a bit for trigger to complete (if it exists)
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", newUser.user.id)
          .maybeSingle();
        
        // If checkError is not a "not found" error, log it but continue
        if (checkError && checkError.code !== 'PGRST116') {
          console.error("Profile check error:", checkError);
        }
        
        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
              company_name: companyName,
              cnpj: cnpj || null,
              address: address || null,
              phone: phone || null,
              plan: plan || "free",
              provider: provider || null,
              is_active: true,
            })
            .eq("id", newUser.user.id);
          if (updateError) {
            console.error("Profile update error:", updateError);
            throw updateError;
          }
        } else {
          // Insert new profile
          const { error: insertError } = await supabaseAdmin
            .from("profiles")
            .insert({
              id: newUser.user.id,
              company_name: companyName,
              cnpj: cnpj || null,
              address: address || null,
              phone: phone || null,
              plan: plan || "free",
              provider: provider || null,
              is_active: true,
            });
          if (insertError) {
            console.error("Profile insert error:", insertError);
            throw insertError;
          }
        }
>>>>>>> 3ea5c60
      }

      return new Response(
        JSON.stringify({
          message: "Empresa criada com sucesso",
          userId: newUser.user?.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Action: update user
    if (action === "update" && req.method === "POST") {
      const { userId, email, password } = await req.json();

      // Validate userId is a valid UUID
      if (!userId || !UUID_RE.test(userId)) {
        return new Response(
          JSON.stringify({ error: "ID de usuário inválido" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Prevent admin from modifying their own account via this endpoint
      if (userId === caller.id) {
        return new Response(
          JSON.stringify({
            error:
              "Use as configurações de conta para alterar seus próprios dados",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
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
          return new Response(
            JSON.stringify({
              error:
                "Senha deve ter no mínimo 8 caracteres com maiúscula, minúscula e número",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        updateData.password = password;
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ message: "Nada para atualizar" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        updateData,
      );
      if (error) throw error;

      return new Response(JSON.stringify({ message: "Usuário atualizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
<<<<<<< HEAD
    console.error("Error in admin-update-user function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
=======
    // Log error for debugging (server-side only)
    console.error("Edge function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    // Return more specific error message for debugging
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor",
        details: errorMessage 
      }), 
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
>>>>>>> 3ea5c60
  }
});
