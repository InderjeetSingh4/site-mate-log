import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardHat, ArrowLeft, Lock, Mail } from "lucide-react";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardHat className="w-6 h-6 text-primary" />
            <h1 className="font-display font-bold text-lg tracking-tight">CivilSite</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
        <h2 className="font-display font-bold text-2xl tracking-tight">Account Settings</h2>

        {/* Change Password */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Change Password
          </h3>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          {newPassword && (
            <ul className="space-y-1 text-xs">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={rule.test(newPassword) ? "text-green-500" : "text-muted-foreground"}>
                  {rule.test(newPassword) ? "✓" : "○"} {rule.label}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          <Button onClick={handleUpdatePassword} disabled={passwordLoading} className="font-display font-semibold w-full">
            {passwordLoading ? "Updating..." : "Update Password"}
          </Button>
        </div>

        {/* Change Email */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Change Email
          </h3>

          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
            />
          </div>

          <Button onClick={handleUpdateEmail} disabled={emailLoading} className="font-display font-semibold w-full">
            {emailLoading ? "Updating..." : "Update Email"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
