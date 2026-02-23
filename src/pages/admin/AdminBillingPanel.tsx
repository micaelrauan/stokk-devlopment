import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Mail, Pencil, Plus, Search } from "lucide-react";

const from = (table: string) => (supabase as any).from(table);

type BillingCycle = "monthly" | "quarterly" | "semiannual" | "annual";
type BillingStatus = "active" | "overdue" | "paused" | "cancelled" | "trial";

interface CompanyProfile {
  id: string;
  company_name: string;
  plan: string | null;
  is_active: boolean | null;
}

interface CompanyBilling {
  id: string;
  company_id: string;
  billing_cycle: BillingCycle;
  plan_name: string | null;
  amount: number;
  due_day: number;
  next_due_date: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  payment_method: string | null;
  status: BillingStatus;
  grace_days: number;
  auto_renew: boolean;
  custom_description: string | null;
  notes: string | null;
  started_at: string | null;
  ended_at: string | null;
}

interface BillingRow extends CompanyProfile {
  billing: CompanyBilling | null;
}

interface BillingFormState {
  company_id: string;
  billing_cycle: BillingCycle;
  plan_name: string;
  amount: string;
  due_day: string;
  next_due_date: string;
  last_payment_date: string;
  last_payment_amount: string;
  payment_method: string;
  status: BillingStatus;
  grace_days: string;
  auto_renew: boolean;
  custom_description: string;
  notes: string;
  started_at: string;
  ended_at: string;
}

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

const STATUS_LABEL: Record<BillingStatus, string> = {
  active: "Ativa",
  overdue: "Em atraso",
  paused: "Pausada",
  cancelled: "Cancelada",
  trial: "Trial",
};

const STATUS_STYLE: Record<BillingStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-500",
  overdue: "bg-destructive/10 text-destructive",
  paused: "bg-amber-500/10 text-amber-500",
  cancelled: "bg-muted text-muted-foreground",
  trial: "bg-blue-500/10 text-blue-500",
};

function toDate(value?: string | null) {
  if (!value) return null;
  return new Date(`${value}T12:00:00`);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function getTodayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addMonthsWithDueDay(baseIso: string, months: number, dueDay: number) {
  const base = toDate(baseIso) ?? new Date();
  const targetYear = base.getFullYear();
  const targetMonth = base.getMonth() + months;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const safeDay = Math.min(Math.max(dueDay, 1), lastDay);
  const next = new Date(targetYear, targetMonth, safeDay, 12, 0, 0);
  const local = new Date(next.getTime() - next.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function cycleToMonths(cycle: BillingCycle) {
  if (cycle === "monthly") return 1;
  if (cycle === "quarterly") return 3;
  if (cycle === "semiannual") return 6;
  return 12;
}

function toMonthlyAmount(amount: number, cycle: BillingCycle) {
  const months = cycleToMonths(cycle);
  return amount / months;
}

const EMPTY_FORM: BillingFormState = {
  company_id: "",
  billing_cycle: "monthly",
  plan_name: "",
  amount: "",
  due_day: "10",
  next_due_date: "",
  last_payment_date: "",
  last_payment_amount: "",
  payment_method: "",
  status: "active",
  grace_days: "0",
  auto_renew: true,
  custom_description: "",
  notes: "",
  started_at: "",
  ended_at: "",
};

export default function AdminBillingPanel() {
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [billings, setBillings] = useState<CompanyBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendTargetCompanyId, setSendTargetCompanyId] = useState("");
  const [sendTargetCompanyName, setSendTargetCompanyName] = useState("");
  const [sendEmailSubject, setSendEmailSubject] = useState("");
  const [sendEmailHtml, setSendEmailHtml] = useState("");
  const [editingBillingId, setEditingBillingId] = useState<string | null>(null);
  const [form, setForm] = useState<BillingFormState>(EMPTY_FORM);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingBillingId(null);
    setShowAdvancedFields(false);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes, billingsRes] = await Promise.all([
        from("profiles").select("id, company_name, plan, is_active"),
        from("user_roles").select("user_id, role"),
        from("company_billings").select("*"),
      ]);

      const profilesData = profilesRes.data ?? [];
      const rolesData = rolesRes.data ?? [];
      const adminIds = new Set(
        rolesData.filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
      );

      const companyProfiles: CompanyProfile[] = profilesData
        .filter((p: any) => !adminIds.has(p.id))
        .map((p: any) => ({
          id: p.id,
          company_name: p.company_name || "Sem nome",
          plan: p.plan || "free",
          is_active: p.is_active ?? true,
        }))
        .sort((a, b) => a.company_name.localeCompare(b.company_name, "pt-BR"));

      const billingRows: CompanyBilling[] = (billingsRes.data ?? []).map((b: any) => ({
        id: b.id,
        company_id: b.company_id,
        billing_cycle: b.billing_cycle,
        plan_name: b.plan_name,
        amount: Number(b.amount ?? 0),
        due_day: Number(b.due_day ?? 10),
        next_due_date: b.next_due_date,
        last_payment_date: b.last_payment_date,
        last_payment_amount: b.last_payment_amount != null ? Number(b.last_payment_amount) : null,
        payment_method: b.payment_method,
        status: b.status,
        grace_days: Number(b.grace_days ?? 0),
        auto_renew: !!b.auto_renew,
        custom_description: b.custom_description,
        notes: b.notes,
        started_at: b.started_at,
        ended_at: b.ended_at,
      }));

      setProfiles(companyProfiles);
      setBillings(billingRows);
    } catch (err) {
      console.error("Erro ao carregar dados de mensalidades:", err);
      toast.error("Erro ao carregar dashboard de mensalidades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = useMemo<BillingRow[]>(() => {
    const billingMap = new Map<string, CompanyBilling>();
    for (const billing of billings) billingMap.set(billing.company_id, billing);

    return profiles.map((profile) => ({
      ...profile,
      billing: billingMap.get(profile.id) ?? null,
    }));
  }, [profiles, billings]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const haystack = `${row.company_name} ${row.plan || ""}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || row.billing?.status === (statusFilter as BillingStatus);
      const matchesCycle =
        cycleFilter === "all" || row.billing?.billing_cycle === (cycleFilter as BillingCycle);
      return matchesSearch && matchesStatus && matchesCycle;
    });
  }, [rows, search, statusFilter, cycleFilter]);

  const metrics = useMemo(() => {
    const today = toDate(getTodayIso()) ?? new Date();
    let overdue = 0;
    let dueSoon = 0;
    let active = 0;
    let projectedMrr = 0;

    for (const billing of billings) {
      if (billing.status === "active" || billing.status === "trial") active += 1;
      if (billing.status === "overdue") overdue += 1;
      if (billing.status !== "cancelled") {
        projectedMrr += toMonthlyAmount(Number(billing.amount || 0), billing.billing_cycle);
      }

      const dueDate = toDate(billing.next_due_date);
      if (!dueDate) continue;
      const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 7) dueSoon += 1;
    }

    const withoutSetup = rows.filter((r) => !r.billing).length;
    return { overdue, dueSoon, active, projectedMrr, withoutSetup };
  }, [billings, rows]);

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: BillingRow) => {
    if (!row.billing) {
      setForm({
        ...EMPTY_FORM,
        company_id: row.id,
        plan_name: row.plan || "",
      });
      setEditingBillingId(null);
      setShowForm(true);
      return;
    }

    const b = row.billing;
    setForm({
      company_id: b.company_id,
      billing_cycle: b.billing_cycle,
      plan_name: b.plan_name || row.plan || "",
      amount: String(b.amount ?? ""),
      due_day: String(b.due_day ?? 10),
      next_due_date: b.next_due_date || "",
      last_payment_date: b.last_payment_date || "",
      last_payment_amount: b.last_payment_amount != null ? String(b.last_payment_amount) : "",
      payment_method: b.payment_method || "",
      status: b.status,
      grace_days: String(b.grace_days ?? 0),
      auto_renew: !!b.auto_renew,
      custom_description: b.custom_description || "",
      notes: b.notes || "",
      started_at: b.started_at || "",
      ended_at: b.ended_at || "",
    });
    setEditingBillingId(b.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.company_id) {
      toast.error("Selecione uma empresa");
      return;
    }

    const amount = Number(form.amount);
    const dueDay = Number(form.due_day);
    const graceDays = Number(form.grace_days || 0);
    const lastPaymentAmount =
      form.last_payment_amount.trim() === "" ? null : Number(form.last_payment_amount);

    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Informe um valor de mensalidade válido");
      return;
    }
    if (Number.isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      toast.error("Dia de vencimento deve estar entre 1 e 31");
      return;
    }
    if (Number.isNaN(graceDays) || graceDays < 0) {
      toast.error("Carência deve ser zero ou positiva");
      return;
    }
    if (lastPaymentAmount != null && (Number.isNaN(lastPaymentAmount) || lastPaymentAmount < 0)) {
      toast.error("Último valor pago é inválido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(editingBillingId ? { id: editingBillingId } : {}),
        company_id: form.company_id,
        billing_cycle: form.billing_cycle,
        plan_name: form.plan_name || null,
        amount,
        due_day: dueDay,
        next_due_date: form.next_due_date || null,
        last_payment_date: form.last_payment_date || null,
        last_payment_amount: lastPaymentAmount,
        payment_method: form.payment_method || null,
        status: form.status,
        grace_days: graceDays,
        auto_renew: form.auto_renew,
        custom_description: form.custom_description || null,
        notes: form.notes || null,
        started_at: form.started_at || null,
        ended_at: form.ended_at || null,
      };

      const { error } = await from("company_billings").upsert(payload, {
        onConflict: "company_id",
      });

      if (error) {
        toast.error(`Erro ao salvar mensalidade: ${error.message}`);
        setSaving(false);
        return;
      }

      toast.success("Mensalidade salva com sucesso");
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(`Erro ao salvar mensalidade: ${err?.message || "desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterPayment = async (row: BillingRow) => {
    const billing = row.billing;
    if (!billing) {
      toast.error("Cadastre a mensalidade antes de registrar pagamento");
      return;
    }

    const today = getTodayIso();
    const nextDueDate = addMonthsWithDueDay(
      today,
      cycleToMonths(billing.billing_cycle),
      Number(billing.due_day || 10),
    );

    const { error } = await from("company_billings")
      .update({
        last_payment_date: today,
        last_payment_amount: billing.amount,
        next_due_date: nextDueDate,
        status: "active",
        reminder_3d_sent_at: null,
        due_day_sent_at: null,
      })
      .eq("id", billing.id);

    if (error) {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
      return;
    }

    toast.success("Pagamento registrado");
    fetchData();
  };

  const callBillingEmailFunction = async (body: Record<string, unknown>) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/billing-reminder-emails`;
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || data?.details || "Falha no envio de email");
    }

    return data;
  };

  const openSendEmailDialog = (row: BillingRow) => {
    const dueDate = row.billing?.next_due_date ? formatDate(row.billing.next_due_date) : "sem vencimento";
    const amount = row.billing ? formatMoney(row.billing.amount) : "—";
    setSendTargetCompanyId(row.id);
    setSendTargetCompanyName(row.company_name);
    setSendEmailSubject(`Stokk: mensagem sobre sua assinatura`);
    setSendEmailHtml(
      `<div style="font-family: Arial, sans-serif; line-height:1.5;">
  <h2>Olá, ${row.company_name}</h2>
  <p>Estamos entrando em contato sobre sua assinatura na Stokk.</p>
  <p>Próximo vencimento: <strong>${dueDate}</strong><br/>Valor: <strong>${amount}</strong></p>
  <p>Equipe Stokk</p>
</div>`,
    );
    setShowSendDialog(true);
  };

  const handleSendEmailToStore = async () => {
    if (!sendTargetCompanyId || !sendEmailSubject.trim() || !sendEmailHtml.trim()) {
      toast.error("Preencha assunto e conteúdo do email");
      return;
    }

    setSendingEmail(true);
    try {
      await callBillingEmailFunction({
        action: "send_to_store",
        companyId: sendTargetCompanyId,
        subject: sendEmailSubject,
        html: sendEmailHtml,
      });
      toast.success("Email enviado com sucesso");
      setShowSendDialog(false);
    } catch (err: any) {
      toast.error(`Erro ao enviar email: ${err?.message || "desconhecido"}`);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-semibold">Mensalidades das Empresas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de cobranças, vencimentos e pagamentos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.withoutSetup} empresa(s) sem configuração de cobrança
          </p>
        </div>
        <Button className="rounded-full px-6 gap-2 w-full sm:w-auto" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nova Mensalidade
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/40 p-4 bg-card/30">
          <p className="text-xs text-muted-foreground">Cobranças Ativas</p>
          <p className="text-2xl font-heading font-bold mt-1">{metrics.active}</p>
        </div>
        <div className="rounded-xl border border-border/40 p-4 bg-card/30">
          <p className="text-xs text-muted-foreground">Em Atraso</p>
          <p className="text-2xl font-heading font-bold mt-1 text-destructive">{metrics.overdue}</p>
        </div>
        <div className="rounded-xl border border-border/40 p-4 bg-card/30">
          <p className="text-xs text-muted-foreground">Vencendo em 7 dias</p>
          <p className="text-2xl font-heading font-bold mt-1 text-amber-500">{metrics.dueSoon}</p>
        </div>
        <div className="rounded-xl border border-border/40 p-4 bg-card/30">
          <p className="text-xs text-muted-foreground">MRR Projetado</p>
          <p className="text-xl font-heading font-bold mt-1 text-emerald-500">
            {formatMoney(metrics.projectedMrr)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10 h-10 rounded-xl"
            placeholder="Buscar por empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="overdue">Em atraso</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cycleFilter} onValueChange={setCycleFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
            <SelectValue placeholder="Ciclo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Ciclos</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="quarterly">Trimestral</SelectItem>
            <SelectItem value="semiannual">Semestral</SelectItem>
            <SelectItem value="annual">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Carregando mensalidades...</div>
        ) : filteredRows.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed rounded-xl">
            Nenhum registro encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-muted/50 border-b border-border/60">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Plano/Ciclo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Vencimento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Último Pagamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.company_name}</p>
                      <p className="text-xs text-muted-foreground">{row.is_active ? "Conta ativa" : "Conta inativa"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {row.billing ? `${row.billing.plan_name || row.plan || "free"} • ${CYCLE_LABEL[row.billing.billing_cycle]}` : "Sem mensalidade"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {row.billing ? formatMoney(row.billing.amount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {row.billing ? `Dia ${row.billing.due_day} • ${formatDate(row.billing.next_due_date)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {row.billing ? formatDate(row.billing.last_payment_date) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.billing ? (
                        <span className={`text-[11px] uppercase px-2 py-1 rounded font-bold ${STATUS_STYLE[row.billing.status]}`}>
                          {STATUS_LABEL[row.billing.status]}
                        </span>
                      ) : (
                        <span className="text-[11px] uppercase px-2 py-1 rounded font-bold bg-amber-500/10 text-amber-500">
                          Sem mensalidade
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          className="rounded-lg h-9"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          {row.billing ? "Editar" : "Configurar"}
                        </Button>
                        <Button
                          variant="default"
                          className="rounded-lg h-9"
                          onClick={() => handleRegisterPayment(row)}
                          disabled={!row.billing}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Pago
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-lg h-9"
                          onClick={() => openSendEmailDialog(row)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar Email
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingBillingId ? "Editar Mensalidade" : "Nova Mensalidade"}
            </DialogTitle>
            <DialogDescription>
              Defina ciclo, vencimento, histórico de pagamento e observações da cobrança.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="md:col-span-2 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cobrança</p>
            </div>
            <div className="md:col-span-2">
              <Label>Empresa *</Label>
              <Select
                value={form.company_id}
                onValueChange={(value) => setForm((prev) => ({ ...prev, company_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de mensalidade *</Label>
              <Select
                value={form.billing_cycle}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, billing_cycle: value as BillingCycle }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="semiannual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as BillingStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="overdue">Em atraso</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Nome do plano comercial</Label>
              <Input
                value={form.plan_name}
                onChange={(e) => setForm((prev) => ({ ...prev, plan_name: e.target.value }))}
                placeholder="Ex: Premium 2026"
              />
            </div>
            <div>
              <Label>Dia de vencimento *</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={form.due_day}
                onChange={(e) => setForm((prev) => ({ ...prev, due_day: e.target.value }))}
              />
            </div>
            <div>
              <Label>Carência (dias)</Label>
              <Input
                type="number"
                min="0"
                value={form.grace_days}
                onChange={(e) => setForm((prev) => ({ ...prev, grace_days: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 border-t border-border/60 pt-3 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagamento</p>
            </div>
            <div>
              <Label>Próximo vencimento</Label>
              <Input
                type="date"
                value={form.next_due_date}
                onChange={(e) => setForm((prev) => ({ ...prev, next_due_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data do último pagamento</Label>
              <Input
                type="date"
                value={form.last_payment_date}
                onChange={(e) => setForm((prev) => ({ ...prev, last_payment_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Valor do último pagamento</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.last_payment_amount}
                onChange={(e) => setForm((prev) => ({ ...prev, last_payment_amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Método de pagamento</Label>
              <Input
                value={form.payment_method}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                placeholder="PIX, cartão, boleto..."
              />
            </div>
            <div className="md:col-span-2 border-t border-border/60 pt-3">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setShowAdvancedFields((v) => !v)}
              >
                {showAdvancedFields ? "Ocultar campos avançados" : "Mostrar campos avançados"}
              </button>
            </div>
            {showAdvancedFields && (
              <>
                <div className="md:col-span-2 pb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avançado</p>
                </div>
            <div>
              <Label>Início do contrato</Label>
              <Input
                type="date"
                value={form.started_at}
                onChange={(e) => setForm((prev) => ({ ...prev, started_at: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fim do contrato</Label>
              <Input
                type="date"
                value={form.ended_at}
                onChange={(e) => setForm((prev) => ({ ...prev, ended_at: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição personalizada</Label>
              <Textarea
                value={form.custom_description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, custom_description: e.target.value }))
                }
                placeholder="Resumo visível no dashboard (benefícios, observações comerciais, etc)"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Observações internas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas do financeiro e histórico de negociação"
                rows={3}
              />
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/50 px-4 py-3 gap-3">
              <div>
                <p className="font-medium">Renovação automática</p>
                <p className="text-xs text-muted-foreground">Quando ativa, o contrato é renovado no fim do ciclo</p>
              </div>
              <Button
                type="button"
                variant={form.auto_renew ? "default" : "outline"}
                onClick={() => setForm((prev) => ({ ...prev, auto_renew: !prev.auto_renew }))}
              >
                {form.auto_renew ? "Ativa" : "Inativa"}
              </Button>
            </div>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Salvando..." : "Salvar Mensalidade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Enviar Email para Loja</DialogTitle>
            <DialogDescription>
              Envio manual para <strong>{sendTargetCompanyName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Assunto</Label>
              <Input value={sendEmailSubject} onChange={(e) => setSendEmailSubject(e.target.value)} />
            </div>
            <div>
              <Label>Conteúdo HTML</Label>
              <Textarea
                value={sendEmailHtml}
                onChange={(e) => setSendEmailHtml(e.target.value)}
                rows={8}
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSendDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSendEmailToStore} disabled={sendingEmail} className="w-full sm:w-auto">
              {sendingEmail ? "Enviando..." : "Enviar Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


