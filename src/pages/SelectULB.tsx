import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HardHat, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

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
    setTimeout(() => navigate("/dashboard"), 150);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-apple">
            <HardHat className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">NatureSection</h1>
          <p className="text-muted-foreground text-sm">Select your project site</p>
        </div>

        <div className="glass rounded-3xl p-6 shadow-apple">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
            Project Site
          </label>
          <Select value={selected} onValueChange={handleSelect}>
            <SelectTrigger className="w-full h-12 text-base font-semibold rounded-xl bg-input border-0 focus:ring-2 focus:ring-primary shadow-soft">
              <SelectValue placeholder="Choose a workspace…" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50 rounded-2xl shadow-apple border-border/30 p-1">
              {ULB_OPTIONS.map((ulb) => (
                <SelectItem key={ulb.id} value={ulb.id} className="text-base font-medium py-3 rounded-xl cursor-pointer">
                  <span className="flex items-center gap-2">
                    {selected === ulb.id && <Check className="w-4 h-4 text-primary" strokeWidth={2} />}
                    {ulb.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </div>
  );
};

export default SelectULB;