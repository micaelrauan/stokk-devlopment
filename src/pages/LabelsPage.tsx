import { useState, useRef, useEffect } from "react";
import { useInventoryContext } from "@/contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Tags, CheckSquare, Square, Search } from "lucide-react";
import JsBarcode from "jsbarcode";

export default function LabelsPage() {
  const { products } = useInventoryContext();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchProduct, setSearchProduct] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchProduct.toLowerCase()),
  );

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      if (!prev.includes(id) && !quantities[id]) {
        setQuantities((q) => ({ ...q, [id]: 1 }));
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!selectedProduct) return;
    const allIds = selectedProduct.variants.map((v) => v.id);
    setSelectedItems(allIds);
    const newQty: Record<string, number> = {};
    allIds.forEach((id) => {
      newQty[id] = quantities[id] || 1;
    });
    setQuantities((q) => ({ ...q, ...newQty }));
  };

  const deselectAll = () => setSelectedItems([]);

  const setQty = (id: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.min(50, qty)),
    }));
  };

  useEffect(() => {
    const svgs = containerRef.current?.querySelectorAll("svg[data-barcode]");
    svgs?.forEach((svg) => {
      const code = (svg as SVGElement).dataset.barcode;
      if (code) {
        try {
          JsBarcode(svg, code, {
            format: "CODE128",
            width: 1.2,
            height: 36,
            displayValue: true,
            fontSize: 9,
            margin: 2,
            background: "transparent",
            xmlDocument: document,
          });
        } catch (e) {
          if (import.meta.env.DEV) console.error("Barcode error:", e);
        }
      }
    });
  }, [selectedItems, selectedProductId, quantities]);

  const totalLabels = selectedItems.reduce(
    (sum, id) => sum + (quantities[id] || 1),
    0,
  );

  const handlePrint = () => {
    const printContent = containerRef.current;
    if (!printContent) return;
    const w = window.open("", "", "width=800,height=600");
    if (!w) return;
    w.document.write(`
      <html><head><title>Etiquetas - StockWear</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', Arial, sans-serif; padding: 10px; }
        .labels-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .label {
          width: 180px; border: 1px solid #ddd; border-radius: 6px;
          padding: 8px 6px; text-align: center; page-break-inside: avoid;
          background: #fff;
        }
        /* Map Tailwind classes used in label HTML */
        .text-\\[7px\\] { font-size: 7px; }
        .text-\\[8px\\] { font-size: 8px; }
        .text-\\[9px\\] { font-size: 9px; }
        .text-\\[11px\\] { font-size: 11px; }
        .text-base { font-size: 16px; }
        .uppercase { text-transform: uppercase; }
        .tracking-\\[1\\.5px\\] { letter-spacing: 1.5px; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace; }
        .font-heading { font-family: 'Space Grotesk', sans-serif; }
        .text-muted-foreground { color: #999; }
        .label-name { line-height: 1.2; word-break: break-word; overflow-wrap: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .label-size { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; margin: 2px 0; }
        .mb-0\\.5 { margin-bottom: 2px; }
        .my-1\\.5 { margin-top: 6px; margin-bottom: 6px; }
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .gap-3 { gap: 12px; }
        .justify-center { justify-content: center; }
        .label svg { display: block; margin: 4px auto; }
        @media print {
          body { padding: 0; }
          .label { border: 1px solid #ccc; }
        }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    w.document.close();
    // Wait for fonts to load before printing
    const tryPrint = () => {
      if (w.document.fonts && w.document.fonts.ready) {
        w.document.fonts.ready.then(() => {
          setTimeout(() => w.print(), 100);
        });
      } else {
        setTimeout(() => w.print(), 800);
      }
    };
    tryPrint();
  };

  // Build labels array with quantities
  const labelsToRender: { variantId: string; index: number }[] = [];
  if (selectedProduct) {
    for (const id of selectedItems) {
      const qty = quantities[id] || 1;
      for (let i = 0; i < qty; i++) {
        labelsToRender.push({ variantId: id, index: i });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">
          Gerador de Etiquetas
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecione produtos e variações para gerar etiquetas com código de
          barras
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-sm">1. Selecione o Produto</h3>
            <Select
              value={selectedProductId}
              onValueChange={(v) => {
                setSelectedProductId(v);
                setSelectedItems([]);
                setQuantities({});
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um produto" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                </div>
                {filteredProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      {p.reference}
                    </span>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">2. Variações</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="text-xs h-7 px-2"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" /> Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deselectAll}
                    className="text-xs h-7 px-2"
                  >
                    <Square className="w-3 h-3 mr-1" /> Nenhum
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {selectedProduct.variants.map((variant) => {
                  const isSelected = selectedItems.includes(variant.id);
                  return (
                    <div
                      key={variant.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                      onClick={() => toggleItem(variant.id)}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && (
                          <span className="text-primary-foreground text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">
                          {variant.color} · {variant.size}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {variant.sku}
                        </p>
                      </div>
                      {isSelected && (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-muted-foreground">
                            Qtd:
                          </span>
                          <Input
                            type="number"
                            value={quantities[variant.id] || 1}
                            onChange={(e) =>
                              setQty(variant.id, parseInt(e.target.value) || 1)
                            }
                            className="w-14 h-7 text-xs text-center"
                            min={1}
                            max={50}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedItems.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {selectedItems.length} variação(ões) · {totalLabels}{" "}
                      etiqueta(s)
                    </span>
                  </div>
                  <Button onClick={handlePrint} className="w-full gap-2">
                    <Printer className="w-4 h-4" />
                    Imprimir {totalLabels} Etiqueta(s)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel: Preview */}
        <div className="lg:col-span-2">
          {labelsToRender.length > 0 && selectedProduct ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Pré-visualização</h3>
                <span className="text-xs text-muted-foreground">
                  {totalLabels} etiqueta(s)
                </span>
              </div>
              <div ref={containerRef} className="bg-muted/30 rounded-lg p-4">
                <div className="labels-grid flex flex-wrap gap-3">
                  {labelsToRender.map(({ variantId, index }) => {
                    const variant = selectedProduct.variants.find(
                      (v) => v.id === variantId,
                    );
                    if (!variant) return null;
                    return (
                      <div
                        key={`${variantId}-${index}`}
                        className="label bg-card border border-border rounded-lg p-3 text-center shadow-sm"
                        style={{ width: 180 }}
                      >
                        <p className="label-brand text-[7px] uppercase tracking-[1.5px] text-muted-foreground mb-0.5">
                          {selectedProduct.brand}
                        </p>
                        <h4
                          className="label-name font-semibold"
                          style={{
                            fontSize:
                              selectedProduct.name.length > 20
                                ? "9px"
                                : selectedProduct.name.length > 14
                                  ? "10px"
                                  : "11px",
                            lineHeight: 1.2,
                            wordBreak: "break-word" as const,
                            overflowWrap: "break-word" as const,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical" as const,
                            overflow: "hidden",
                          }}
                        >
                          {selectedProduct.name}
                        </h4>
                        <p className="text-[9px] text-muted-foreground">
                          {variant.color}
                        </p>
                        <p
                          className="label-size font-heading font-bold"
                          style={{ fontSize: "14px", margin: "2px 0" }}
                        >
                          Tam {variant.size}
                        </p>
                        <p className="text-[8px] font-mono text-muted-foreground">
                          Ref: {selectedProduct.reference}
                        </p>
                        <div className="my-1.5 flex justify-center">
                          <svg data-barcode={variant.barcode}></svg>
                        </div>
                        <p className="text-base font-heading font-bold">
                          R$ {selectedProduct.salePrice.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card flex items-center justify-center py-20">
              <div className="text-center text-muted-foreground">
                <Tags className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">
                  {!selectedProductId
                    ? "Selecione um produto"
                    : "Selecione variações"}
                </p>
                <p className="text-sm mt-1">
                  {!selectedProductId
                    ? "Escolha um produto no painel ao lado para começar."
                    : "Marque as variações que deseja imprimir."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
