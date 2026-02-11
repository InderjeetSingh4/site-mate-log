import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { HardHat, Link2, LogOut, Users, Copy, Check, Settings, Download } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import SiteFolderSidebar, { type SiteFolder } from "@/components/SiteFolderSidebar";
import { format, subDays, isAfter, startOfDay } from "date-fns";

interface LaborRecord {
  id: string;
  date: string;
  labor_count: number;
  submitted_at: string;
  folder_id: string | null;
}

const Dashboard = () => {
  const [records, setRecords] = useState<LaborRecord[]>([]);
  const [folders, setFolders] = useState<SiteFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      fetchRecords();
      fetchFolders();
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

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("site_folders")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setFolders(data);
  };

  const filteredRecords = useMemo(() => {
    if (!selectedFolderId) return records;
    return records.filter((r) => r.folder_id === selectedFolderId);
  }, [records, selectedFolderId]);

  const generateLink = async () => {
    setGenerating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const insertData: any = { created_by: session.user.id };
    if (selectedFolderId) insertData.folder_id = selectedFolderId;

    const { data, error } = await supabase
      .from("active_tokens")
      .insert(insertData)
      .select("token_uuid")
      .single();

    if (error) {
      toast({ title: "Error", description: mapDatabaseError(error), variant: "destructive" });
    } else {
      setGeneratedLink(`${window.location.origin}/submit/${data.token_uuid}`);
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
    if (filteredRecords.length === 0) return;
    const sorted = [...filteredRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const header = "Date,Day,Labour Count,Cumulative Total";
    let cumulative = 0;
    const chronological = [...sorted].reverse();
    const cumulativeMap = new Map<string, number>();
    chronological.forEach((r) => {
      cumulative += r.labor_count;
      cumulativeMap.set(r.id, cumulative);
    });
    const rows = sorted.map((r) => {
      const d = new Date(r.date);
      return `${format(d, "dd/MM/yyyy")},${format(d, "EEEE")},${r.labor_count},${cumulativeMap.get(r.id)}`;
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
    return filteredRecords.filter((r) => isAfter(new Date(r.date), cutoff) || startOfDay(new Date(r.date)).getTime() === cutoff.getTime());
  }, [filteredRecords]);

  const weeklyAvg = useMemo(() => {
    if (last7Days.length === 0) return 0;
    return Math.round(last7Days.reduce((s, r) => s + r.labor_count, 0) / last7Days.length);
  }, [last7Days]);

  const chartData = useMemo(() => {
    return last7Days.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((r) => ({ date: format(new Date(r.date), "dd MMM"), labor: r.labor_count }));
  }, [last7Days]);

  // Cumulative totals for filtered records (sorted by date asc)
  const cumulativeTotals = useMemo(() => {
    const sorted = [...filteredRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const map = new Map<string, number>();
    let total = 0;
    sorted.forEach((r) => { total += r.labor_count; map.set(r.id, total); });
    return map;
  }, [filteredRecords]);

  const chartConfig = { labor: { label: "Labor Count", color: "hsl(var(--primary))" } };

  const selectedFolderName = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId)?.name
    : "All Sites";

  return (
    <div className="min-h-screen bg-gradient-to-t from-[hsl(220,60%,20%)] via-[hsl(220,50%,40%)] to-[hsl(220,30%,85%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(220,25%,15%)] dark:to-[hsl(220,20%,25%)]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SiteFolderSidebar
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onFoldersChange={fetchFolders}
              mode="mobile"
            />
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-white dark:text-foreground hidden sm:block">CivilSite</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-white/70 hover:text-white dark:text-muted-foreground dark:hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/70 hover:text-white dark:text-muted-foreground dark:hover:text-foreground">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto min-h-[calc(100vh-57px)]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border/30 bg-card/40 backdrop-blur-sm p-5">
          <SiteFolderSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onFoldersChange={fetchFolders}
            mode="desktop"
          />
        </aside>

        <main className="flex-1 px-4 sm:px-6 py-8 space-y-6 animate-fade-in max-w-4xl">
          {/* Current folder label */}
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white dark:text-foreground tracking-tight">{selectedFolderName}</h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-5 shadow-soft">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Entries</p>
              <p className="text-3xl font-bold mt-2 tracking-tight">{filteredRecords.length}</p>
            </div>
            <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-5 shadow-soft">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Labour (7d)</p>
              <p className="text-3xl font-bold text-primary mt-2 tracking-tight">{weeklyAvg}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-6 shadow-soft">
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
          <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-6 shadow-soft">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Generate Entry Link {selectedFolderId && <span className="text-primary">({selectedFolderName})</span>}
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
          <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden shadow-soft">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Labour Records
              </h2>
              {filteredRecords.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportCSV} className="font-medium">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
              )}
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading records...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No entries yet. Generate a link and share it with your mate.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs font-medium uppercase tracking-wider">Date</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider">Day</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right">Labour</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right">Cumulative</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right">Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="border-border/50">
                        <TableCell className="font-mono font-medium">
                          {format(new Date(record.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(record.date), "EEEE")}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary text-lg">
                          {record.labor_count}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-foreground">
                          {cumulativeTotals.get(record.id) ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {format(new Date(record.submitted_at), "HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
