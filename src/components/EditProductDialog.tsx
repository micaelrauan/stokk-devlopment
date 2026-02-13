import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Product } from '@/types/inventory';
import { Upload, X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProductDialog({ product, open, onOpenChange }: Props) {
  const { updateProduct, categories } = useInventoryContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [minStock, setMinStock] = useState('3');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product && open) {
      setName(product.name);
      setDescription(product.description);
      setCategory(product.category);
      setBrand(product.brand);
      setSalePrice(String(product.salePrice));
      setCostPrice(String(product.costPrice));
      setMinStock(String(product.minStockThreshold));
      setImagePreview(product.imageUrl || null);
      setImageFile(null);
    }
  }, [product, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione um arquivo de imagem'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return imagePreview || '';
    const ext = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, imageFile);
    if (error) { console.error('Upload error', error); toast.error('Erro ao fazer upload da imagem'); return imagePreview || ''; }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!product || !name || !category || !brand || !salePrice) return;
    setSaving(true);

    let imageUrl = imagePreview || '';
    if (imageFile) {
      imageUrl = await uploadImage();
    }

    await updateProduct(product.id, {
      name,
      description,
      imageUrl,
      category,
      brand,
      salePrice: parseFloat(salePrice),
      costPrice: parseFloat(costPrice) || 0,
      minStockThreshold: parseInt(minStock) || 3,
    });

    toast.success('Produto atualizado com sucesso');
    setSaving(false);
    onOpenChange(false);
  };

  if (!product) return null;

  const totalStock = product.variants.reduce((s, v) => s + v.currentStock, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Editar Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Reference & Stock info */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="bg-muted px-2 py-0.5 rounded-full font-mono">{product.reference}</span>
            <span>{product.variants.length} variações</span>
            <span>{totalStock} peças em estoque</span>
          </div>

          {/* Image */}
          <div>
            <Label className="mb-2 block">Imagem do Produto</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={removeImage} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors shrink-0">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Upload</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP. Máximo 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome do Produto</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marca</Label>
              <Input value={brand} onChange={e => setBrand(e.target.value)} />
            </div>
            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
            </div>
            <div>
              <Label>Preço de Custo (R$)</Label>
              <Input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
            </div>
            <div>
              <Label>Estoque Mínimo</Label>
              <Input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} />
            </div>
          </div>

          {/* Variants (read-only summary) */}
          {product.variants.length > 0 && (
            <div>
              <Label className="mb-2 block">Variações</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-2 px-3 font-medium">SKU</th>
                      <th className="text-left py-2 px-3 font-medium">Cor</th>
                      <th className="text-left py-2 px-3 font-medium">Tam</th>
                      <th className="text-left py-2 px-3 font-medium">Código de Barras</th>
                      <th className="text-center py-2 px-3 font-medium">Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map(v => (
                      <tr key={v.id} className="border-t border-border/50">
                        <td className="py-1.5 px-3 font-mono text-muted-foreground">{v.sku}</td>
                        <td className="py-1.5 px-3">{v.color}</td>
                        <td className="py-1.5 px-3 font-semibold">{v.size}</td>
                        <td className="py-1.5 px-3 font-mono text-muted-foreground">{v.barcode}</td>
                        <td className="py-1.5 px-3 text-center font-semibold">{v.currentStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full gap-2" disabled={saving || !name || !category || !brand || !salePrice}>
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
