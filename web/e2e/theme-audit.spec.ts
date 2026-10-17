import { test, expect, type Page } from '@playwright/test';

const DEMO_EMAIL = 'demo@pletenie.local';
const DEMO_PASSWORD = 'demo12345';

const THEMES = ['dark', 'light'] as const;
type Theme = (typeof THEMES)[number];

const PAGES: { name: string; path: string; heading: RegExp }[] = [
  { name: 'spaces', path: '/', heading: /Пространства/ },
  { name: 'calendar', path: '/calendar', heading: /Сводный календарь/ },
  { name: 'tokens', path: '/tokens', heading: /Токены/ },
  { name: 'members', path: '/members', heading: /Участники/ },
  { name: 'history', path: '/history', heading: /История/ },
  { name: 'settings', path: '/settings', heading: /Настройки/ },
  { name: 'profile', path: '/profile', heading: /Профиль/ },
];

type Violation = {
  text: string;
  ratio: number;
  color: string;
  bg: string;
  size: number;
  bold: boolean;
  tag: string;
};

async function applyTheme(page: Page, theme: Theme) {
  await page.addInitScript((value: string) => {
    localStorage.setItem(
      'pletenie.theme',
      JSON.stringify({ state: { theme: value }, version: 0 }),
    );
  }, theme);
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Пароль').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(
    page.getByRole('heading', { name: 'Пространства' }),
  ).toBeVisible();
}

function auditScript(): Violation[] {
  type RGBA = [number, number, number, number];
  const parse = (value: string): RGBA => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return [0, 0, 0, 0];
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  };
  const over = (top: RGBA, bottom: RGBA): RGBA => {
    const a = top[3];
    return [
      top[0] * a + bottom[0] * (1 - a),
      top[1] * a + bottom[1] * (1 - a),
      top[2] * a + bottom[2] * (1 - a),
      1,
    ];
  };
  const luminance = (c: RGBA): number => {
    const ch = [c[0], c[1], c[2]].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const ratio = (a: RGBA, b: RGBA): number => {
    const l1 = luminance(a);
    const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const effectiveBg = (el: Element): RGBA => {
    const stack: RGBA[] = [];
    let node: Element | null = el;
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c[3] > 0) {
        stack.push(c);
        if (c[3] >= 1) break;
      }
      node = node.parentElement;
    }
    let result: RGBA = [255, 255, 255, 1];
    for (let i = stack.length - 1; i >= 0; i--) {
      result = over(stack[i], result);
    }
    return result;
  };

  const violations: Violation[] = [];
  const seen = new Set<Element>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const text = (current.textContent ?? '').trim();
    const el = current.parentElement;
    if (text && el && !seen.has(el)) {
      seen.add(el);
      const cs = getComputedStyle(el);
      const visible =
        el.getClientRects().length > 0 &&
        cs.visibility !== 'hidden' &&
        parseFloat(cs.opacity) > 0.05 &&
        (el as HTMLElement).offsetWidth > 1 &&
        (el as HTMLElement).offsetHeight > 1;
      if (visible) {
        const size = parseFloat(cs.fontSize);
        const weight = parseInt(cs.fontWeight, 10) || 400;
        const bold = weight >= 700;
        const large = size >= 24 || (size >= 18.66 && bold);
        const min = large ? 3 : 4.5;
        const color = parse(cs.color);
        const bg = effectiveBg(el);
        const r = color[3] > 0 ? ratio(color, bg) : 1;
        if (r < min) {
          violations.push({
            text: text.slice(0, 40),
            ratio: Math.round(r * 100) / 100,
            color: cs.color,
            bg: `rgb(${bg[0] | 0}, ${bg[1] | 0}, ${bg[2] | 0})`,
            size,
            bold,
            tag: el.tagName.toLowerCase(),
          });
        }
      }
    }
    current = walker.nextNode();
  }
  return violations;
}

test.describe('Плетение · контраст текста (WCAG AA)', () => {
  for (const theme of THEMES) {
    for (const target of PAGES) {
      test(`${target.name} (${theme})`, async ({ page }) => {
        await applyTheme(page, theme);
        await login(page);
        if (target.path !== '/') {
          await page.goto(target.path);
        }
        await expect(
          page.getByRole('heading', { name: target.heading }).first(),
        ).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        const violations = await page.evaluate(auditScript);
        const severe = violations.filter((v) => v.ratio < 3);
        if (violations.length) {
          const worst = violations
            .map(
              (v) =>
                `  ${v.ratio}:1  ${v.color} on ${v.bg}  <${v.tag}>  "${v.text}"`,
            )
            .join('\n');
          console.log(
            `\n[${theme}/${target.name}] нарушений < AA: ${violations.length} (из них < 3:1 — ${severe.length})\n${worst}`,
          );
        }
        expect(
          severe,
          `Критический контраст (<3:1) в теме ${theme} на экране ${target.name}:\n` +
            severe.map((v) => `  ${v.ratio}:1  <${v.tag}> "${v.text}"`).join('\n'),
        ).toEqual([]);
      });
    }
  }
});
