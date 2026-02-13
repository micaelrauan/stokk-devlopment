import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Plus, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageSizesDialog({ open, onOpenChange }: Props) {
  const { sizes, addSize, deleteSize, updateSize } = useInventoryContext();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (sizes.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Tamanho já existe');
      return;
    }
    const nextOrder = sizes.length > 0 ? Math.max(...sizes.map(s => s.displayOrder)) + 1 : 1;
    const result = await addSize(trimmed, nextOrder);
    if (result) {
      setNewName('');
      toast.success(`Tamanho "${trimmed}" criado`);
    } else {
      toast.error('Erro ao criar tamanho');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteSize(id);
    toast.success(`Tamanho "${name}" excluído`);
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleUpdate = async () => {
    const trimmed = editingName.trim();
    if (!trimmed || !editingId) return;
    const current = sizes.find(s => s.id === editingId);
    if (current?.name === trimmed) { cancelEditing(); return; }
    if (sizes.some(s => s.id !== editingId && s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Já existe um tamanho com esse nome');
      return;
    }
    const result = await updateSize(editingId, trimmed, current?.displayOrder ?? 0);
    if (result) {
      toast.success(`Tamanho atualizado para "${trimmed}"`);
      cancelEditing();
    } else {
      toast.error('Erro ao atualizar tamanho');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Gerenciar Tamanhos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Novo tamanho (ex: XXG, 36, 38)..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon" disabled={!newName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {sizes.map((size, idx) => {
              const isEditing = editingId === size.id;
              return (
                <div key={size.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdate();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success shrink-0" onClick={handleUpdate}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0" onClick={cancelEditing}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs w-5 text-center">{idx + 1}</span>
                        <span className="font-medium text-sm">{size.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => startEditing(size.id, size.name)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(size.id, size.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {sizes.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">Nenhum tamanho cadastrado</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
