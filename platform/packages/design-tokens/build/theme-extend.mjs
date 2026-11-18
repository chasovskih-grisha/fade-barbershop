// ── Tailwind/NativeWind theme ────────────────────────────────────────────────
// Одне джерело: tokens.json → theme.extend, який споживають і Tailwind (web/admin),
// і NativeWind (mobile). Імена утиліт навмисно прагматичні (surface/line/fg/accent),
// щоб уникнути `text-text-primary`; мапу задокументовано в README пакета.

export const buildThemeJson = (tokens) => {
  const color = (group, key) => {
    const entry = tokens.color[group][key];
    return entry && typeof entry === 'object' ? entry.value : entry;
  };

  const themeExtend = {
    text: {
      caption: color('text', 'caption'),
      body: color('text', 'body'),
      bodyLg: color('text', 'bodyLg'),
      h4: color('text', 'h4'),
      h3: color('text', 'h3'),
      h2: color('text', 'h2'),
      h1: color('text', 'h1'),
      display: color('text', 'display'),
      textCaption: color('text', 'textCaption'),
      textBodyS: color('text', 'textBodyS'),
      textBodyXs: color('text', 'textBodyXs'),
      textH5: color('text', 'textH5'),
      textH6: color('text', 'textH6'),
      danger: color('text', 'danger'),
      dangerHover: color('text', 'dangerHover'),
      dangerText: color('text', 'dangerText'),
      dangerHoverText: color('text', 'dangerHoverText'),
      textFg: color('text', 'textFg'),
      textFgSecondary: color('text', 'textFgSecondary'),
      textFgMuted: color('text', 'textFgMuted'),
    },
    colors: {
      surface: {
        base: color('surface', 'base'),
        raised: color('surface', 'raised'),
        sunken: color('surface', 'sunken'),
      },
      line: {
        DEFAULT: color('border', 'default'),
        strong: color('border', 'strong'),
      },
      fg: {
        DEFAULT: color('text', 'primary'),
        secondary: color('text', 'secondary'),
        muted: color('text', 'muted'),
      },
      accent: {
        DEFAULT: color('accent', 'solid'),
        fg: color('accent', 'onSolid'),
        blue: color('accent', 'blue'),
      },
      interactive: {
        DEFAULT: color('interactive', 'default'),
        hover: color('interactive', 'hover'),
        active: color('interactive', 'active'),
      },
      semantic: {
        success: color('semantic', 'success'),
        warning: color('semantic', 'warning'),
        danger: color('semantic', 'danger'),
        info: color('semantic', 'info'),
      },
      paper: color('lightTheme', 'paper'),
      ink: color('lightTheme', 'ink'),
    },
    colors: {
      surface: {
        base: color('surface', 'base'),
        raised: color('surface', 'raised'),
        sunken: color('surface', 'sunken'),
      },
      line: {
        DEFAULT: color('border', 'default'),
        strong: color('border', 'strong'),
      },
      fg: {
        DEFAULT: color('text', 'primary'),
        secondary: color('text', 'secondary'),
        muted: color('text', 'muted'),
      },
      accent: {
        DEFAULT: color('accent', 'solid'),
        fg: color('accent', 'onSolid'),
        blue: color('accent', 'blue'),
      },
      interactive: {
        DEFAULT: color('interactive', 'default'),
        hover: color('interactive', 'hover'),
        active: color('interactive', 'active'),
      },
      semantic: {
        success: color('semantic', 'success'),
        warning: color('semantic', 'warning'),
        danger: color('semantic', 'danger'),
        info: color('semantic', 'info'),
      },
      paper: color('lightTheme', 'paper'),
      ink: color('lightTheme', 'ink'),
      border: color('border', 'default'),
      'border-strong': color('border', 'strong'),
    },
    borderRadius: {
      input: `${tokens.radius.input.value}px`,
      card: `${tokens.radius.card.value}px`,
      pill: `${tokens.radius.pill.value}px`,
      micro: `${tokens.radius.micro.value}px`,
      md: `${tokens.radius.radiusMd.value}px`,
      lg: `${tokens.radius.radiusLg.value}px`,
      full: `${tokens.radius.radiusFull.value}px`,
      t: `${tokens.radius.radiusT.value}px`,
    },
    // Контейнер контенту з tokens.grid.web.container (design-system.md §Сітка):
    // утиліта `max-w-container` — єдиний спосіб дістатися ширини контейнера з коду екрана.
    maxWidth: {
      container: `${tokens.grid.web.container}px`,
      app: `${tokens.grid.web.maxApp.value}px`,
      hero: `${tokens.grid.web.maxHero.value}px`,
      lg: `${tokens.grid.web.maxLg.value}px`,
      md: `${tokens.grid.web.maxMd.value}px`,
      sm: `${tokens.grid.web.maxSm.value}px`,
      xs: `${tokens.grid.web.maxXs.value}px`,
      xl: `${tokens.grid.web.maxXl.value}px`,
      '2xl': `${tokens.grid.web.max2xl.value}px`,
      '3xl': `${tokens.grid.web.max3xl.value}px`,
      '4xl': `${tokens.grid.web.max4xl.value}px`,
      '5xl': `${tokens.grid.web.max5xl.value}px`,
      '7xl': `${tokens.grid.web.max7xl.value}px`,
    },
    fontFamily: {
      display: ['Fixel Display', 'system-ui', 'sans-serif'],
      text: ['Fixel Text', 'system-ui', 'sans-serif'],
    },
    fontSize: Object.fromEntries(
      Object.entries(tokens.typography.fontSize).flatMap(([key, tok]) => {
        if (typeof tok === 'object' && tok.value != null) {
          const entry = { value: `${tok.value}px`, lineHeight: 1.2 };
          if (key === 'textBodyS' || key === 'textBodyXs') {
            return [
              [key, entry],
              [key.replace(/([A-Z])/g, '-$1').toLowerCase(), entry],
            ];
          }
          // Прив'язка токена до кількох форм класу, що є у коді: display → text-display,
          // h3 → text-h3, h4 → text-h4 — щоб не ламати існуючий код екранів під час переходу на систему.
          if (key === 'display')
            return [
              ['display', entry],
              ['text-display', entry],
            ];
          if (key === 'h3')
            return [
              ['h3', entry],
              ['text-h3', entry],
            ];
          if (key === 'h4')
            return [
              ['h4', entry],
              ['text-h4', entry],
            ];
          if (key === 'h2')
            return [
              ['h2', entry],
              ['text-h2', entry],
            ];
          if (key === 'h1')
            return [
              ['h1', entry],
              ['text-h1', entry],
            ];
          if (key === 'body')
            return [
              ['body', entry],
              ['text-body', entry],
            ];
          if (key === 'caption')
            return [
              ['caption', entry],
              ['text-caption', entry],
            ];
          if (key === 'textCaption')
            return [
              ['textCaption', entry],
              ['text-caption', entry],
            ];
          return [[key, entry]];
        }
        // compat: numeric token (back-compat screens) -> flat px value required by Tailwind fontSize scale
        const n = Number(tok);
        if (!Number.isNaN(n)) {
          return [[key, { value: `${n}px`, lineHeight: 1.2 }]];
        }
        return [[key, tok]];
      })
    ),
    lineHeight: {
      snug: `${tokens.typography.lineHeight.min}`,
      normal: `${tokens.typography.lineHeight.max}`,
      tight: `${tokens.typography.lineHeight.tight.value}`,
    },
    letterSpacing: {
      tight: 0,
      wider: '0.05em',
    },
  };

  return JSON.stringify(themeExtend, null, 2);
};
