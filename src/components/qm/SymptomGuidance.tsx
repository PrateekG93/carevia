import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { assessSymptoms, type Guidance } from "@/lib/symptoms";
export function SymptomGuidance({ initialText = "" }: { initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [result, setResult] = useState<Guidance | null>(null);
  return (
    <section className="space-y-5">
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal">
          <Activity className="h-4 w-4" /> HEALTH GUIDANCE
        </p>
        <h2 className="text-2xl font-bold">Not Sure What You Need?</h2>
        <p className="mt-2 text-muted-foreground">
          Describe how you're feeling and explore the next appropriate steps.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setResult(assessSymptoms(text));
        }}
        className="space-y-4"
      >
        <label htmlFor="symptoms" className="text-sm font-medium">
          How are you feeling?
        </label>
        <Textarea
          id="symptoms"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          placeholder="Describe your symptoms…"
          required
          minLength={3}
          maxLength={1500}
        />
        <div className="flex flex-wrap gap-2">
          {["Fever", "Headache", "Cough", "Cold", "Stomach discomfort"].map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setText(s);
                setResult(null);
              }}
            >
              {s}
            </Button>
          ))}
        </div>
        <Button type="submit" disabled={text.trim().length < 3}>
          Get Guidance <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        General information only, not a diagnosis or prescription. This does not replace
        professional medical advice.
      </p>
      {result && (
        <div
          role="status"
          className={`border-l-4 p-5 ${result.level === "emergency" ? "border-destructive bg-destructive/5" : "border-teal bg-soft"}`}
        >
          <h3 className="text-lg font-bold">{result.title}</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {result.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {result.level === "emergency" ? (
            <Button asChild variant="destructive" className="mt-4">
              <a href="tel:112">
                <Siren className="h-4 w-4" />
                Call 112 (India)
              </a>
            </Button>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/consult">Consult a Doctor</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/nearby">Find Nearby Medical Care</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
