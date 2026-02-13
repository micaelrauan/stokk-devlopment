import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageColorsDialog({ open, onOpenChange }: Props) {
  const { colors, addColor, deleteColor, updateColor } = useInventoryContext();
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('#000000');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingHex, setEditingHex] = useState('#000000');

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (colors.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Cor já existe');
      return;
    }
    const result = await addColor(trimmed, newHex);
    if (result) {
      setNewName('');
      setNewHex('#000000');
      toast.success(`Cor "${trimmed}" criada`);
    } else {
      toast.error('Erro ao criar cor');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteColor(id);
    toast.success(`Cor "${name}" excluída`);
  };

  const startEditing = (id: string, name: string, hex: string) => {
    setEditingId(id);
    setEditingName(name);
    setEditingHex(hex);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingHex('#000000');
  };

  const handleUpdate = async () => {
    const trimmed = editingName.trim();
    if (!trimmed || !editingId) return;
    if (colors.some(c => c.id !== editingId && c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Já existe uma cor com esse nome');
      return;
    }
    const result = await updateColor(editingId, trimmed, editingHex);
    if (result) {
      toast.success(`Cor atualizada para "${trimmed}"`);
      cancelEditing();
    } else {
      toast.error('Erro ao atualizar cor');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Gerenciar Cores</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <input
              type="color"
              value={newHex}
              onChange={e => setNewHex(e.target.value)}
              className="w-10 h-10 rounded-md border border-input cursor-pointer shrink-0 p-0.5"
            />
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome da cor..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Button onClick={handleAdd} size="icon" disabled={!newName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {colors.map(color => {
              const isEditing = editingId === color.id;
              return (
                <div key={color.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="color"
                        value={editingHex}
                        onChange={e => setEditingHex(e.target.value)}
                        className="w-8 h-8 rounded border border-input cursor-pointer shrink-0 p-0.5"
                      />
                      <Input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdate();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="h-8 text-sm flex-1"
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
                        <span
                          className="w-5 h-5 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="font-medium text-sm">{color.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{color.hex}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => startEditing(color.id, color.name, color.hex)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(color.id, color.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {colors.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">Nenhuma cor cadastrada</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
