import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, HardHat, Send, CheckCircle2 } from "lucide-react";

const SubmitEntry = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [date, setDate] = useState<Date>(new Date());
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

  // Loading state
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HardHat className="w-10 h-10 text-primary mx-auto animate-pulse-amber" />
          <p className="text-muted-foreground mt-4 font-display text-sm">Validating link...</p>
        </div>
      </div>
    );
  }

  // Invalid/used token
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground text-sm">
            This entry link has already been used or is invalid. Contact the site owner for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Report Submitted</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Daily labour count has been recorded successfully.
          </p>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">
              Auto-redirect in
            </p>
            <p className="text-4xl font-display font-bold text-primary mt-1">{countdown}s</p>
          </div>
        </div>
      </div>
    );
  }

  // Entry form
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 mb-4">
            <HardHat className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Daily Report</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit today's labour count</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="font-display text-xs uppercase tracking-wider">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-mono bg-secondary border-border",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd MMM yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count" className="font-display text-xs uppercase tracking-wider">
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
              className="bg-secondary border-border text-3xl font-display font-bold h-16 text-center"
            />
          </div>

          <Button type="submit" className="w-full h-14 font-display font-bold text-base" disabled={submitting}>
            <Send className="w-5 h-5 mr-2" />
            {submitting ? "Submitting..." : "Submit Daily Report"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SubmitEntry;
