import { HardHat } from "lucide-react";

const Expired = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
          <HardHat className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Link Expired</h1>
        <p className="text-muted-foreground text-sm">
          This entry link is no longer active. Contact the site owner for a new link.
        </p>
      </div>
    </div>
  );
};

export default Expired;
