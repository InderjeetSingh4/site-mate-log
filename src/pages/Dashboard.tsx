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
import { HardHat, Link2, LogOut, Users, Copy, Check, Settings, Download, ArrowLeftRight, History, Pencil, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import SiteFolderSidebar, { type SiteFolder } from "@/components/SiteFolderSidebar";
import { format, subDays, isAfter, startOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

const calcQuantity = (labor: number, l: number | null, w: number | null, d: number | null) =>
  labor * (l || 1) * (w || 1) * (d || 1);

interface EditState {
  date: Date;
  labor_count: string;
  l: string;
  w: string;
  d: string;
}

const Dashboard = () => {
  const [records, setRecords] = useState<LaborRecord[]>([]);
  const [folders, setFolders] = useState<SiteFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedUlb = sessionStorage.getItem("selected_ulb");

  useEffect(() => {
    if (!selectedUlb) { navigate("/select-ulb"); return; }
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
      .from("labor_records").select("*").eq("ulb", selectedUlb!)
      .order("date", { ascending: true });
    if (error) toast({ title: "Error fetching records", description: mapDatabaseError(error), variant: "destructive" });
    else setRecords(data || []);
    setLoading(false);
  };

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("site_folders").select("*").eq("ulb", selectedUlb!)
      .order("created_at", { ascending: true });
    if (!error && data) setFolders(data);
  };

  const filteredRecords = useMemo(() => {
    if (!selectedFolderId) return records;
    return records.filter((r) => r.folder_id === selectedFolderId);
  }, [records, selectedFolderId]);

  const currentBatch = useMemo(() => showHistory ? [] : filteredRecords.slice(-BATCH_SIZE), [filteredRecords, showHistory]);
  const historyBatch = useMemo(() => {
    if (!showHistory) return [];
    const cutoff = filteredRecords.length - BATCH_SIZE;
    return cutoff > 0 ? filteredRecords.slice(0, cutoff) : [];
  }, [filteredRecords, showHistory]);
  const displayRecords = showHistory ? historyBatch : currentBatch;

  const totalLabor = useMemo(() => filteredRecords.reduce((s, r) => s + r.labor_count, 0), [filteredRecords]);

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
  const selectedFolderName = selectedFolderId ? folders.find((f) => f.id === selectedFolderId)?.name : "All Sites";
  const hasHistory = filteredRecords.length > BATCH_SIZE;

  const generateLink = async () => {
    setGenerating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    const insertData: any = { created_by: session.user.id, ulb: selectedUlb };
    if (selectedFolderId) insertData.folder_id = selectedFolderId;
    const { data, error } = await supabase.from("active_tokens").insert(insertData).select("token_uuid").single();
    if (error) toast({ title: "Error", description: mapDatabaseError(error), variant: "destructive" });
    else setGeneratedLink(`${window.location.origin}/submit/${data.token_uuid}`);
    setGenerating(false);
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const handleLogout = async () => { await supabase.auth.signOut(); sessionStorage.removeItem("selected_ulb"); navigate("/auth"); };
  const handleSwitchUlb = () => { sessionStorage.removeItem("selected_ulb"); navigate("/select-ulb"); };

  const startEditRow = (record: LaborRecord) => {
    setEditingRowId(record.id);
    setEditState({
      date: new Date(record.date),
      labor_count: String(record.labor_count),
      l: record.l != null ? String(record.l) : "",
      w: record.w != null ? String(record.w) : "",
      d: record.d != null ? String(record.d) : "",
    });
  };

  const cancelEdit = () => { setEditingRowId(null); setEditState(null); };

  const saveEditRow = async () => {
    if (!editingRowId || !editState) return;
    const laborCount = parseInt(editState.labor_count);
    if (isNaN(laborCount) || laborCount < 0) {
      toast({ title: "Invalid labour count", variant: "destructive" });
      return;
    }
    const lVal = editState.l === "" ? null : parseFloat(editState.l);
    const wVal = editState.w === "" ? null : parseFloat(editState.w);
    const dVal = editState.d === "" ? null : parseFloat(editState.d);
    const quantity = calcQuantity(laborCount, lVal, wVal, dVal);

    const { error } = await supabase.from("labor_records").update({
      date: format(editState.date, "yyyy-MM-dd"),
      labor_count: laborCount,
      l: lVal, w: wVal, d: dVal, quantity,
    }).eq("id", editingRowId);

    if (error) {
      toast({ title: "Error saving", description: mapDatabaseError(error), variant: "destructive" });
    } else {
      setRecords((prev) => prev.map((r) => r.id === editingRowId
        ? { ...r, date: format(editState.date, "yyyy-MM-dd"), labor_count: laborCount, l: lVal, w: wVal, d: dVal, quantity }
        : r
      ));
      toast({ title: "Record updated" });
    }
    cancelEdit();
  };

  const exportCSV = () => {
    if (filteredRecords.length === 0) return;
    const header = "Date,Day,Labour Count,L,W,D,Quantity";
    const rows = filteredRecords.map((r) => {
      const d = new Date(r.date);
      return `${format(d, "dd/MM/yyyy")},${format(d, "EEEE")},${r.labor_count},${r.l ?? ""},${r.w ?? ""},${r.d ?? ""},${calcQuantity(r.labor_count, r.l, r.w, r.d)}`;
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `Site_Labour_Report_${format(new Date(), "dd-MM-yyyy")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const editInput = (field: keyof EditState, type: "number" | "text" = "number", className = "") => {
    if (!editState) return null;
    return (
      <Input
        type={type}
        value={editState[field] as string}
        onChange={(e) => setEditState({ ...editState!, [field]: e.target.value })}
        className={cn("h-8 text-sm font-mono text-center", className)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-[hsl(220,60%,20%)] via-[hsl(220,50%,40%)] to-[hsl(220,30%,85%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(220,25%,15%)] dark:to-[hsl(220,20%,25%)]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <SiteFolderSidebar folders={folders} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onFoldersChange={fetchFolders} mode="mobile" onSwitchUlb={handleSwitchUlb} />
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
              <ArrowLeftRight className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Switch ULB</span>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-foreground hover:text-foreground/80"><Settings className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-foreground hover:text-foreground/80">
              <LogOut className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto min-h-[calc(100vh-57px)]">
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border/30 bg-card/40 backdrop-blur-sm p-5">
          <SiteFolderSidebar folders={folders} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onFoldersChange={fetchFolders} mode="desktop" onSwitchUlb={handleSwitchUlb} />
        </aside>

        <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in max-w-4xl w-full">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{selectedFolderName}</h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Total Entries", value: filteredRecords.length, highlight: false },
              { label: "Avg Labour (7d)", value: weeklyAvg, highlight: true },
              { label: "Total Labour", value: totalLabor, highlight: true },
            ].map((s) => (
              <div key={s.label} className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4 sm:p-5 shadow-soft">
                <p className="text-xs text-foreground/70 font-medium uppercase tracking-wider">{s.label}</p>
                <p className={cn("text-2xl sm:text-3xl font-bold mt-2 tracking-tight", s.highlight && "text-primary")}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4 sm:p-6 shadow-soft">
            <h2 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-4 sm:mb-5">Site Strength (Last 7 Days)</h2>
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

          {/* Link Generator */}
          {selectedFolderId && (
            <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/50 p-4 sm:p-6 shadow-soft">
              <h2 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-4">
                Generate Entry Link <span className="text-primary">({selectedFolderName})</span>
              </h2>
              <div className="flex flex-col gap-3">
                <Button onClick={generateLink} disabled={generating} className="font-medium w-full sm:w-auto">
                  <Link2 className="w-4 h-4 mr-2" />{generating ? "Generating..." : "Generate New Entry Link"}
                </Button>
                {generatedLink && (
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-xs bg-muted px-3 py-2 rounded-lg border border-border truncate flex-1 font-mono">{generatedLink}</code>
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
                    <History className="w-4 h-4 mr-1" /><span className="hidden sm:inline">{showHistory ? "Current" : "History"}</span>
                  </Button>
                )}
                {filteredRecords.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportCSV} className="font-medium">
                    <Download className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">CSV</span>
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
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-right w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRecords.map((record) => {
                      const isEditing = editingRowId === record.id;
                      return (
                        <TableRow key={record.id} className="border-border/50">
                          {/* Date */}
                          <TableCell className="font-mono font-medium text-sm p-2">
                            {isEditing && editState ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 text-xs font-mono w-full justify-start">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    {format(editState.date, "dd MMM")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                                  <Calendar mode="single" selected={editState.date} onSelect={(d) => d && setEditState({ ...editState, date: d })} initialFocus />
                                </PopoverContent>
                              </Popover>
                            ) : format(new Date(record.date), "dd MMM yyyy")}
                          </TableCell>
                          {/* Day */}
                          <TableCell className="text-foreground/70 text-sm hidden sm:table-cell p-2">
                            {isEditing && editState ? format(editState.date, "EEEE") : format(new Date(record.date), "EEEE")}
                          </TableCell>
                          {/* Labour */}
                          <TableCell className="text-right p-2">
                            {isEditing ? (
                              <Input type="number" min="0" value={editState!.labor_count} onChange={(e) => setEditState({ ...editState!, labor_count: e.target.value })} className="h-8 w-16 sm:w-20 text-sm font-mono text-center ml-auto" />
                            ) : (
                              <span className="font-mono font-bold text-primary text-lg">{record.labor_count}</span>
                            )}
                          </TableCell>
                          {/* L, W, D */}
                          {(["l", "w", "d"] as const).map((field) => (
                            <TableCell key={field} className="text-right p-1 sm:p-2">
                              {isEditing ? (
                                <Input type="number" min="0" value={editState![field]} onChange={(e) => setEditState({ ...editState!, [field]: e.target.value })} className="h-8 w-14 sm:w-16 text-sm font-mono text-center ml-auto" />
                              ) : (
                                <span className="font-mono text-sm">{record[field] != null ? record[field] : "—"}</span>
                              )}
                            </TableCell>
                          ))}
                          {/* Qty */}
                          <TableCell className="text-right font-mono font-semibold text-foreground p-2">
                            {isEditing && editState
                              ? calcQuantity(parseInt(editState.labor_count) || 0, editState.l ? parseFloat(editState.l) : null, editState.w ? parseFloat(editState.w) : null, editState.d ? parseFloat(editState.d) : null).toLocaleString()
                              : calcQuantity(record.labor_count, record.l, record.w, record.d).toLocaleString()
                            }
                          </TableCell>
                          {/* Edit / Save */}
                          <TableCell className="text-right p-2">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEditRow}><Check className="w-4 h-4 text-primary" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}><X className="w-4 h-4 text-foreground/60" /></Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditRow(record)}><Pencil className="w-3.5 h-3.5 text-foreground/60" /></Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
