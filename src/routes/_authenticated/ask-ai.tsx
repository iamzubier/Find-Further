import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { askAria } from "@/lib/aria.functions";
import { useServerFn } from "@tanstack/react-start";
import { gpaConversionLine } from "@/lib/gpa";

export const Route = createFileRoute("/_authenticated/ask-ai")({
  head: () => ({ meta: [{ title: "Ask Aria — FindFurther" }, { name: "robots", content: "noindex" }] }),
  component: AskAriaPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "Is my profile strong enough for TU Munich?",
  "Which scholarships can I apply for right now?",
  "What should I improve first?",
  "Evaluate my ECA for CS programs",
];

function AskAriaPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askAria);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      const name = data?.name || "there";
      const program = data?.program ? ` in ${data.program}` : "";
      const countries = (data?.countries && data.countries.length) ? ` toward ${data.countries.slice(0,3).join(", ")}` : "";
      setMessages([{
        role: "assistant",
        content: `Hey ${name} 👋 I'm Aria, your study-abroad advisor. I can see your profile${program ? "" + program : ""}${countries}. Ask me anything — profile critiques, scholarships, university matches, or how to fix weak spots.`,
      }]);
    });
  }, [user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next.map(m => ({ role: m.role, content: m.content })) } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: "Aria couldn't respond. Try again in a moment." }]);
    } finally { setLoading(false); }
  };

  const gpaLine = gpaConversionLine(profile?.hsc_gpa);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[260px_1fr]">
      <aside className="card-surface h-fit p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Your profile</div>
        <h3 className="mt-1 font-heading text-lg font-extrabold">{profile?.name || "You"}</h3>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row k="Score" v="7.2 / 10" />
          <Row k="Major" v={profile?.program || "—"} />
          <Row k="GPA" v={profile?.hsc_gpa ? `${profile.hsc_gpa}/5.00` : "—"} />
        </div>
        {gpaLine && <div className="mt-3 rounded-md bg-secondary/60 px-3 py-2 text-[11px] text-muted-foreground">{gpaLine}</div>}
        {profile?.countries?.length ? (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Targets</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.countries.map((c: string) => <span key={c} className="rounded-full bg-secondary px-2.5 py-1 text-xs">{c}</span>)}
            </div>
          </div>
        ) : null}
        <div className="mt-5 border-t border-border pt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Try asking</div>
          <div className="mt-2 space-y-1.5">
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => send(q)} className="block w-full rounded-md border border-border bg-secondary/60 px-3 py-2 text-left text-xs text-foreground/85 hover:border-primary/40 hover:text-primary">
                {q}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="card-surface flex h-[78vh] flex-col">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="relative">
            <div className="absolute inset-0 -m-1 rounded-full bg-primary/30 blur-md" />
            <div className="relative grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-base font-extrabold">Aria</div>
            <div className="text-xs text-muted-foreground">Your study-abroad advisor · online</div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-secondary px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-border p-3">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Aria anything…" className="h-11 bg-secondary" />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11 w-11 bg-primary p-0 text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{k}</span>
      <span className="font-semibold text-foreground">{v}</span>
    </div>
  );
}
