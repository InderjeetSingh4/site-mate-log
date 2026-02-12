import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { HardHat, Link2, LogOut, Users, Copy, Check, Settings, Download, ArrowLeftRight, History } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import SiteFolderSidebar, { type SiteFolder } from "@/components/SiteFolderSidebar";
import { format, subDays, isAfter, startOfDay } from "date-fns";

interface LaborRecord {
  id: string;
  date: string;
  labor_count: number;
  submitted_at: string;
  folder_id: string | null;
  ulb: string;
  l: number | null;
  w: number | null;
  d: number | null;
  quantity: number | null;
}

const BATCH_SIZE = 15;

const calcQuantity = (labor: number, l: number | null, w: number | null, d: number | null) => {
  return labor * (l || 1) * (w || 1) * (d || 1);
};

const Dashboard = () => {
  const [records, setRecords] = useState<LaborRecord[]>([]);
  const [folders, setFolders] = useState<SiteFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: "l" | "w" | "d" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedUlb = sessionStorage.getItem("selected_ulb");

  useEffect(() => {
    if (!selectedUlb) {
      navigate("/select-ulb");
      return;
    }
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
  }, [selectedUlb]);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("labor_records")
      .select("*")
      .eq("ulb", selectedUlb!)
      .order("date", { ascending: true });
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
      .eq("ulb", selectedUlb!)
      .order("created_at", { ascending: true });
    if (!error && data) setFolders(data);
  };

  const filteredRecords = useMemo(() => {
    if (!selectedFolderId) return records;
    return records.filter((r) => r.folder_id === selectedFolderId);
  }, [records, selectedFolderId]);

  // Split into current batch (last 15) and history
  const currentBatch = useMemo(() => {
    if (showHistory) return [];
    return filteredRecords.slice(-BATCH_SIZE);
  }, [filteredRecords, showHistory]);

  const historyBatch = useMemo(() => {
    if (!showHistory) return [];
    const cutoff = filteredRecords.length - BATCH_SIZE;
    return cutoff > 0 ? filteredRecords.slice(0, cutoff) : [];
  }, [filteredRecords, showHistory]);

  const displayRecords = showHistory ? historyBatch : currentBatch;

  const totalLabor = useMemo(() => {
    return filteredRecords.reduce((s, r) => s + r.labor_count, 0);
  }, [filteredRecords]);

  const generateLink = async () => {
    setGenerating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const insertData: any = { created_by: session.user.id, ulb: selectedUlb };
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
    sessionStorage.removeItem("selected_ulb");
    navigate("/auth");
  };

  const handleSwitchUlb = () => {
    sessionStorage.removeItem("selected_ulb");
    navigate("/select-ulb");
  };

  const handleDimensionEdit = async (recordId: string, field: "l" | "w" | "d", value: string) => {
    const numVal = value === "" ? null : parseFloat(value);
    if (value !== "" && (isNaN(numVal!) || numVal! < 0)) return;

    const record = records.find((r) => r.id === recordId);
    if (!record) return;

    const updatedL = field === "l" ? numVal : record.l;
    const updatedW = field === "w" ? numVal : record.w;
    const updatedD = field === "d" ? numVal : record.d;
    const quantity = calcQuantity(record.labor_count, updatedL, updatedW, updatedD);

    const { error } = await supabase
      .from("labor_records")
      .update({ [field]: numVal, quantity })
      .eq("id", recordId);

    if (error) {
      toast({ title: "Error", description: mapDatabaseError(error), variant: "destructive" });
    } else {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId ? { ...r, [field]: numVal, quantity } : r
        )
      );
    }
    setEditingCell(null);
  };

  const startEdit = (id: string, field: "l" | "w" | "d", currentVal: number | null) => {
    setEditingCell({ id, field });
    setEditValue(currentVal != null ? String(currentVal) : "");
  };

  const exportCSV = () => {
    if (filteredRecords.length === 0) return;
    const header = "Date,Day,Labour Count,L,W,D,Quantity";
    const rows = filteredRecords.map((r) => {
      const d = new Date(r.date);
      const qty = calcQuantity(r.labor_count, r.l, r.w, r.d);
      return `${format(d, "dd/MM/yyyy")},${format(d, "EEEE")},${r.labor_count},${r.l ?? ""},${r.w ?? ""},${r.d ?? ""},${qty}`;
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

  const chartConfig = { labor: { label: "Labor Count", color: "hsl(var(--primary))" } };

  const selectedFolderName = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId)?.name
    : "All Sites";

  const hasHistory = filteredRecords.length > BATCH_SIZE;

  return (
    <div className="min-h-screen bg-gradient-to-t from-[hsl(220,60%,20%)] via-[hsl(220,50%,40%)] to-[hsl(220,30%,85%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(220,25%,15%)] dark:to-[hsl(220,20%,25%)]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <SiteFolderSidebar
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onFoldersChange={fetchFolders}
              mode="mobile"
              onSwitchUlb={handleSwitchUlb}
            />
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-base sm:text-lg tracking-tight text-foreground hidden sm:block">NatureSection</h1>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="hidden lg:inline text-sm font-medium text-foreground bg-primary/10 px-3 py-1 rounded-full">
              Workspace: {selectedUlb}
            </span>
            <Button variant="outline" size="sm" onClick={handleSwitchUlb} className="inline-flex lg:hidden text-foreground">
              <ArrowLeftRight className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Switch ULB</span>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-foreground hover:text-foreground/80">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-foreground hover:text-foreground/80">
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
            onSwitchUlb={handleSwitchUlb}
          />
        </aside>

        <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in max-w-4xl w-full">
          {/* Current folder label */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{selectedFolderName}</h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4 sm:p-5 shadow-soft">
              <p className="text-xs text-foreground/70 font-medium uppercase tracking-wider">Total Entries</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight">{filteredRecords.length}</p>
            </div>
            <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4 sm:p-5 shadow-soft">
              <p className="text-xs text-foreground/70 font-medium uppercase tracking-wider">Avg Labour (7d)</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary mt-2 tracking-tight">{weeklyAvg}</p>
            </div>
            <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4 sm:p-5 shadow-soft">
              <p className="text-xs text-foreground/70 font-medium uppercase tracking-wider">Total Labour</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary mt-2 tracking-tight">{totalLabor}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4 sm:p-6 shadow-soft">
            <h2 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-4 sm:mb-5">
              Site Strength (Last 7 Days)
            </h2>
            {chartData.length === 0 ? (
              <p className="text-center text-foreground/60 py-8 text-sm">No data for the last 7 days.</p>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="labor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>

          {/* Link Generator - only show when a specific folder is selected */}
          {selectedFolderId && (
            <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4 sm:p-6 shadow-soft">
              <h2 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-4">
                Generate Entry Link <span className="text-primary">({selectedFolderName})</span>
              </h2>
              <div className="flex flex-col gap-3">
                <Button onClick={generateLink} disabled={generating} className="font-medium w-full sm:w-auto">
                  <Link2 className="w-4 h-4 mr-2" />
                  {generating ? "Generating..." : "Generate New Entry Link"}
                </Button>
                {generatedLink && (
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-xs bg-muted px-3 py-2 rounded-lg border border-border truncate flex-1 font-mono">
                      {generatedLink}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Records Table */}
          <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden shadow-soft">
            <div className="px-4 sm:px-6 py-4 border-b border-border/50 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> {showHistory ? "Past Records" : "Labour Records"}
              </h2>
              <div className="flex items-center gap-2">
                {hasHistory && (
                  <Button variant={showHistory ? "default" : "outline"} size="sm" onClick={() => setShowHistory(!showHistory)} className="font-medium">
                    <History className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{showHistory ? "Current" : "History"}</span>
                  </Button>
                )}
                {filteredRecords.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportCSV} className="font-medium">
                    <Download className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                )}
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-foreground/60 text-sm">Loading records...</div>
            ) : displayRecords.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-foreground/60 text-sm">
                {showHistory ? "No past records." : "No entries yet. Generate a link and share it with your mate."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs font-medium uppercase tracking-wider">Date</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Day</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right">Labour</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right">L</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right">W</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right">D</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRecords.map((record) => (
                      <TableRow key={record.id} className="border-border/50">
                        <TableCell className="font-mono font-medium text-sm">
                          {format(new Date(record.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-foreground/70 text-sm hidden sm:table-cell">
                          {format(new Date(record.date), "EEEE")}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary text-lg">
                          {record.labor_count}
                        </TableCell>
                        {(["l", "w", "d"] as const).map((field) => (
                          <TableCell key={field} className="text-right p-1 sm:p-2">
                            {editingCell?.id === record.id && editingCell.field === field ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleDimensionEdit(record.id, field, editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleDimensionEdit(record.id, field, editValue);
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                autoFocus
                                className="w-14 sm:w-16 h-8 text-center text-sm font-mono"
                              />
                            ) : (
                              <button
                                onClick={() => startEdit(record.id, field, record[field])}
                                className="w-14 sm:w-16 h-8 text-center text-sm font-mono rounded border border-transparent hover:border-border hover:bg-muted/50 transition-colors inline-flex items-center justify-center"
                              >
                                {record[field] != null ? record[field] : "—"}
                              </button>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-mono font-semibold text-foreground">
                          {calcQuantity(record.labor_count, record.l, record.w, record.d).toLocaleString()}
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
