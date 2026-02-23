import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Search,
  X,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

interface CompanyUser {
  id: string;
  email: string;
  company_name: string;
  cnpj: string;
  address: string;
  phone: string;
  plan: string;
  provider: string;
  is_active: boolean;
  created_at: string;
  role: string;
  total_products?: number;
  total_sales?: number;
  total_revenue?: number;
}

export default function CompanyPanel() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newCnpj, setNewCnpj] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPlan, setNewPlan] = useState("free");
  const [newProvider, setNewProvider] = useState("");
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<CompanyUser | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [detailUser, setDetailUser] = useState<CompanyUser | null>(null);
  const [cancelUserId, setCancelUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const callAdminUpdateUser = useCallback(
    async (action: "list" | "create" | "update", method: "GET" | "POST", body?: unknown) => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user?action=${action}`;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const doRequest = async (accessToken: string) =>
        fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        });

      const { data: sessionData } = await supabase.auth.getSession();
      let accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshed.session?.access_token) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        accessToken = refreshed.session.access_token;
      }

      let res = await doRequest(accessToken);
      if (res.status === 401) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshed.session?.access_token) {
          res = await doRequest(refreshed.session.access_token);
        }
      }

      return res;
    },
    [],
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        from("profiles").select("*"),
        from("user_roles").select("user_id, role"),
      ]);
      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];
      const adminIds = new Set(
        roles.filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
      );
      const userProfiles = profiles.filter((p: any) => !adminIds.has(p.id));

      // Fetch emails from admin edge function
      let emailMap: Record<string, string> = {};
      try {
        const listRes = await callAdminUpdateUser("list", "GET");
        if (listRes.ok) {
          const users = await listRes.json();
          users.forEach((u: any) => {
            emailMap[u.id] = u.email;
          });
        }
      } catch (err) {
        console.error("Erro ao buscar emails via edge function:", err);
      }

      // Fetch stats per user
      const mapped: CompanyUser[] = await Promise.all(
        userProfiles.map(async (p: any) => {
          const [productsRes, salesRes] = await Promise.all([
            from("products")
              .select("id", { count: "exact", head: true })
              .eq("user_id", p.id),
            from("sales").select("total").eq("user_id", p.id),
          ]);
          const totalRevenue = (salesRes.data ?? []).reduce(
            (s: number, r: any) => s + Number(r.total),
            0,
          );
          return {
            id: p.id,
            email: emailMap[p.id] || "",
            company_name: p.company_name,
            cnpj: p.cnpj,
            address: p.address,
            phone: p.phone,
            plan: p.plan,
            provider: p.provider,
            is_active: p.is_active,
            created_at: p.created_at,
            role: "user",
            total_products: productsRes.count ?? 0,
            total_sales: (salesRes.data ?? []).length,
            total_revenue: totalRevenue,
          };
        }),
      );

      setUsers(mapped);
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
      toast.error("Erro ao carregar lista de empresas");
    } finally {
      setIsLoading(false);
    }
  }, [callAdminUpdateUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.cnpj || "").includes(search) ||
      (u.provider || "").toLowerCase().includes(search.toLowerCase());
    const matchesPlan = filterPlan === "all" || u.plan === filterPlan;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.is_active) ||
      (filterStatus === "inactive" && !u.is_active);
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleCreate = async () => {
    if (!newEmail || !newPassword || !newCompany) {
      toast.error("Preencha email, senha e nome da empresa");
      return;
    }
    // Client-side password strength validation
    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      toast.error(
        "Senha deve ter no mínimo 8 caracteres com maiúscula, minúscula e número",
      );
      return;
    }
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Email inválido");
      return;
    }
    setCreating(true);
    try {
      const createRes = await callAdminUpdateUser("create", "POST", {
        email: newEmail,
        password: newPassword,
        companyName: newCompany,
        cnpj: newCnpj,
        address: newAddress,
        phone: newPhone,
        plan: newPlan,
        provider: newProvider,
      });

      let result: any = {};
      try {
        result = await createRes.json();
      } catch (jsonErr) {
        console.error("Erro ao parsear resposta da função edge:", jsonErr);
      }
      
      if (!createRes.ok) {
        toast.error(
          result.error ||
            result.message ||
            "Erro ao criar empresa. Verifique as permissões.",
        );
        setCreating(false);
        return;
      }

      toast.success(`Empresa "${newCompany}" criada com sucesso!`);
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
      setNewCompany("");
      setNewCnpj("");
      setNewAddress("");
      setNewPhone("");
      setNewPlan("free");
      setNewProvider("");
      fetchUsers();
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err);
      toast.error("Erro ao criar empresa: " + msg);
    }
    setCreating(false);
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    const { error } = await from("profiles")
      .update({ is_active: !currentActive })
      .eq("id", userId);
    if (error) {
      toast.error("Erro ao alterar status da empresa: " + error.message);
      return;
    }
    toast.success(currentActive ? "Empresa desativada" : "Empresa ativada");
    fetchUsers();
  };

  const handleCancelAccount = async () => {
    if (!cancelUserId) return;
    await from("profiles")
      .update({ is_active: false, plan: "free" })
      .eq("id", cancelUserId);
    toast.success("Conta cancelada e plano revertido para gratuito");
    setCancelUserId(null);
    fetchUsers();
  };

  const handleDeleteAccount = async () => {
    if (!deleteUserId) return;
    // Delete all user data in correct order
    await from("sale_items")
      .delete()
      .in(
        "sale_id",
        (
          await from("sales").select("id").eq("user_id", deleteUserId)
        ).data?.map((s: any) => s.id) ?? [],
      );
    await from("sales").delete().eq("user_id", deleteUserId);
    await from("inventory_logs").delete().eq("user_id", deleteUserId);
    await from("alerts").delete().eq("user_id", deleteUserId);
    const productIds =
      (
        await from("products").select("id").eq("user_id", deleteUserId)
      ).data?.map((p: any) => p.id) ?? [];
    if (productIds.length > 0) {
      await from("product_variants").delete().in("product_id", productIds);
    }
    await from("products").delete().eq("user_id", deleteUserId);
    await from("categories").delete().eq("user_id", deleteUserId);
    await from("colors").delete().eq("user_id", deleteUserId);
    await from("sizes").delete().eq("user_id", deleteUserId);
    await from("profiles")
      .update({ is_active: false, company_name: "[EXCLUÍDA]", plan: "free" })
      .eq("id", deleteUserId);
    toast.success("Todos os dados da empresa foram excluídos");
    setDeleteUserId(null);
    fetchUsers();
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    // Update profile data
    await from("profiles")
      .update({
        company_name: editUser.company_name,
        cnpj: editUser.cnpj,
        address: editUser.address,
        phone: editUser.phone,
        plan: editUser.plan,
        provider: editUser.provider,
      })
      .eq("id", editUser.id);

    // Update email/password via edge function if changed
    const originalUser = users.find((u) => u.id === editUser.id);
    const emailChanged =
      originalUser && editUser.email && editUser.email !== originalUser.email;
    const passwordChanged = editPassword.length > 0;

    if (
      passwordChanged &&
      (editPassword.length < 8 ||
        !/[A-Z]/.test(editPassword) ||
        !/[a-z]/.test(editPassword) ||
        !/[0-9]/.test(editPassword))
    ) {
      toast.error(
        "Senha deve ter no mínimo 8 caracteres com maiúscula, minúscula e número",
      );
      return;
    }

    if (emailChanged || passwordChanged) {
      try {
        const body: any = { userId: editUser.id };
        if (emailChanged) body.email = editUser.email;
        if (passwordChanged) body.password = editPassword;
        const res = await callAdminUpdateUser("update", "POST", body);
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Erro ao atualizar credenciais");
        }
      } catch {
        toast.error("Erro ao atualizar credenciais");
      }
    }

    toast.success("Empresa atualizada");
    setEditUser(null);
    setEditPassword("");
    fetchUsers();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-semibold">Empresas Cadastradas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as empresas e contas do sistema ({users.length} total)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou provedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-40 h-10 rounded-xl">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Planos</SelectItem>
            <SelectItem value="free">Gratuito</SelectItem>
            <SelectItem value="pro">Stokk Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-10 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid of Companies */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p>Carregando empresas...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <div 
              key={u.id} 
              className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {(u.company_name || "?")[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{u.company_name || "Sem nome"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      u.plan === 'pro' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {u.plan || 'free'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      u.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {u.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {u.email || u.provider || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 px-4 md:px-0">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Produtos</p>
                  <p className="font-semibold">{u.total_products ?? 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="font-semibold">{u.total_sales ?? 0}</p>
                </div>
                <div className="text-center min-w-[80px]">
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="font-semibold text-emerald-500">
                    R$ {(u.total_revenue ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setDetailUser(u)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setEditUser(u)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleToggleActive(u.id, u.is_active)}
                >
                  {u.is_active ? (
                    <Ban className="w-4 h-4 text-warning" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => setDeleteUserId(u.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-muted-foreground glass-card rounded-xl border border-dashed border-border">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma empresa encontrada</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Nova Empresa</DialogTitle>
            <DialogDescription>
              Cadastre uma nova empresa e crie sua conta de acesso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Nome comercial da empresa"
                />
              </div>
              <div>
                <Label>Email de Acesso *</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <Label>Senha Temporária *</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={newCnpj}
                  onChange={(e) => setNewCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                />
              </div>
              <div>
                <Label>Provedor/Revendedor</Label>
                <Input
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  placeholder="Indicação ou canal"
                />
              </div>
              <div>
                <Label>Plano Inicial</Label>
                <Select value={newPlan} onValueChange={setNewPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="pro">Stokk Pro (Pago)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              className="w-full rounded-xl h-11"
              disabled={creating || !newEmail || !newPassword || !newCompany}
            >
              {creating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Criando...
                </div>
              ) : "Criar Empresa e Conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={(o) => !o && setDetailUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Detalhes da Empresa</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Empresa</p>
                  <p className="font-medium">{detailUser.company_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">CNPJ</p>
                  <p className="font-medium">{detailUser.cnpj || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Telefone</p>
                  <p className="font-medium">{detailUser.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Cadastro</p>
                  <p className="font-medium">
                    {new Date(detailUser.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Endereço</p>
                  <p className="font-medium">{detailUser.address || "—"}</p>
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <h3 className="font-heading font-semibold mb-3">Métricas de Uso</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
                    <p className="text-2xl font-heading font-bold text-primary">
                      {detailUser.total_products ?? 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Produtos</p>
                  </div>
                  <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3 text-center">
                    <p className="text-2xl font-heading font-bold text-blue-500">
                      {detailUser.total_sales ?? 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Vendas</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
                    <p className="text-lg font-heading font-bold text-emerald-500">
                      R$ {(detailUser.total_revenue ?? 0).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Receita</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${detailUser.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                  {detailUser.is_active ? "Ativa" : "Inativa"}
                </span>
                <span className="text-xs text-muted-foreground italic">
                  ID: {detailUser.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if(!o) { setEditUser(null); setEditPassword(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar Empresa</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={editUser.company_name}
                    onChange={(e) => setEditUser({ ...editUser, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email de Acesso</Label>
                  <Input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Deixar vazio p/ manter"
                  />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input
                    value={editUser.cnpj}
                    onChange={(e) => setEditUser({ ...editUser, cnpj: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={editUser.phone}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={editUser.address}
                    onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Plano</Label>
                  <Select
                    value={editUser.plan}
                    onValueChange={(v) => setEditUser({ ...editUser, plan: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="pro">Stokk Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleUpdateUser} className="w-full rounded-xl">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(o) => !o && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Atenção: Isso excluirá permanentemente todos os produtos, vendas e dados vinculados a esta empresa. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
