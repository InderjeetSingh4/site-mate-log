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
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header — frosted glass */}
      <header className="border-b border-border/40 glass-strong sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <SiteFolderSidebar folders={folders} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onFoldersChange={fetchFolders} mode="mobile" onSwitchUlb={handleSwitchUlb} />
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-soft">
              <HardHat className="w-4 h-4 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="font-bold text-base sm:text-lg tracking-tight text-foreground hidden sm:block">NatureSection</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="hidden lg:inline text-xs font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              {selectedUlb}
            </span>
            <motion.div whileTap={{ scale: 0.98 }} className="inline-flex lg:hidden">
              <Button variant="ghost" size="sm" onClick={handleSwitchUlb} className="text-muted-foreground hover:text-foreground rounded-full">
                <ArrowLeftRight className="w-4 h-4 mr-1" strokeWidth={1.5} /><span className="hidden sm:inline text-xs">Switch</span>
              </Button>
            </motion.div>
            <ThemeToggle />
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground rounded-full">
                <Settings className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground rounded-full">
                <LogOut className="w-4 h-4 sm:mr-1.5" strokeWidth={1.5} /><span className="hidden sm:inline text-xs">Sign Out</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto min-h-[calc(100vh-57px)]">
        {/* Desktop sidebar — glass */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border/30 glass p-5">
          <SiteFolderSidebar folders={folders} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onFoldersChange={fetchFolders} mode="desktop" onSwitchUlb={handleSwitchUlb} />
        </aside>

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6 max-w-4xl w-full">
          {/* Folder label */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{selectedFolderName}</h2>
          </motion.div>

          {/* Stats — iOS widget style */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Total Entries", value: filteredRecords.length, highlight: false },
              { label: "Avg Labour (7d)", value: weeklyAvg, highlight: true },
              { label: "Total Labour", value: totalLabor, highlight: true },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-3xl p-4 sm:p-5 shadow-apple"
              >
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={cn("text-2xl sm:text-3xl font-bold mt-1.5 tracking-tight", s.highlight ? "text-primary" : "text-foreground")}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart — glass card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-3xl p-4 sm:p-6 shadow-apple">
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-4 sm:mb-5">Site Strength (Last 7 Days)</h2>
            {chartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No data for the last 7 days.</p>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="labor" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </motion.div>

          {/* Link Generator */}
          {selectedFolderId && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-4 sm:p-6 shadow-apple">
              <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-4">
                Generate Entry Link <span className="text-primary">({selectedFolderName})</span>
              </h2>
              <div className="flex flex-col gap-3">
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button onClick={generateLink} disabled={generating} className="font-semibold w-full sm:w-auto rounded-full h-11 px-6 bg-primary hover:bg-primary/90 shadow-soft">
                    <Link2 className="w-4 h-4 mr-2" strokeWidth={1.5} />{generating ? "Generating..." : "Generate Link"}
                  </Button>
                </motion.div>
                {generatedLink && (
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-xs bg-secondary px-3 py-2.5 rounded-xl border border-border/50 truncate flex-1 font-mono text-muted-foreground">{generatedLink}</code>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button variant="secondary" size="icon" onClick={copyLink} className="shrink-0 rounded-full">
                        {copied ? <Check className="w-4 h-4 text-success" strokeWidth={1.5} /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Records Table — Numbers-style */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-3xl overflow-hidden shadow-apple">
            <div className="px-4 sm:px-6 py-4 border-b border-border/30 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" strokeWidth={1.5} /> {showHistory ? "Past Records" : "Labour Records"}
              </h2>
              <div className="flex items-center gap-2">
                {hasHistory && (
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button variant={showHistory ? "default" : "secondary"} size="sm" onClick={() => setShowHistory(!showHistory)} className="font-semibold rounded-full text-xs h-8 px-3">
                      <History className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} /><span className="hidden sm:inline">{showHistory ? "Current" : "History"}</span>
                    </Button>
                  </motion.div>
                )}
                {filteredRecords.length > 0 && (
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button variant="secondary" size="sm" onClick={exportCSV} className="font-semibold rounded-full text-xs h-8 px-3">
                      <Download className="w-3.5 h-3.5 mr-1 sm:mr-1.5" strokeWidth={1.5} /><span className="hidden sm:inline">Export</span><span className="sm:hidden">CSV</span>
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading records...</div>
            ) : displayRecords.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-muted-foreground text-sm">
                {showHistory ? "No past records." : "No entries yet. Generate a link and share it."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/20 hover:bg-transparent">
                      <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent sticky top-0">Date</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent sticky top-0 hidden sm:table-cell">Day</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent sticky top-0 text-right">Labour</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent sticky top-0 text-right">L</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent sticky top-0 text-right">W</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent sticky top-0 text-right">D</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent sticky top-0 text-right">Qty</TableHead>
                      <TableHead className="w-14 bg-transparent sticky top-0"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {displayRecords.map((record) => {
                        const isEditing = editingRowId === record.id;
                        return (
                          <motion.tr
                            key={record.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-border/20 hover:bg-accent/30 transition-colors"
                          >
                            {/* Date */}
                            <TableCell className="font-mono text-sm p-2.5">
                              {isEditing && editState ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="secondary" size="sm" className="h-8 text-xs font-mono rounded-lg w-full justify-start bg-input">
                                      <CalendarIcon className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                                      {format(editState.date, "dd MMM")}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-popover z-50 rounded-2xl shadow-apple" align="start">
                                    <Calendar mode="single" selected={editState.date} onSelect={(d) => d && setEditState({ ...editState, date: d })} initialFocus />
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <span className="font-medium">{format(new Date(record.date), "dd MMM yyyy")}</span>
                              )}
                            </TableCell>
                            {/* Day */}
                            <TableCell className="text-muted-foreground text-sm hidden sm:table-cell p-2.5">
                              {isEditing && editState ? format(editState.date, "EEE") : format(new Date(record.date), "EEE")}
                            </TableCell>
                            {/* Labour */}
                            <TableCell className="text-right p-2.5">
                              {isEditing ? (
                                <Input type="number" min="0" value={editState!.labor_count} onChange={(e) => setEditState({ ...editState!, labor_count: e.target.value })} className="h-8 w-16 sm:w-20 text-sm font-mono text-center ml-auto rounded-lg bg-input border-0 focus:ring-2 focus:ring-primary" />
                              ) : (
                                <span className="font-bold text-primary text-lg tabular-nums">{record.labor_count}</span>
                              )}
                            </TableCell>
                            {/* L, W, D */}
                            {(["l", "w", "d"] as const).map((field) => (
                              <TableCell key={field} className="text-right p-1.5 sm:p-2.5">
                                {isEditing ? (
                                  <Input type="number" min="0" value={editState![field]} onChange={(e) => setEditState({ ...editState!, [field]: e.target.value })} className="h-8 w-14 sm:w-16 text-sm font-mono text-center ml-auto rounded-lg bg-input border-0 focus:ring-2 focus:ring-primary" />
                                ) : (
                                  <span className="font-mono text-sm tabular-nums text-muted-foreground">{record[field] != null ? record[field] : "—"}</span>
                                )}
                              </TableCell>
                            ))}
                            {/* Qty */}
                            <TableCell className="text-right font-mono font-semibold text-foreground p-2.5 tabular-nums">
                              {isEditing && editState
                                ? calcQuantity(parseInt(editState.labor_count) || 0, editState.l ? parseFloat(editState.l) : null, editState.w ? parseFloat(editState.w) : null, editState.d ? parseFloat(editState.d) : null).toLocaleString()
                                : calcQuantity(record.labor_count, record.l, record.w, record.d).toLocaleString()
                              }
                            </TableCell>
                            {/* Edit / Save */}
                            <TableCell className="text-right p-2.5">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-0.5">
                                  <motion.div whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={saveEditRow}>
                                      <Check className="w-4 h-4 text-primary" strokeWidth={2} />
                                    </Button>
                                  </motion.div>
                                  <motion.div whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={cancelEdit}>
                                      <X className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                                    </Button>
                                  </motion.div>
                                </div>
                              ) : (
                                <motion.div whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => startEditRow(record)}>
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                                  </Button>
                                </motion.div>
                              )}
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;