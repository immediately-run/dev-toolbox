// A curated Unicode set with searchable names. Kept small on purpose — the
// point is quick copy, not a full UCD.
export interface CharEntry {
  ch: string;
  name: string;
}
export interface CharGroup {
  id: string;
  name: string;
  chars: CharEntry[];
}

// No trim(): several entries ARE whitespace (nbsp, thin space) and trim would eat them.
const G = (s: string): CharEntry[] =>
  s
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => {
      const sp = l.indexOf(' ');
      return { ch: l.slice(0, sp), name: l.slice(sp + 1) };
    });

export const CHAR_GROUPS: CharGroup[] = [
  {
    id: 'arrows',
    name: 'Arrows',
    chars: G(`
← leftwards arrow
→ rightwards arrow
↑ upwards arrow
↓ downwards arrow
↔ left right arrow
↕ up down arrow
↖ north west arrow
↗ north east arrow
↘ south east arrow
↙ south west arrow
⇐ leftwards double arrow
⇒ rightwards double arrow
⇑ upwards double arrow
⇓ downwards double arrow
⇔ left right double arrow
↩ leftwards arrow with hook
↪ rightwards arrow with hook
↰ upwards arrow with tip leftwards
↱ upwards arrow with tip rightwards
↵ downwards arrow with corner leftwards (return)
⟵ long leftwards arrow
⟶ long rightwards arrow
⟷ long left right arrow
➔ heavy wide-headed rightwards arrow
➜ heavy round-tipped rightwards arrow
➤ black rightwards arrowhead
⬅ leftwards black arrow
⬆ upwards black arrow
⬇ downwards black arrow
⇄ rightwards arrow over leftwards arrow
⇅ upwards arrow leftwards of downwards arrow
↻ clockwise open circle arrow
↺ anticlockwise open circle arrow
⤴ arrow pointing rightwards then curving upwards
⤵ arrow pointing rightwards then curving downwards
`),
  },
  {
    id: 'math',
    name: 'Math',
    chars: G(`
± plus-minus sign
∓ minus-or-plus sign
× multiplication sign
÷ division sign
∙ bullet operator
√ square root
∛ cube root
∞ infinity
≈ almost equal to
≠ not equal to
≡ identical to
≤ less-than or equal to
≥ greater-than or equal to
≪ much less-than
≫ much greater-than
∑ n-ary summation
∏ n-ary product
∫ integral
∂ partial differential
∇ nabla
∆ increment
∈ element of
∉ not an element of
∋ contains as member
∅ empty set
∩ intersection
∪ union
⊂ subset of
⊃ superset of
⊆ subset of or equal to
⊇ superset of or equal to
∀ for all
∃ there exists
∄ there does not exist
∧ logical and
∨ logical or
¬ not sign
⊕ circled plus
⊗ circled times
⊥ up tack (perpendicular)
∥ parallel to
∠ angle
° degree sign
′ prime
″ double prime
‰ per mille sign
µ micro sign
ℏ planck constant over two pi
ℵ alef symbol
ℝ double-struck capital r
ℕ double-struck capital n
ℤ double-struck capital z
ℚ double-struck capital q
ℂ double-struck capital c
∴ therefore
∵ because
∝ proportional to
⌈ left ceiling
⌉ right ceiling
⌊ left floor
⌋ right floor
`),
  },
  {
    id: 'box',
    name: 'Box drawing',
    chars: G(`
─ box drawings light horizontal
━ box drawings heavy horizontal
│ box drawings light vertical
┃ box drawings heavy vertical
┌ box drawings light down and right
┐ box drawings light down and left
└ box drawings light up and right
┘ box drawings light up and left
├ box drawings light vertical and right
┤ box drawings light vertical and left
┬ box drawings light down and horizontal
┴ box drawings light up and horizontal
┼ box drawings light vertical and horizontal
┏ box drawings heavy down and right
┓ box drawings heavy down and left
┗ box drawings heavy up and right
┛ box drawings heavy up and left
┣ box drawings heavy vertical and right
┫ box drawings heavy vertical and left
┳ box drawings heavy down and horizontal
┻ box drawings heavy up and horizontal
╋ box drawings heavy vertical and horizontal
═ box drawings double horizontal
║ box drawings double vertical
╔ box drawings double down and right
╗ box drawings double down and left
╚ box drawings double up and right
╝ box drawings double up and left
╠ box drawings double vertical and right
╣ box drawings double vertical and left
╦ box drawings double down and horizontal
╩ box drawings double up and horizontal
╬ box drawings double vertical and horizontal
╭ box drawings light arc down and right
╮ box drawings light arc down and left
╰ box drawings light arc up and right
╯ box drawings light arc up and left
╌ box drawings light double dash horizontal
╎ box drawings light double dash vertical
┄ box drawings light triple dash horizontal
┆ box drawings light triple dash vertical
▀ upper half block
▄ lower half block
█ full block
▌ left half block
▐ right half block
░ light shade
▒ medium shade
▓ dark shade
■ black square
□ white square
▪ black small square
▫ white small square
▲ black up-pointing triangle
▼ black down-pointing triangle
◀ black left-pointing triangle
▶ black right-pointing triangle
● black circle
○ white circle
◆ black diamond
◇ white diamond
`),
  },
  {
    id: 'currency',
    name: 'Currency',
    chars: G(`
$ dollar sign
¢ cent sign
£ pound sign
¤ currency sign
¥ yen sign
€ euro sign
₹ indian rupee sign
₽ ruble sign
₩ won sign
₪ new sheqel sign
₫ dong sign
₴ hryvnia sign
₦ naira sign
₱ peso sign
฿ thai baht
₺ turkish lira sign
₿ bitcoin sign
₣ french franc sign
₤ lira sign
₡ colon sign
₮ tugrik sign
₭ kip sign
₲ guarani sign
₵ cedi sign
`),
  },
  {
    id: 'greek',
    name: 'Greek',
    chars: G(`
α alpha
β beta
γ gamma
δ delta
ε epsilon
ζ zeta
η eta
θ theta
ι iota
κ kappa
λ lambda
μ mu
ν nu
ξ xi
ο omicron
π pi
ρ rho
σ sigma
ς final sigma
τ tau
υ upsilon
φ phi
χ chi
ψ psi
ω omega
Α capital alpha
Β capital beta
Γ capital gamma
Δ capital delta
Ε capital epsilon
Ζ capital zeta
Η capital eta
Θ capital theta
Ι capital iota
Κ capital kappa
Λ capital lambda
Μ capital mu
Ν capital nu
Ξ capital xi
Ο capital omicron
Π capital pi
Ρ capital rho
Σ capital sigma
Τ capital tau
Υ capital upsilon
Φ capital phi
Χ capital chi
Ψ capital psi
Ω capital omega
`),
  },
  {
    id: 'typography',
    name: 'Typography',
    chars: G(`
– en dash
— em dash
… horizontal ellipsis
‘ left single quotation mark
’ right single quotation mark
“ left double quotation mark
” right double quotation mark
‚ single low-9 quotation mark
„ double low-9 quotation mark
« left-pointing double angle quotation mark
» right-pointing double angle quotation mark
• bullet
· middle dot
† dagger
‡ double dagger
§ section sign
¶ pilcrow sign
© copyright sign
® registered sign
™ trade mark sign
℠ service mark
№ numero sign
¡ inverted exclamation mark
¿ inverted question mark
\u00a0 non-breaking space
\u200b zero width space
\u200c zero width non-joiner
\u200d zero width joiner
\u2009 thin space
\u200a hair space
\u2003 em space
\u2002 en space
\ufeff zero width no-break space (BOM)
✓ check mark
✔ heavy check mark
✕ multiplication x
✗ ballot x
★ black star
☆ white star
☀ black sun with rays
☾ last quarter moon
♥ black heart suit
♦ black diamond suit
♠ black spade suit
♣ black club suit
⌘ place of interest sign (command)
⌥ option key
⇧ upwards white arrow (shift)
⌃ up arrowhead (control)
⌫ erase to the left (backspace)
⏎ return symbol
⎋ broken circle with northwest arrow (escape)
`),
  },
];

export function codePointLabel(ch: string): string {
  return Array.from(ch, (c) => 'U+' + (c.codePointAt(0) as number).toString(16).toUpperCase().padStart(4, '0')).join(' ');
}
