import type { ReactNode } from 'react';
import { cn } from '@askalert/ui';

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' };

function inlineFormat(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(
      <strong key={`b-${key++}`} className="font-semibold text-foreground">
        {match[0].slice(2, -2)}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length ? parts : [text];
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim());
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('>')) {
        quoteLines.push((lines[i] ?? '').trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1] ?? '')) {
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        rows.push(splitTableRow(lines[i] ?? ''));
        i += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const para: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = (lines[i] ?? '').trim();
      if (
        !next ||
        next.startsWith('>') ||
        next.startsWith('|') ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        next === '---'
      ) {
        break;
      }
      para.push(next);
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: para.join(' ') });
  }

  return blocks;
}

export function MarkdownLite({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseBlocks(content);

  return (
    <div className={cn('space-y-4 text-base leading-relaxed text-muted-foreground', className)}>
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={index} className="text-pretty">
              {inlineFormat(block.text)}
            </p>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-orange-500/70 bg-orange-500/5 py-3 pl-4 pr-3 text-foreground/90"
            >
              {inlineFormat(block.text)}
            </blockquote>
          );
        }
        if (block.type === 'hr') {
          return <hr key={index} className="border-border/80" />;
        }
        if (block.type === 'ul') {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inlineFormat(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={index} className="list-decimal space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inlineFormat(item)}</li>
              ))}
            </ol>
          );
        }
        return (
          <div key={index} className="overflow-x-auto rounded-2xl border border-border/80">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-navy-950 text-surface">
                <tr>
                  {block.headers.map((header, headerIndex) => (
                    <th key={headerIndex} className="px-3 py-2.5 font-semibold">
                      {inlineFormat(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? 'bg-card' : 'bg-surface-subtle/60'}
                  >
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border-t border-border/70 px-3 py-2.5 align-top">
                        {inlineFormat(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
