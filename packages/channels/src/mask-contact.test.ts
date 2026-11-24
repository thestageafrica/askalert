import { describe, expect, it } from 'vitest';
import { maskContactDetails } from './mask-contact';

describe('maskContactDetails', () => {
  it.each([
    ['plain +234', 'Reach me on +2348012345678 thanks', 'phone'],
    ['spaced +234', 'My line is +234 801 234 5678 ok', 'phone'],
    ['dashed +234', 'Call +234-801-234-5678 please', 'phone'],
    ['local 0803', 'Use 08031234567 tonight', 'phone'],
    ['local 0701 spaced', 'Try 0701 234 5678 now', 'phone'],
    ['local 0901 dotted', 'Number 0901.234.5678 works', 'phone'],
    ['local with dashes', 'WhatsApp 0803-123-4567', 'phone'],
    ['o8o3 obfuscation', 'Hit o8o31234567 later', 'phone'],
    ['O8O3 caps', 'Line is O8O31234567', 'phone'],
    ['mixed lookalikes', 'Text O8o3-123-4567', 'phone'],
    ['spelled digits', 'zero eight zero three one two three four five six seven', 'phone'],
    ['email', 'Mail me host@example.com please', 'email'],
    ['https link', 'See https://evil.example/path now', 'link'],
    ['www link', 'Open www.leak.ng/chat', 'link'],
    ['twitter handle', 'Find me @lagoshost', 'social'],
    ['hash handle', 'Follow #VendorDM', 'social'],
    ['call me phrase', 'Just call me after five', 'phrase'],
    ['dm me phrase', 'Please DM me on IG', 'phrase'],
    ['text me phrase', 'Text me when free', 'phrase'],
    ['whatsapp me phrase', 'WhatsApp me tonight', 'phrase'],
    ['wa me phrase', 'WA me quick', 'phrase'],
    ['hit me up phrase', 'Hit me up around noon', 'phrase'],
    ['phone plus email', '08031234567 or a@b.co', 'phone'],
    ['safe booking chat', 'Is Friday still free for the shortlet?', null],
    ['price only', 'Total is 128500 naira hold 40 percent', null],
  ] as const)('%s', (_label, input, expectedReason) => {
    const result = maskContactDetails(input);
    if (expectedReason == null) {
      expect(result.masked).toBe(false);
      expect(result.text).toBe(input);
      return;
    }
    expect(result.masked).toBe(true);
    expect(result.reasons).toContain(expectedReason);
    expect(result.text).toContain('[hidden]');
    expect(result.text).not.toMatch(/0803|0701|0901|\+234|@|https?:\/\//i);
  });

  it('masks multiple phones in one message', () => {
    const result = maskContactDetails('Try 08031234567 or +2348012345678');
    expect(result.masked).toBe(true);
    expect(result.text.match(/\[hidden\]/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps non-contact digits like budgets', () => {
    const result = maskContactDetails('Budget is 250000 per night for 2 guests');
    expect(result.masked).toBe(false);
  });
});
