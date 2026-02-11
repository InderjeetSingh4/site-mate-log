import { HardHat } from "lucide-react";

const Expired = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-14 h-14 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
          <HardHat className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
        <p className="text-foreground/70 text-sm">
          This entry link is no longer active. Contact the site owner for a new link.
        </p>
      </div>
    </div>
  );
};

export default Expired;
