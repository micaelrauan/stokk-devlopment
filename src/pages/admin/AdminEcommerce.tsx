
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Store, Plus } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  company_name: string;
  slug: string | null;
  has_ecommerce: boolean;
  is_active: boolean;
  plan: string;
}

export default function AdminEcommerce() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, company_name, slug, has_ecommerce, is_active, plan")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar lojas");
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }

  const filteredProfiles = profiles.filter((p) =>
    p.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setNewSlug(profile.slug || generateSlug(profile.company_name));
    setIsDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSaveEcommerce = async () => {
    if (!selectedProfile || !newSlug) return;

    // Check if slug exists (if changed)
    if (newSlug !== selectedProfile.slug) {
       const { data: existing } = await supabase
         .from('profiles')
         .select('id')
         .eq('slug', newSlug)
         .neq('id', selectedProfile.id) // Exclude current profile
         .single();
         
       if (existing) {
         toast.error("Este link já está em uso por outra loja.");
         return;
       }
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          has_ecommerce: true,
          slug: newSlug,
        })
        .eq("id", selectedProfile.id);

      if (error) throw error;

      toast.success("E-commerce ativado/atualizado com sucesso!");
      setIsDialogOpen(false);
      fetchProfiles();
    } catch (error) {
      toast.error("Erro ao salvar alterações");
      console.error(error);
    }
  };

  const handleDeactivate = async (profile: Profile) => {
      if (!confirm(`Tem certeza que deseja desativar a loja de ${profile.company_name}?`)) return;

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ has_ecommerce: false })
          .eq("id", profile.id);
  
        if (error) throw error;
  
        toast.success("E-commerce desativado.");
        fetchProfiles();
      } catch (error) {
        toast.error("Erro ao desativar");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Lojas Virtuais</h1>
          <p className="text-muted-foreground">
            Gerencie quais empresas têm acesso ao módulo de e-commerce.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 px-0"
        />
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status Loja</TableHead>
              <TableHead>Link (Slug)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma loja encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    {profile.company_name || "Sem nome"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {profile.plan || "free"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.has_ecommerce ? (
                      <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-200">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Inativa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.has_ecommerce && profile.slug ? (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <a href={`/loja/${profile.slug}`} target="_blank" className="hover:underline flex items-center gap-1">
                                {profile.slug}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {profile.has_ecommerce ? (
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(profile)}>
                                Configurar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeactivate(profile)}>
                                Desativar
                            </Button>
                        </div>
                    ) : (
                        <Button size="sm" variant="outline" className="gap-2" onClick={() => handleOpenDialog(profile)}>
                            <Plus className="w-4 h-4" />
                            Criar Loja
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogo de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Configurar Loja Virtual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Empresa</label>
                    <Input value={selectedProfile?.company_name || ''} disabled />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Link da Loja (Slug)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">stokk.shop/</span>
                        <Input 
                            value={newSlug} 
                            onChange={(e) => setNewSlug(e.target.value)} 
                            placeholder="minha-loja"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use apenas letras minúsculas, números e hífens.
                    </p>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveEcommerce}>Salvar e Ativar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
