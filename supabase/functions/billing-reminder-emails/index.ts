import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://stokk-development.vercel.app",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
];

type BillingRow = {
  id: string;
  company_id: string;
  next_due_date: string | null;
  grace_days: number | null;
  billing_cycle: string;
  amount: number;
  plan_name: string | null;
  status: string;
  reminder_3d_subject: string | null;
  reminder_3d_body_html: string | null;
  due_day_subject: string | null;
  due_day_body_html: string | null;
  profiles: { company_name: string | null } | null;
};

type GlobalTemplateRow = {
  template_key: "reminder_3d" | "due_day";
  subject: string | null;
  body_html: string | null;
};

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";
  const allowedOrigin = isDevelopment
    ? origin || "*"
    : ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

function jsonResponse(body: unknown, status: number, req: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(baseIso: string, days: number) {
  const date = new Date(`${baseIso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function formatDate(isoDate: string) {
  const dt = new Date(`${isoDate}T12:00:00.000Z`);
  return dt.toLocaleDateString("pt-BR");
}

function toPlainText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function renderTemplate(template: string, data: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => data[key] ?? "");
}

async function assertAuthorized(req: Request, supabaseAdmin: ReturnType<typeof createClient>) {
  const cronSecret = Deno.env.get("BILLING_REMINDER_SECRET");
  const reqSecret = req.headers.get("x-cron-secret");

  if (cronSecret && reqSecret && reqSecret === cronSecret) {
    return true;
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return false;
  }

  const { data: adminRole } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .limit(1);

  return !!(adminRole && adminRole.length > 0);
}

async function sendEmailWithResend(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");

  if (!apiKey || !fromEmail) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text: toPlainText(html),
      reply_to: fromEmail,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend error (${response.status}): ${details}`);
  }
}

function defaultThreeDaysSubject(dueDate: string) {
  return `Stokk: sua assinatura vence em 3 dias (${formatDate(dueDate)})`;
}

function defaultDueDaySubject(dueDate: string) {
  return `Stokk: assinatura vence hoje (${formatDate(dueDate)})`;
}

function buildThreeDaysHtml(companyName: string, dueDate: string, amount: number, planName: string | null) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Sua assinatura vence em 3 dias</h2>
      <p>Oi, ${companyName}.</p>
      <p>Sua assinatura ${planName ? `(${planName}) ` : ""}vence em <strong>${formatDate(dueDate)}</strong>.</p>
      <p>Valor da cobranca: <strong>${formatCurrency(amount)}</strong>.</p>
      <p>Para evitar bloqueio do acesso, realize o pagamento ate a data de vencimento.</p>
      <p style="margin-top: 16px;">Equipe Stokk</p>
    </div>
  `;
}

function buildDueDayHtml(
  companyName: string,
  dueDate: string,
  amount: number,
  graceDays: number,
  planName: string | null,
) {
  const graceText = graceDays > 0
    ? `Seu acesso podera ser bloqueado em ${graceDays} dia(s), caso o pagamento nao seja identificado.`
    : "Seu acesso podera ser bloqueado em breve, caso o pagamento nao seja identificado.";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 8px;">Sua assinatura vence hoje</h2>
      <p>Oi, ${companyName}.</p>
      <p>A assinatura ${planName ? `(${planName}) ` : ""}vence hoje, <strong>${formatDate(dueDate)}</strong>.</p>
      <p>Valor da cobranca: <strong>${formatCurrency(amount)}</strong>.</p>
      <p>${graceText}</p>
      <p style="margin-top: 16px;">Equipe Stokk</p>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authorized = await assertAuthorized(req, supabaseAdmin);
    if (!authorized) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (action === "send_to_store") {
      const companyId = body?.companyId as string | undefined;
      const billingId = body?.billingId as string | undefined;
      const subject = body?.subject as string | undefined;
      const html = body?.html as string | undefined;

      if ((!companyId && !billingId) || !subject || !html) {
        return jsonResponse({ error: "companyId or billingId, plus subject and html are required" }, 400, req);
      }

      let resolvedCompanyId = companyId;
      if (!resolvedCompanyId && billingId) {
        const { data: billingData, error: billingError } = await supabaseAdmin
          .from("company_billings")
          .select("company_id")
          .eq("id", billingId)
          .single();
        if (billingError || !billingData?.company_id) {
          return jsonResponse({ error: "Could not resolve company from billingId" }, 404, req);
        }
        resolvedCompanyId = billingData.company_id as string;
      }

      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(resolvedCompanyId!);
      if (userError || !userData.user?.email) {
        return jsonResponse({ error: "Could not resolve store email" }, 404, req);
      }

      await sendEmailWithResend(userData.user.email, subject, html);
      return jsonResponse({ ok: true, sentTo: userData.user.email }, 200, req);
    }

    const today = todayIso();
    const threeDaysAhead = addDaysIso(today, 3);

    const [
      { data: threeDayRows, error: threeDayError },
      { data: dueTodayRows, error: dueTodayError },
      { data: globalTemplatesRows, error: globalTemplatesError },
    ] =
      await Promise.all([
        supabaseAdmin
          .from("company_billings")
          .select("id, company_id, next_due_date, grace_days, billing_cycle, amount, plan_name, status, reminder_3d_subject, reminder_3d_body_html, due_day_subject, due_day_body_html, profiles:company_id(company_name)")
          .eq("next_due_date", threeDaysAhead)
          .is("reminder_3d_sent_at", null)
          .in("status", ["active", "trial"]),
        supabaseAdmin
          .from("company_billings")
          .select("id, company_id, next_due_date, grace_days, billing_cycle, amount, plan_name, status, reminder_3d_subject, reminder_3d_body_html, due_day_subject, due_day_body_html, profiles:company_id(company_name)")
          .eq("next_due_date", today)
          .is("due_day_sent_at", null)
          .in("status", ["active", "trial", "overdue"]),
        supabaseAdmin
          .from("billing_email_templates_global")
          .select("template_key, subject, body_html"),
      ]);

    if (threeDayError) throw threeDayError;
    if (dueTodayError) throw dueTodayError;
    if (globalTemplatesError) throw globalTemplatesError;

    const globalTemplates = new Map<string, GlobalTemplateRow>();
    for (const row of (globalTemplatesRows ?? []) as GlobalTemplateRow[]) {
      globalTemplates.set(row.template_key, row);
    }

    const sendResults = {
      threeDays: { attempted: 0, sent: 0, failed: 0 },
      dueToday: { attempted: 0, sent: 0, failed: 0 },
    };

    const failures: Array<{ billingId: string; type: "threeDays" | "dueToday"; reason: string }> = [];

    const sendBatch = async (rows: BillingRow[], type: "threeDays" | "dueToday") => {
      for (const row of rows) {
        sendResults[type].attempted += 1;

        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(row.company_id);
          if (userError || !userData.user?.email) {
            throw new Error("Could not resolve user email");
          }

          const email = userData.user.email;
          const companyName = row.profiles?.company_name || "Cliente";
          const dueDate = row.next_due_date || today;
          const amount = Number(row.amount || 0);
          const templateData = {
            company_name: companyName,
            due_date: formatDate(dueDate),
            amount: formatCurrency(amount),
            plan_name: row.plan_name || "Plano",
            grace_days: String(Number(row.grace_days || 0)),
          };

          const globalTemplate = type === "threeDays"
            ? globalTemplates.get("reminder_3d")
            : globalTemplates.get("due_day");

          const subject = type === "threeDays"
            ? renderTemplate(
              row.reminder_3d_subject || globalTemplate?.subject || defaultThreeDaysSubject(dueDate),
              templateData,
            )
            : renderTemplate(
              row.due_day_subject || globalTemplate?.subject || defaultDueDaySubject(dueDate),
              templateData,
            );

          const html = type === "threeDays"
            ? (row.reminder_3d_body_html
              ? renderTemplate(row.reminder_3d_body_html, templateData)
              : (globalTemplate?.body_html
                ? renderTemplate(globalTemplate.body_html, templateData)
                : buildThreeDaysHtml(companyName, dueDate, amount, row.plan_name)))
            : (row.due_day_body_html
              ? renderTemplate(row.due_day_body_html, templateData)
              : (globalTemplate?.body_html
                ? renderTemplate(globalTemplate.body_html, templateData)
                : buildDueDayHtml(companyName, dueDate, amount, Number(row.grace_days || 0), row.plan_name)));

          await sendEmailWithResend(email, subject, html);

          const field = type === "threeDays" ? "reminder_3d_sent_at" : "due_day_sent_at";
          const { error: updateError } = await supabaseAdmin
            .from("company_billings")
            .update({ [field]: new Date().toISOString() })
            .eq("id", row.id);

          if (updateError) throw updateError;

          sendResults[type].sent += 1;
        } catch (error) {
          sendResults[type].failed += 1;
          failures.push({
            billingId: row.id,
            type,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    };

    await sendBatch((threeDayRows ?? []) as BillingRow[], "threeDays");
    await sendBatch((dueTodayRows ?? []) as BillingRow[], "dueToday");

    return jsonResponse(
      {
        ok: true,
        date: today,
        threeDaysAhead,
        summary: sendResults,
        failures,
      },
      200,
      req,
    );
  } catch (error) {
    console.error("billing-reminder-emails error:", error);
    return jsonResponse(
      {
        error: "Internal error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
      req,
    );
  }
});
