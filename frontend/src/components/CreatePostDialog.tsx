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
import { useCreatePost } from "@/lib/queries";
import type { PostType } from "@/lib/mock-data";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  const createPost = useCreatePost();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<PostType>("Post");
  const [date, setDate] = useState((initialDate ?? new Date().toISOString()).slice(0, 10));

  useEffect(() => {
    if (initialDate) setDate(initialDate.slice(0, 10));
  }, [initialDate]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Aggiungi un titolo");
      return;
    }
    try {
      await createPost.mutateAsync({
        brandId,
        title,
        caption,
        type,
        date: `${date}T09:00:00`,
        status: "draft",
        hasChangesRequested: false,
      });
      toast.success("Bozza creata");
      setTitle("");
      setCaption("");
      onOpenChange(false);
    } catch {
      toast.error("Errore durante la creazione del post");
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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Reel apertura nuova sede"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Caption</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PostType)}>
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
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full" disabled={createPost.isPending}>
            {createPost.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creazione…</>
            ) : (
              "Crea bozza"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
