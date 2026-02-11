import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HardHat, MapPin } from "lucide-react";

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
      <div className="w-full max-w-xl space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <HardHat className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">NatureSection</h1>
          <p className="text-foreground/80 text-sm">Select your ULB workspace to continue</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {ULB_OPTIONS.map((ulb) => (
            <button
              key={ulb.id}
              onClick={() => handleSelect(ulb.id)}
              className="group bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 shadow-soft hover:border-primary/50 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-primary/20 transition-colors">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">{ulb.label}</h2>
              <p className="text-sm text-foreground/70">Open {ulb.label} workspace</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectULB;
