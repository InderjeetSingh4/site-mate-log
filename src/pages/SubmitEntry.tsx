import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, HardHat, Send, CheckCircle2 } from "lucide-react";

const SubmitEntry = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [date] = useState<Date>(new Date());
  const [laborCount, setLaborCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    validateToken();
  }, [tokenId]);

  useEffect(() => {
    if (!submitted) return;
    if (countdown <= 0) {
      navigate(`/expired`);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [submitted, countdown, navigate]);

  const validateToken = async () => {
    if (!tokenId) {
      setTokenValid(false);
      return;
    }

    try {
      const res = await supabase.functions.invoke("submit-entry", {
        body: { action: "validate", token_uuid: tokenId },
      });

      if (res.error || !res.data?.valid) {
        setTokenValid(false);
      } else {
        setTokenValid(true);
      }
    } catch {
      setTokenValid(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(laborCount);
    if (!laborCount || count < 0 || count > 9999) {
      toast({ title: "Invalid count", description: "Please enter a valid labour count.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const res = await supabase.functions.invoke("submit-entry", {
        body: {
          action: "submit",
          token_uuid: tokenId,
          date: format(date, "yyyy-MM-dd"),
          labor_count: count,
        },
      });

      if (res.error || !res.data?.success) {
        toast({ title: "Error", description: res.data?.error || "Submission failed", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      toast({ title: "Error", description: "Submission failed", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto animate-pulse-soft">
            <HardHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-foreground/70 mt-4 text-sm">Validating link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-foreground/70 text-sm">
            This entry link has already been used or is invalid. Contact the site owner for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-14 h-14 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Report Submitted</h1>
          <p className="text-foreground/70 text-sm mb-6">
            Daily labour count has been recorded successfully.
          </p>
          <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
            <p className="text-xs text-foreground/70 font-medium uppercase tracking-wider">Auto-redirect in</p>
            <p className="text-4xl font-bold text-primary mt-2">{countdown}s</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-4 shadow-card">
            <HardHat className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Report</h1>
          <p className="text-foreground/70 text-sm mt-1">Submit today's labour count</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 sm:p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider">Date</Label>
              <Button
                variant="outline"
                disabled
                className="w-full justify-start text-left font-mono opacity-70 cursor-not-allowed"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "dd MMM yyyy")}
              </Button>
              <p className="text-[10px] text-muted-foreground">Today's date is locked for daily reporting.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count" className="text-xs font-medium uppercase tracking-wider">
                Total Labour Count
              </Label>
              <Input
                id="count"
                type="number"
                min="0"
                max="9999"
                value={laborCount}
                onChange={(e) => setLaborCount(e.target.value)}
                placeholder="0"
                required
                className="text-2xl sm:text-3xl font-bold h-14 sm:h-16 text-center"
              />
            </div>

            <Button type="submit" className="w-full h-12 font-medium text-base" disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Daily Report"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitEntry;
