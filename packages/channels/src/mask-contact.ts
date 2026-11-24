import type { MaskResult } from './types';

const DIGIT_WORDS: Record<string, string> = {
  zero: '0',
  oh: '0',
  o: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

const MASK = '[hidden]';

function replaceDigitLookalikes(input: string): string {
  return input
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8');
}

function expandSpelledDigits(input: string): string {
  return input.replace(
    /\b(?:zero|oh|o|one|two|three|four|five|six|seven|eight|nine)(?:[\s\-.]*(?:zero|oh|o|one|two|three|four|five|six|seven|eight|nine)){6,}\b/gi,
    (match) => {
      const parts = match.toLowerCase().split(/[\s\-.]+/).filter(Boolean);
      return parts.map((part) => DIGIT_WORDS[part] ?? '').join('');
    },
  );
}

function normalizeForPhoneScan(input: string): string {
  return replaceDigitLookalikes(expandSpelledDigits(input));
}

function collectPhoneMatches(text: string): string[] {
  const patterns: RegExp[] = [
    /\+?\s*234[\s.\-]*\(?(?:0)?[\s.\-]*[789](?:[\s.\-]*\d){9}\b/gi,
    /(?<!\d)0[\s.\-]*[789][\s.\-]*[01](?:[\s.\-]*\d){8}\b/gi,
    /(?<!\d)(?:\+?234|0)[789][01]\d{8}\b/gi,
  ];
  const found = new Set<string>();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match[0]) {
        found.add(match[0]);
      }
    }
  }
  return [...found];
}

function phoneWindowPattern(compactDigits: string): RegExp {
  const body = compactDigits
    .split('')
    .map((digit) => {
      if (digit === '0') {
        return '[0Oo]';
      }
      if (digit === '1') {
        return '[1Il|]';
      }
      if (digit === '5') {
        return '[5Ss]';
      }
      if (digit === '8') {
        return '[8Bb]';
      }
      return digit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('[\\s.\\-()]*');
  return new RegExp(body, 'i');
}

/**
 * Mask Nigerian contact details before relay. Pure and side-effect free.
 */
export function maskContactDetails(text: string): MaskResult {
  let next = text;
  const reasons = new Set<string>();

  const emailRe = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  if (emailRe.test(next)) {
    next = next.replace(emailRe, MASK);
    reasons.add('email');
  }

  const urlRe =
    /(?:https?:\/\/|www\.)[^\s<>"']+/gi;
  if (urlRe.test(next)) {
    next = next.replace(urlRe, MASK);
    reasons.add('link');
  }

  const handleRe = /(^|[\s(])[@#][A-Za-z0-9._]{2,}\b/g;
  if (handleRe.test(next)) {
    next = next.replace(handleRe, `$1${MASK}`);
    reasons.add('social');
  }

  const phraseRe =
    /\b(?:call\s*me|dm\s*me|text\s*me|whatsapp\s*me|wa\s*me|hit\s*me\s*up|ping\s*me|reach\s*me)\b/gi;
  if (phraseRe.test(next)) {
    next = next.replace(phraseRe, MASK);
    reasons.add('phrase');
  }

  const scanTargets = [next, normalizeForPhoneScan(next)];
  for (const target of scanTargets) {
    for (const raw of collectPhoneMatches(target)) {
      if (next.includes(raw)) {
        next = next.split(raw).join(MASK);
        reasons.add('phone');
        continue;
      }
      const compact = raw.replace(/[\s.\-()+]/g, '');
      if (compact.length < 10) {
        continue;
      }
      const windowRe = phoneWindowPattern(compact);
      if (windowRe.test(next)) {
        next = next.replace(windowRe, MASK);
        reasons.add('phone');
      }
    }
  }

  const spelled = expandSpelledDigits(next);
  if (spelled !== next) {
    for (const phone of collectPhoneMatches(spelled)) {
      next = spelled.split(phone).join(MASK);
      reasons.add('phone');
    }
  }

  return {
    text: next,
    masked: reasons.size > 0,
    reasons: [...reasons],
  };
}
