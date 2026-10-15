import { findMatchRange } from "@/lib/search-suggestions";

export function MatchText({ text, query }: { text: string; query: string }) {
  const range = findMatchRange(text, query);
  if (!range) return <>{text}</>;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-primary/15 px-0.5 font-semibold text-foreground">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}
