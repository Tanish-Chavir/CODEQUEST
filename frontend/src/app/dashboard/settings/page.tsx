"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import {
  User, Lock, Moon, Sun, Save, Phone, MapPin, FileText,
  Loader2, CheckCircle, Eye, EyeOff, Smile
} from "lucide-react";

const AVATAR_EMOJIS = ["🧑‍💻","👨‍💻","👩‍💻","🦸","🧙","🐉","🦊","🐺","🤖","👾","🐱","🦁"];

const COUNTRIES = [
  "India","United States","United Kingdom","Canada","Australia",
  "Germany","France","Japan","Brazil","Singapore","Other"
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ text: "", ok: true });

  const [profile, setProfile] = useState({
    username: "", fullName: "", email: "",
    phone: "", bio: "", country: "", avatar: "🧑‍💻",
  });

  const [theme, setTheme] = useState("dark");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pickingAvatar, setPickingAvatar] = useState(false);

  useEffect(() => {
    fetchWithAuth("/auth/me").then(u => {
      setProfile({
        username:  u.username  || "",
        fullName:  u.fullName  || "",
        email:     u.email     || "",
        phone:     u.phone     || "",
        bio:       u.bio       || "",
        country:   u.country   || "",
        avatar:    u.avatar    || "🧑‍💻",
      });
      setTheme(u.theme || "dark");
    }).finally(() => setLoading(false));
  }, []);

  const flash = (text: string, ok = true) => {
    setSaveMsg({ text, ok });
    setTimeout(() => setSaveMsg({ text: "", ok: true }), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchWithAuth("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          username: profile.username,
          fullName: profile.fullName,
          phone:    profile.phone,
          bio:      profile.bio,
          country:  profile.country,
          avatar:   profile.avatar,
        }),
      });
      flash("Profile saved successfully! ✅");
    } catch (err: any) {
      flash(err.message || "Save failed", false);
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = (t: "dark" | "light") => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("theme", t);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const navItems = [
    { id: "profile",  label: "Profile",  icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "theme",    label: "Appearance",icon: Moon },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Account Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your personal info, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <nav className="space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                activeSection === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">

          {/* ── PROFILE ── */}
          {activeSection === "profile" && (
            <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Profile Information
              </h2>

              {/* Avatar Picker */}
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setPickingAvatar(!pickingAvatar)}
                  className="w-16 h-16 rounded-2xl bg-secondary border-2 border-border flex items-center justify-center text-4xl hover:border-primary/50 transition-all"
                >
                  {profile.avatar}
                </button>
                <div>
                  <p className="font-bold text-sm">Avatar Emoji</p>
                  <p className="text-xs text-muted-foreground">Click to pick your avatar</p>
                </div>
              </div>
              {pickingAvatar && (
                <div className="flex flex-wrap gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
                  {AVATAR_EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => { setProfile({...profile, avatar: e}); setPickingAvatar(false); }}
                      className={`text-2xl w-10 h-10 rounded-lg hover:bg-secondary border-2 transition-all ${profile.avatar === e ? "border-primary" : "border-transparent"}`}
                    >{e}</button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Username *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})}
                      required className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                  <input value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})}
                    placeholder="e.g. Tanish Chaudhary"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                {/* Email (readonly) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                  <input value={profile.email} disabled
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-muted-foreground cursor-not-allowed" />
                </div>
                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}
                      placeholder="+91 98765 43210"
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                {/* Country */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <select value={profile.country} onChange={e => setProfile({...profile, country: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                      <option value="">Select country...</option>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})}
                    rows={3} placeholder="Tell us a bit about yourself..."
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                {saveMsg.text && (
                  <span className={`text-sm font-bold ${saveMsg.ok ? "text-green-500" : "text-destructive"}`}>
                    {saveMsg.text}
                  </span>
                )}
                <button type="submit" disabled={saving}
                  className="ml-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-70">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* ── SECURITY ── */}
          {activeSection === "security" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
                <Lock className="w-5 h-5" /> Change Password
              </h2>
              {[
                { label: "Current Password", key: "current", show: showCurrent, setShow: setShowCurrent },
                { label: "New Password",     key: "newPw",   show: showNew,     setShow: setShowNew },
                { label: "Confirm Password", key: "confirm", show: showConfirm, setShow: setShowConfirm },
              ].map(({ label, key, show, setShow }) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input type={show ? "text" : "password"} placeholder="••••••••"
                      value={(pwForm as any)[key]}
                      onChange={e => setPwForm({...pwForm, [key]: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <button className="bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white px-6 py-2.5 rounded-xl font-bold transition-all">
                Update Password
              </button>
            </div>
          )}

          {/* ── THEME ── */}
          {activeSection === "theme" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold">Appearance</h2>
              <p className="text-sm text-muted-foreground">Choose your preferred theme for the platform.</p>
              <div className="flex gap-4 mt-4">
                {[
                  { key: "dark",  label: "Dark Mode",  icon: Moon,  desc: "Easy on the eyes at night" },
                  { key: "light", label: "Light Mode", icon: Sun,   desc: "Clean and bright" },
                ].map(({ key, label, icon: Icon, desc }) => (
                  <button key={key} onClick={() => toggleTheme(key as "dark" | "light")}
                    className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                      theme === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Icon className={`w-8 h-8 ${theme === key ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-bold text-sm">{label}</span>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                    {theme === key && <CheckCircle className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
