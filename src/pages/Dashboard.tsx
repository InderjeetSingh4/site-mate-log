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
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { HardHat, Link2, LogOut, Users, Copy, Check, Settings, Download } from "lucide-react";
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

  const exportCSV = () => {
    if (records.length === 0) return;
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const header = "Date,Labour Count,Day of Week";
    const rows = sorted.map((r) => {
      const d = new Date(r.date);
      return `${format(d, "dd/MM/yyyy")},${r.labor_count},${format(d, "EEEE")}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Site_Labour_Report_${format(new Date(), "dd-MM-yyyy")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">CivilSite</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Entries</p>
            <p className="text-3xl font-bold mt-2 tracking-tight">{records.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Average Labour (Last 7 Days)</p>
            <p className="text-3xl font-bold text-primary mt-2 tracking-tight">{weeklyAvg}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-5">
            Site Strength (Last 7 Days)
          </h2>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No data for the last 7 days.</p>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="labor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        {/* Link Generator */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
            Generate Entry Link
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={generateLink} disabled={generating} className="font-medium">
              <Link2 className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Generate New Entry Link"}
            </Button>
            {generatedLink && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <code className="text-xs bg-muted px-3 py-2 rounded-lg border border-border truncate flex-1 font-mono">
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
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-soft">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Labour Records
            </h2>
            {records.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportCSV} className="font-medium">
                <Download className="w-4 h-4 mr-2" />
                Download Excel Report
              </Button>
            )}
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No entries yet. Generate a link and share it with your mate.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-right">Labour Count</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-right">Submitted</TableHead>
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
