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
    <div className="min-h-screen flex items-center justify-center p-4">
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
          <p className="text-foreground/60 text-sm">Select your project site</p>
        </div>

        <div className="glass rounded-3xl p-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-card-foreground/60 mb-3 block">
            Project Site
          </label>
          <Select value={selected} onValueChange={handleSelect}>
            <motion.div whileTap={{ scale: 0.95 }}>
              <SelectTrigger className="w-full h-12 text-base font-bold rounded-full bg-white/90 text-card-foreground border-0 focus:ring-2 focus:ring-primary shadow-lg backdrop-blur-xl">
                <SelectValue placeholder="Choose a workspace…" />
              </SelectTrigger>
            </motion.div>
            <SelectContent className="bg-white/95 backdrop-blur-xl z-50 rounded-2xl shadow-apple border-white/30 p-1">
              {ULB_OPTIONS.map((ulb, index) => (
                <motion.div
                  key={ulb.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                >
                  <SelectItem value={ulb.id} className="text-base font-medium py-3 rounded-xl cursor-pointer text-card-foreground">
                    <span className="flex items-center gap-2">
                      {selected === ulb.id && <Check className="w-4 h-4 text-primary" strokeWidth={2} />}
                      {ulb.label}
                    </span>
                  </SelectItem>
                </motion.div>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </div>
  );
};

export default SelectULB;