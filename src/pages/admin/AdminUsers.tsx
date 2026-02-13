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

export default function AdminUsers() {
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

  const fetchUsers = useCallback(async () => {
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
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user?action=list`;
        const listRes = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });
        if (listRes.ok) {
          const users = await listRes.json();
          users.forEach((u: any) => {
            emailMap[u.id] = u.email;
          });
        }
      }
    } catch {}

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
  }, []);

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
    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message);
        setCreating(false);
        return;
      }
      if (data.user) {
        await from("profiles")
          .update({
            company_name: newCompany,
            cnpj: newCnpj,
            address: newAddress,
            phone: newPhone,
            plan: newPlan,
            provider: newProvider,
          })
          .eq("id", data.user.id);
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
    } catch {
      toast.error("Erro ao criar empresa");
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

    if (emailChanged || passwordChanged) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user?action=update`;
          const body: any = { userId: editUser.id };
          if (emailChanged) body.email = editUser.email;
          if (passwordChanged) body.password = editPassword;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const err = await res.json();
            toast.error(err.error || "Erro ao atualizar credenciais");
          }
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">
            Empresas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as empresas do sistema ({users.length} total)
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Users className="w-4 h-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou provedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
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
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Planos</SelectItem>
            <SelectItem value="free">Gratuito</SelectItem>
            <SelectItem value="pro">Stokk Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="text-left py-3 px-4 font-medium">Empresa</th>
              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">
                CNPJ
              </th>
              <th className="text-left py-3 px-4 font-medium">Plano</th>
              <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">
                Produtos
              </th>
              <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">
                Vendas
              </th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-right py-3 px-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u.id}
                className="border-t border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <p className="font-medium">{u.company_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.email || u.provider || "—"}
                  </p>
                </td>
                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                  {u.cnpj || "—"}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${u.plan === "pro" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"}`}
                  >
                    {u.plan || "free"}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-muted-foreground hidden sm:table-cell">
                  {u.total_products ?? 0}
                </td>
                <td className="py-3 px-4 font-mono text-muted-foreground hidden sm:table-cell">
                  {u.total_sales ?? 0}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${u.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                  >
                    {u.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setDetailUser(u)}
                      title="Detalhes"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setEditUser(u)}
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      title={u.is_active ? "Desativar" : "Ativar"}
                    >
                      {u.is_active ? (
                        <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hidden sm:inline-flex"
                      onClick={() => setCancelUserId(u.id)}
                      title="Cancelar conta"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-destructive"
                      onClick={() => setDeleteUserId(u.id)}
                      title="Excluir dados"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  {search || filterPlan !== "all" || filterStatus !== "all"
                    ? "Nenhuma empresa encontrada com esses filtros"
                    : "Nenhuma empresa cadastrada"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!detailUser}
        onOpenChange={(open) => {
          if (!open) setDetailUser(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Detalhes da Empresa
            </DialogTitle>
            <DialogDescription>
              Informações completas e métricas
            </DialogDescription>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="font-medium">
                    {detailUser.company_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{detailUser.cnpj || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{detailUser.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Provedor</p>
                  <p className="font-medium">{detailUser.provider || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="font-medium">{detailUser.address || "—"}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="font-heading font-semibold mb-3">Métricas</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-2xl font-heading font-bold text-primary">
                      {detailUser.total_products ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Produtos</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-2xl font-heading font-bold text-info">
                      {detailUser.total_sales ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Vendas</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-2xl font-heading font-bold text-success">
                      R$ {(detailUser.total_revenue ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Receita</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${detailUser.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                  >
                    {detailUser.is_active ? "Ativo" : "Inativo"}
                  </span>
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${detailUser.plan === "premium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}
                  >
                    {detailUser.plan || "free"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Desde{" "}
                  {new Date(detailUser.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Account Confirmation */}
      <AlertDialog
        open={!!cancelUserId}
        onOpenChange={(open) => {
          if (!open) setCancelUserId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai desativar a conta e reverter o plano para gratuito. A
              empresa não poderá mais acessar o sistema. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation */}
      <AlertDialog
        open={!!deleteUserId}
        onOpenChange={(open) => {
          if (!open) setDeleteUserId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Dados da Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-destructive">ATENÇÃO:</strong> Isso irá
              excluir PERMANENTEMENTE todos os dados da empresa: produtos,
              variantes, vendas, logs, alertas, categorias, cores e tamanhos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Nova Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Nome da empresa"
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
                <Label>Senha *</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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
                  placeholder="Endereço completo"
                />
              </div>
              <div>
                <Label>Provedor</Label>
                <Input
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  placeholder="Provedor/Revendedor"
                />
              </div>
              <div>
                <Label>Plano</Label>
                <Select value={newPlan} onValueChange={setNewPlan}>
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
            <Button
              onClick={handleCreate}
              className="w-full"
              disabled={creating || !newEmail || !newPassword || !newCompany}
            >
              {creating ? "Criando..." : "Criar Empresa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditUser(null);
            setEditPassword("");
          }
        }}
      >
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
                    onChange={(e) =>
                      setEditUser({ ...editUser, company_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Email de Acesso</Label>
                  <Input
                    type="email"
                    value={editUser.email}
                    onChange={(e) =>
                      setEditUser({ ...editUser, email: e.target.value })
                    }
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Deixe vazio para manter"
                  />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input
                    value={editUser.cnpj}
                    onChange={(e) =>
                      setEditUser({ ...editUser, cnpj: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={editUser.phone}
                    onChange={(e) =>
                      setEditUser({ ...editUser, phone: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={editUser.address}
                    onChange={(e) =>
                      setEditUser({ ...editUser, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Provedor</Label>
                  <Input
                    value={editUser.provider}
                    onChange={(e) =>
                      setEditUser({ ...editUser, provider: e.target.value })
                    }
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
              <Button onClick={handleUpdateUser} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
