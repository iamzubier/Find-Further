import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const SearchSchema = z.object({ tab: z.enum(["login","signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — FindFurther" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => { if (!loading && user) nav({ to: "/dashboard" }); }, [user, loading, nav]);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card-surface p-6 md:p-8">
        <h1 className="font-heading text-3xl font-extrabold">Welcome to FindFurther</h1>
        <p className="mt-1 text-sm text-muted-foreground">Free account. Profile-aware recommendations.</p>

        <Tabs defaultValue={search.tab ?? "signup"} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Create account</TabsTrigger>
            <TabsTrigger value="login">Log in</TabsTrigger>
          </TabsList>
          <TabsContent value="signup"><SignupForm /></TabsContent>
          <TabsContent value="login"><LoginForm /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const EDU_LEVELS = ["SSC / O-levels","HSC / A-levels","Undergraduate","Already graduated"];
const DREAM_COUNTRIES = ["USA","UK","Germany","Finland","Australia","Not sure yet"];

function SignupForm() {
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [edu, setEdu] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [hear, setHear] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || password.length < 6) { toast.error("Fill all fields (password ≥ 6 chars)"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) { toast.success("Check your email to confirm your account"); }
    setStep(2);
  };

  const finishStep2 = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("profiles").update({
          name, education_level: edu || null, countries, hear_about: hear || null,
        }).eq("id", userData.user.id);
      }
      toast.success("You're in!");
      nav({ to: "/dashboard" });
    } finally { setLoading(false); }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) { toast.error("Google sign-in failed"); setLoading(false); }
  };

  return (
    <div className="mt-6">
      <div className="mb-5 flex items-center gap-3 text-xs">
        <StepDot active={step >= 1} done={step > 1} label="Account" />
        <div className="h-px flex-1 bg-border" />
        <StepDot active={step >= 2} done={false} label="Goals" />
      </div>

      {step === 1 ? (
        <form onSubmit={submitStep1} className="space-y-4">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
          <Field label="Password">
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Divider />
          <Button type="button" variant="outline" onClick={google} disabled={loading} className="w-full">Continue with Google</Button>
        </form>
      ) : (
        <div className="space-y-5">
          <Field label="Where are you in school?">
            <Select value={edu} onValueChange={setEdu}>
              <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
              <SelectContent>{EDU_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Dream countries">
            <div className="flex flex-wrap gap-2">
              {DREAM_COUNTRIES.map((c) => {
                const on = countries.includes(c);
                return (
                  <button key={c} type="button" onClick={() => setCountries(on ? countries.filter(x => x!==c) : [...countries, c])}
                    className={`rounded-full px-4 py-1.5 text-sm transition-colors ${on ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground hover:border-primary/50"}`}>
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="How did you hear about us?">
            <Select value={hear} onValueChange={setHear}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="friend">A friend</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="google">Google search</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Button onClick={finishStep2} disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Finish
          </Button>
        </div>
      )}
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Welcome back"); nav({ to: "/dashboard" }); }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) { toast.error("Google sign-in failed"); setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
      <Field label="Password">
        <div className="relative">
          <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={async () => {
          if (!email) return toast.error("Enter your email first");
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
          if (error) toast.error(error.message); else toast.success("Password reset link sent");
        }} className="text-muted-foreground hover:text-primary">Forgot password?</button>
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Log in
      </Button>
      <Divider />
      <Button type="button" variant="outline" onClick={google} disabled={loading} className="w-full">Continue with Google</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div className="relative my-2 flex items-center">
      <div className="h-px flex-1 bg-border" />
      <span className="px-3 text-xs text-muted-foreground">or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
        done ? "bg-primary text-primary-foreground" :
        active ? "border border-primary text-primary" :
        "border border-border text-muted-foreground"
      }`}>{done ? <Check className="h-3 w-3" /> : (label === "Account" ? "1" : "2")}</div>
      <span className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}
