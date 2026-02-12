import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HardHat } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ULB_OPTIONS = [
  { id: "KishangarhBas", label: "KishangarhBas" },
  { id: "Khairthal", label: "Khairthal" },
] as const;

const SelectULB = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };
    check();
  }, [navigate]);

  const handleSelect = (ulb: string) => {
    setSelected(ulb);
    sessionStorage.setItem("selected_ulb", ulb);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-[hsl(220,60%,20%)] via-[hsl(220,50%,40%)] to-[hsl(220,30%,85%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(220,25%,15%)] dark:to-[hsl(220,20%,25%)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <HardHat className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">NatureSection</h1>
          <p className="text-foreground/80 text-sm">Select your project site</p>
        </div>

        <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-6 shadow-soft">
          <label className="text-xs font-medium uppercase tracking-wider text-foreground/70 mb-3 block">
            Select Project Site
          </label>
          <Select value={selected} onValueChange={handleSelect}>
            <SelectTrigger className="w-full h-12 text-base font-semibold bg-background">
              <SelectValue placeholder="Choose a workspace…" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {ULB_OPTIONS.map((ulb) => (
                <SelectItem key={ulb.id} value={ulb.id} className="text-base font-medium py-3">
                  {ulb.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SelectULB;
