import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { HardHat, Link2, LogOut, Users, Copy, Check } from "lucide-react";
import { format, subDays, isAfter, startOfDay } from "date-fns";

interface LaborRecord {
  id: string;
  date: string;
  labor_count: number;
  submitted_at: string;
}

const Dashboard = () => {
  const [records, setRecords] = useState<LaborRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchRecords();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
    });

    init();
    return () => subscription.unsubscribe();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("labor_records")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      toast({ title: "Error fetching records", description: mapDatabaseError(error), variant: "destructive" });
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const generateLink = async () => {
    setGenerating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    const { data, error } = await supabase
      .from("active_tokens")
      .insert({ created_by: session.user.id })
      .select("token_uuid")
      .single();

    if (error) {
      toast({ title: "Error", description: mapDatabaseError(error), variant: "destructive" });
    } else {
      const url = `${window.location.origin}/submit/${data.token_uuid}`;
      setGeneratedLink(url);
    }
    setGenerating(false);
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const last7Days = useMemo(() => {
    const cutoff = startOfDay(subDays(new Date(), 6));
    return records.filter((r) => isAfter(new Date(r.date), cutoff) || startOfDay(new Date(r.date)).getTime() === cutoff.getTime());
  }, [records]);

  const weeklyAvg = useMemo(() => {
    if (last7Days.length === 0) return 0;
    const total = last7Days.reduce((sum, r) => sum + r.labor_count, 0);
    return Math.round(total / last7Days.length);
  }, [last7Days]);

  const chartData = useMemo(() => {
    return last7Days
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((r) => ({
        date: format(new Date(r.date), "dd MMM"),
        labor: r.labor_count,
      }));
  }, [last7Days]);

  const chartConfig = {
    labor: { label: "Labor Count", color: "hsl(var(--primary))" },
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardHat className="w-6 h-6 text-primary" />
            <h1 className="font-display font-bold text-lg tracking-tight">CivilSite</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Total Entries</p>
            <p className="text-3xl font-display font-bold mt-1">{records.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Avg. Labor (Last 7 Days)</p>
            <p className="text-3xl font-display font-bold text-primary mt-1">{weeklyAvg}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
            Site Strength (Last 7 Days)
          </h2>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No data for the last 7 days.</p>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="labor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        {/* Link Generator */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
            Generate Entry Link
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={generateLink} disabled={generating} className="font-display font-semibold">
              <Link2 className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Generate New Entry Link"}
            </Button>
            {generatedLink && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <code className="text-xs bg-secondary px-3 py-2 rounded border border-border truncate flex-1 font-mono">
                  {generatedLink}
                </code>
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Labour Records
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No entries yet. Generate a link and share it with your mate.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-display text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wider text-right">Labour Count</TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wider text-right">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="border-border">
                    <TableCell className="font-mono font-medium">
                      {format(new Date(record.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary text-lg">
                      {record.labor_count}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {format(new Date(record.submitted_at), "HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
