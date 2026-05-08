import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import type { PostType } from "@/lib/mock-data";
import { toast } from "sonner";

export function CreatePostDialog({
  open,
  onOpenChange,
  brandId,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brandId: string;
  initialDate?: string;
}) {
  const { addPost, refreshPosts } = useAppStore(); // Usiamo refreshPosts per ricaricare dopo la creazione
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<PostType>("Post");
  const [date, setDate] = useState((initialDate ?? new Date().toISOString()).slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialDate) setDate(initialDate.slice(0, 10));
  }, [initialDate]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Aggiungi un titolo");
      return;
    }

    setIsSubmitting(true);

    // Prepariamo l'oggetto per il backend Java (Entity Post)
    const newPost = {
      brand: { id: brandId }, // Il backend si aspetta l'oggetto Brand con l'ID
      title,
      content: caption,       // Java usa 'content'
      platform: type.toUpperCase(), // Java usa 'platform' (es. INSTAGRAM)
      scheduledDate: date,    // Java usa 'scheduledDate'
      status: "DRAFT",        // Stato iniziale tutto maiuscolo per il DB
    };

    try {
      const response = await fetch("http://localhost:8080/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        toast.success("Bozza salvata nel database");
        await refreshPosts(); // Ricarica la lista per vedere il nuovo post
        setTitle("");
        setCaption("");
        onOpenChange(false);
      } else {
        throw new Error("Errore durante il salvataggio");
      }
    } catch (error) {
      toast.error("Il backend Java non risponde");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuova bozza</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Titolo</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Reel apertura nuova sede" disabled={isSubmitting} />
          </div>
          <div className="space-y-1.5">
            <Label>Caption</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} disabled={isSubmitting} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PostType)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Post">Post</SelectItem>
                  <SelectItem value="Reel">Reel</SelectItem>
                  <SelectItem value="Carosello">Carosello</SelectItem>
                  <SelectItem value="Story">Story</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isSubmitting} />
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Salvataggio..." : "Crea bozza"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}