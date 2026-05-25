import { ExternalLink } from "lucide-react";

const URL_REGEX = /(https?:\/\/[^\s،,؛;)\]]+)/g;

function renderWithLinks(text: string): React.ReactNode[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      const display = part.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:text-primary/80 break-all"
        >
          {display}
          <ExternalLink className="h-3 w-3 shrink-0 inline" />
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className }: MessageContentProps) {
  const lines = content.split("\n");
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <p key={i} className={line === "" ? "mt-2" : undefined}>
          {renderWithLinks(line)}
        </p>
      ))}
    </div>
  );
}
