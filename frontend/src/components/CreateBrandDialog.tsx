import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateBrand } from "@/lib/queries";
import { useAppStore } from "@/lib/app-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CreateBrandDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { userId } = useAppStore();
  const createBrand = useCreateBrand();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Inserisci il nome del brand");
      return;
    }
    if (!userId) return;
    try {
      await createBrand.mutateAsync({
        name: name.trim(),
        category: category.trim() || undefined,
        smmId: userId,
      });
      toast.success("Brand creato!");
      setName("");
      setCategory("");
      onOpenChange(false);
    } catch {
      toast.error("Errore durante la creazione del brand");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuovo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome brand</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Pizzeria Da Mario"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Categoria{" "}
              <span className="text-muted-foreground font-normal">(opzionale)</span>
            </Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Es. Ristorazione, Moda, Fitness…"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button
            onClick={handleCreate}
            className="w-full"
            disabled={createBrand.isPending}
          >
            {createBrand.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creazione…
              </>
            ) : (
              "Crea brand"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
