import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfile } from "../context/ProfileContext";

const ProfileModal = ({ open, onClose }) => {
  const { profile, saveProfile, loadProfile, error } = useProfile();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open, loadProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setAddress(profile.address ?? "");
      setPincode(profile.pincode ?? "");
      setCurrency(profile.currency ?? "USD");
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await saveProfile({ name, address, pincode, currency });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Used for delivery and currency when searching (overrides chatbot dummy values).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              placeholder="Full address"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Pincode</span>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              placeholder="e.g. 400001 or 10001"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full gradient-button py-2.5 rounded-lg font-medium disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
