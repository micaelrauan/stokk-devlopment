import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { ProductVariant } from '@/types/inventory';
import { RefreshCw, Upload, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateBarcode(): string {
  return '789' + Math.random().toString().slice(2, 12).padEnd(10, '0');
}

function generateSku(category: string, color: string, size: string): string {
  const catPrefix = category.slice(0, 3).toUpperCase();
  const colorPrefix = color.replace(/\s/g, '').slice(0, 3).toUpperCase();
  return `${catPrefix}-${colorPrefix}-${size}`;
}

interface VariantDraft {
  size: string;
  color: string;
  barcode: string;
  sku: string;
  initialStock: number;
}

export default function AddProductDialog({ open, onOpenChange }: Props) {
  const { addProduct, categories, colors, sizes, addCategory, addColor, addSize } = useInventoryContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [minStock, setMinStock] = useState('3');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline creation states
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewColor, setShowNewColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [showNewSize, setShowNewSize] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setCategory('');
      setBrand('');
      setSalePrice('');
      setCostPrice('');
      setMinStock('3');
      setSelectedSizes([]);
      setSelectedColors([]);
      setVariantDrafts([]);
      setImageFile(null);
      setImagePreview(null);
      setShowNewCategory(false);
      setNewCategoryName('');
      setShowNewColor(false);
      setNewColorName('');
      setNewColorHex('#000000');
      setShowNewSize(false);
      setNewSizeName('');
    }
  }, [open]);

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size) ? selectedSizes.filter(s => s !== size) : [...selectedSizes, size];
    setSelectedSizes(next);
    regenerateGrid(next, selectedColors);
  };

  const toggleColor = (color: string) => {
    const next = selectedColors.includes(color) ? selectedColors.filter(c => c !== color) : [...selectedColors, color];
    setSelectedColors(next);
    regenerateGrid(selectedSizes, next);
  };

  const regenerateGrid = (sizesArr: string[], colorsArr: string[]) => {
    const drafts: VariantDraft[] = [];
    for (const c of colorsArr) {
      for (const s of sizesArr) {
        const existing = variantDrafts.find(d => d.size === s && d.color === c);
        drafts.push(existing || {
          size: s,
          color: c,
          barcode: generateBarcode(),
          sku: generateSku(category || 'PRD', c, s),
          initialStock: 0,
        });
      }
    }
    setVariantDrafts(drafts);
  };

  const updateDraft = (idx: number, field: keyof VariantDraft, value: string | number) => {
    setVariantDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const regenerateBarcode = (idx: number) => {
    updateDraft(idx, 'barcode', generateBarcode());
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }
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
    if (!imageFile) return '';
    const ext = imageFile.name.split('.').pop()?.toLowerCase();
    // Whitelist safe image extensions
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
    if (!ext || !allowedExts.includes(ext)) {
      toast.error('Formato de imagem não permitido. Use: jpg, png, webp, gif');
      return '';
    }
    // Validate MIME type server-side compatible check
    if (!imageFile.type.startsWith('image/')) {
      toast.error('Arquivo não é uma imagem válida');
      return '';
    }
    // Get current user for path scoping
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Sessão expirada'); return ''; }
    const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });
    if (error) {
      toast.error('Erro ao fazer upload da imagem');
      return '';
    }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName.trim());
    setCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowNewCategory(false);
    toast.success(`Categoria "${newCategoryName.trim()}" criada`);
  };

  const handleCreateColor = async () => {
    if (!newColorName.trim()) return;
    await addColor(newColorName.trim(), newColorHex);
    setNewColorName('');
    setNewColorHex('#000000');
    setShowNewColor(false);
    toast.success(`Cor "${newColorName.trim()}" criada`);
  };

  const handleCreateSize = async () => {
    if (!newSizeName.trim()) return;
    const maxOrder = sizes.length > 0 ? Math.max(...sizes.map(s => s.displayOrder)) : 0;
    await addSize(newSizeName.trim(), maxOrder + 1);
    setNewSizeName('');
    setShowNewSize(false);
    toast.success(`Tamanho "${newSizeName.trim()}" criado`);
  };

  const handleSubmit = async () => {
    if (!name || !category || !brand || !salePrice || variantDrafts.length === 0) return;

    // Validate prices
    const salePriceNum = parseFloat(salePrice);
    const costPriceNum = parseFloat(costPrice) || 0;
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
      toast.error('Preço de venda deve ser maior que zero');
      return;
    }
    if (costPriceNum < 0) {
      toast.error('Preço de custo não pode ser negativo');
      return;
    }
    // Validate stock quantities are non-negative
    if (variantDrafts.some(d => d.initialStock < 0)) {
      toast.error('Estoque inicial não pode ser negativo');
      return;
    }

    setUploading(true);
    let imageUrl = '';
    if (imageFile) {
      imageUrl = await uploadImage();
    }

    const prefix = category.slice(0, 3).toUpperCase();
    const reference = `${prefix}-${String(Date.now()).slice(-4)}`;
    const productId = String(Date.now());

    const variants: ProductVariant[] = variantDrafts.map((d, idx) => ({
      id: `${productId}-${idx}`,
      productId,
      size: d.size,
      color: d.color,
      barcode: d.barcode,
      sku: d.sku,
      currentStock: d.initialStock,
    }));

    await addProduct({
      reference,
      name,
      description,
      imageUrl,
      category,
      brand,
      salePrice: parseFloat(salePrice),
      costPrice: parseFloat(costPrice) || 0,
      minStockThreshold: parseInt(minStock) || 3,
      variants,
    });

    setName('');
    setDescription('');
    setCategory('');
    setBrand('');
    setSalePrice('');
    setCostPrice('');
    setSelectedSizes([]);
    setSelectedColors([]);
    setVariantDrafts([]);
    removeImage();
    setUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Image Upload */}
          <div>
            <Label className="mb-2 block">Imagem do Produto</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={removeImage}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors shrink-0"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Upload</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG ou WebP. Máximo 5MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome do Produto</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Camiseta Básica" />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descrição do produto (opcional)"
                rows={3}
              />
            </div>

            {/* Category with inline create */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Categoria</Label>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="text-xs text-primary hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Nova
                </button>
              </div>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Nome da categoria"
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                    Criar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>Marca</Label>
              <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex: Urban Style" />
            </div>
            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Preço de Custo (R$)</Label>
              <Input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Estoque Mínimo (global)</Label>
              <Input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="3" />
            </div>
          </div>

          {/* Sizes with inline create */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tamanhos</Label>
              <button
                type="button"
                onClick={() => setShowNewSize(!showNewSize)}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Novo
              </button>
            </div>
            {showNewSize && (
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSizeName}
                  onChange={e => setNewSizeName(e.target.value)}
                  placeholder="Ex: GG, 44, XL..."
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleCreateSize()}
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateSize} disabled={!newSizeName.trim()}>
                  Criar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewSize(false); setNewSizeName(''); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button
                  key={size.id}
                  onClick={() => toggleSize(size.name)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedSizes.includes(size.name)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {size.name}
                </button>
              ))}
              {sizes.length === 0 && !showNewSize && (
                <p className="text-xs text-muted-foreground">Nenhum tamanho cadastrado. Clique em "+ Novo" para adicionar.</p>
              )}
            </div>
          </div>

          {/* Colors with inline create */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Cores</Label>
              <button
                type="button"
                onClick={() => setShowNewColor(!showNewColor)}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Nova
              </button>
            </div>
            {showNewColor && (
              <div className="flex gap-2 mb-2 items-center">
                <Input
                  value={newColorName}
                  onChange={e => setNewColorName(e.target.value)}
                  placeholder="Nome da cor"
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleCreateColor()}
                  autoFocus
                />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={e => setNewColorHex(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer shrink-0"
                />
                <Button size="sm" onClick={handleCreateColor} disabled={!newColorName.trim()}>
                  Criar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewColor(false); setNewColorName(''); setNewColorHex('#000000'); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {colors.map(color => (
                <button
                  key={color.id}
                  onClick={() => toggleColor(color.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedColors.includes(color.name)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Matrix Preview */}
          {variantDrafts.length > 0 && (
            <div>
              <Label className="mb-2 block">Grade Gerada — {variantDrafts.length} variações</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-2 px-3 font-medium">SKU</th>
                      <th className="text-left py-2 px-3 font-medium">Cor</th>
                      <th className="text-left py-2 px-3 font-medium">Tam</th>
                      <th className="text-left py-2 px-3 font-medium">Código de Barras</th>
                      <th className="text-center py-2 px-3 font-medium">Est. Inicial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantDrafts.map((d, idx) => (
                      <tr key={idx} className="border-t border-border/50">
                        <td className="py-1.5 px-3 font-mono text-muted-foreground">{d.sku}</td>
                        <td className="py-1.5 px-3">{d.color}</td>
                        <td className="py-1.5 px-3 font-semibold">{d.size}</td>
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-1">
                            <Input
                              value={d.barcode}
                              onChange={e => updateDraft(idx, 'barcode', e.target.value)}
                              className="h-7 text-xs font-mono w-36"
                            />
                            <button
                              onClick={() => regenerateBarcode(idx)}
                              className="w-7 h-7 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors shrink-0"
                              title="Gerar novo código"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-1.5 px-3">
                          <Input
                            type="number"
                            value={d.initialStock}
                            onChange={e => updateDraft(idx, 'initialStock', parseInt(e.target.value) || 0)}
                            className="h-7 text-xs text-center w-16 mx-auto"
                            min={0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full" disabled={uploading || !name || !category || !brand || !salePrice || variantDrafts.length === 0}>
            {uploading ? 'Cadastrando...' : 'Cadastrar Produto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
