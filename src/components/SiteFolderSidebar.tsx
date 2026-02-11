import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FolderPlus, Folder, Menu, Trash2 } from "lucide-react";

export interface SiteFolder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface SiteFolderSidebarProps {
  folders: SiteFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersChange: () => void;
  mode: "mobile" | "desktop";
}

const FolderList = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onFoldersChange,
  onClose,
}: {
  folders: SiteFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onFoldersChange: () => void;
  onClose?: () => void;
}) => {
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("site_folders").insert({ name, user_id: session.user.id });
    if (error) {
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    } else {
      setNewFolderName("");
      onFoldersChange();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("site_folders").delete().eq("id", id);
    if (!error) {
      if (selectedFolderId === id) onSelectFolder(null);
      onFoldersChange();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="New site folder..."
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="text-sm"
        />
        <Button size="icon" onClick={handleCreate} disabled={creating || !newFolderName.trim()}>
          <FolderPlus className="w-4 h-4" />
        </Button>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        <button
          onClick={() => { onSelectFolder(null); onClose?.(); }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            selectedFolderId === null ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Folder className="w-4 h-4" /> All Sites
        </button>

        {folders.map((folder) => (
          <div key={folder.id} className="group flex items-center">
            <button
              onClick={() => { onSelectFolder(folder.id); onClose?.(); }}
              className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedFolderId === folder.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
            <button
              onClick={() => handleDelete(folder.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {folders.length === 0 && (
          <p className="text-xs text-muted-foreground px-3 py-4">No site folders yet.</p>
        )}
      </nav>
    </div>
  );
};

const SiteFolderSidebar = ({ folders, selectedFolderId, onSelectFolder, onFoldersChange, mode }: SiteFolderSidebarProps) => {
  const [open, setOpen] = useState(false);

  if (mode === "desktop") {
    return (
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Site Folders</h2>
        <FolderList
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onFoldersChange={onFoldersChange}
        />
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white dark:text-muted-foreground lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-5">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Site Folders</SheetTitle>
        </SheetHeader>
        <FolderList
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onFoldersChange={onFoldersChange}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

export default SiteFolderSidebar;
