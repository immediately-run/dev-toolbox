export interface RegexRecipe {
  name: string;
  pattern: string;
  flags: string;
  sample: string;
}

export const REGEX_RECIPES: RegexRecipe[] = [
  { name: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', flags: 'g', sample: 'Contact ada@example.com or grace.h+dev@mail.co.uk today.' },
  { name: 'URL', pattern: 'https?://[^\\s/$.?#].[^\\s]*', flags: 'gi', sample: 'Docs: https://immediately.run/docs and http://example.org/a?b=1' },
  { name: 'IPv4', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', flags: 'g', sample: 'Hosts 10.0.0.1, 192.168.1.254 and 999.1.1.1 (invalid).' },
  { name: 'ISO date', pattern: '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])', flags: 'g', sample: 'Released 2026-08-27, patched 2026-09-03.' },
  { name: 'Hex color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'g', sample: 'Use #f49ad4 for pink and #fff for white.' },
  { name: 'Hashtag', pattern: '#\\w+', flags: 'g', sample: 'Shipping #devtools today #buildinpublic' },
  { name: 'Whitespace runs', pattern: '\\s{2,}', flags: 'g', sample: 'too   many    spaces\there' },
  { name: 'Trailing whitespace', pattern: '[ \\t]+$', flags: 'gm', sample: 'line one   \nline two\t\nline three' },
  { name: 'Duplicate words', pattern: '\\b(\\w+)\\s+\\1\\b', flags: 'gi', sample: 'This is is a test test of the the regex.' },
  { name: 'Numbers (int/float)', pattern: '-?\\d+(?:\\.\\d+)?', flags: 'g', sample: 'Temps: -3.5, 12, 0.25 and 100.' },
  { name: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', flags: 'gi', sample: 'id=3f2504e0-4f89-41d3-9a0c-0305e82c3301' },
  { name: 'Semver', pattern: '\\b(\\d+)\\.(\\d+)\\.(\\d+)(?:-([0-9A-Za-z.-]+))?\\b', flags: 'g', sample: 'sdk 0.54.0, cli 1.2.3-beta.1' },
  { name: 'Quoted strings', pattern: '"(?:[^"\\\\]|\\\\.)*"', flags: 'g', sample: 'say "hello", then "esc\\"aped"' },
  { name: 'HTML tags', pattern: '<\\/?[a-z][^>]*>', flags: 'gi', sample: '<p class="x">Hi <b>there</b></p>' },
];

export const REGEX_TOKENS: [string, string][] = [
  ['.', 'any char except newline'],
  ['\\d \\w \\s', 'digit, word char, whitespace (uppercase negates)'],
  ['[abc] [^abc]', 'character class / negated'],
  ['^ $', 'start / end of line (with m flag)'],
  ['\\b', 'word boundary'],
  ['* + ?', '0+, 1+, 0 or 1 (add ? for lazy)'],
  ['{n} {n,} {n,m}', 'exact / at-least / range count'],
  ['(x) (?:x)', 'capturing / non-capturing group'],
  ['(?<name>x)', 'named group'],
  ['\\1  $1  $<name>', 'backreference / replacement refs'],
  ['(?=x) (?!x)', 'lookahead / negative lookahead'],
  ['(?<=x) (?<!x)', 'lookbehind / negative lookbehind'],
  ['a|b', 'alternation'],
  ['flags', 'g all, i case, m multiline, s dotAll, u unicode, y sticky'],
];
