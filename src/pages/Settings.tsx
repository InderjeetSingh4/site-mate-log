import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HardHat, ArrowLeft, Lock, Mail, Trash2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const isPasswordStrong = passwordRules.every((r) => r.test(newPassword));

  const handleUpdatePassword = async () => {
    if (!isPasswordStrong) {
      toast({ title: "Weak password", description: "Please meet all password requirements.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleUpdateEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Confirmation sent!", description: "Check your new email to confirm the change." });
      setNewEmail("");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Delete user's data first
    const userId = session.user.id;
    await supabase.from("labor_records").delete().eq("user_id", userId);
    await supabase.from("active_tokens").delete().eq("created_by", userId);
    await supabase.from("site_folders").delete().eq("user_id", userId);

    // Sign out
    await supabase.auth.signOut();
    sessionStorage.removeItem("selected_ulb");
    setDeleteLoading(false);
    toast({ title: "Account data deleted", description: "Your data has been removed. Contact support to fully delete your auth account." });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-foreground">NatureSection</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-foreground hover:text-foreground/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
        <h2 className="font-bold text-2xl tracking-tight text-foreground">Account Settings</h2>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-soft">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/70 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Change Password
          </h3>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
          </div>

          {newPassword && (
            <ul className="space-y-1 text-xs">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={rule.test(newPassword) ? "text-success" : "text-foreground/50"}>
                  {rule.test(newPassword) ? "✓" : "○"} {rule.label}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          <Button onClick={handleUpdatePassword} disabled={passwordLoading} className="font-medium w-full">
            {passwordLoading ? "Updating..." : "Update Password"}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-soft">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/70 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Change Email
          </h3>

          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email" />
          </div>

          <Button onClick={handleUpdateEmail} disabled={emailLoading} className="font-medium w-full">
            {emailLoading ? "Updating..." : "Update Email"}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-soft">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </h3>
          <p className="text-sm text-foreground/70">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full font-medium" disabled={deleteLoading}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteLoading ? "Deleting..." : "Delete Account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your folders, labor records, and tokens. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default Settings;
