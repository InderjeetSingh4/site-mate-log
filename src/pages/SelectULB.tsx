import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HardHat, ChevronRight } from "lucide-react";

const ULB_OPTIONS = [
  { id: "KishangarhBas", label: "KishangarhBas" },
  { id: "Khairthal", label: "Khairthal" },
] as const;

const SelectULB = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };
    check();
  }, [navigate]);

  const handleSelect = (ulb: string) => {
    sessionStorage.setItem("selected_ulb", ulb);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-[hsl(220,60%,20%)] via-[hsl(220,50%,40%)] to-[hsl(220,30%,85%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(220,25%,15%)] dark:to-[hsl(220,20%,25%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <HardHat className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">NatureSection</h1>
          <p className="text-foreground/80 text-sm">Select your ULB workspace</p>
        </div>

        {/* Thin list items */}
        <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden shadow-soft">
          {ULB_OPTIONS.map((ulb, i) => (
            <button
              key={ulb.id}
              onClick={() => handleSelect(ulb.id)}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-primary/10 transition-colors text-left ${
                i < ULB_OPTIONS.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <span className="font-semibold text-foreground">{ulb.label}</span>
              <ChevronRight className="w-4 h-4 text-foreground/50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectULB;
