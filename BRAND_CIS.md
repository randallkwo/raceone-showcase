# RaceOne.ai 品牌識別系統 (CIS)

> 版本: 1.0 | 建立: 2026-08-03

---

## 1. Brand Identity

- **Brand Name**: RaceOne.ai
- **Slogan**: FIRST TO FINISH
- **Chinese Slogan**: 率先完賽，零失誤，可複製
- **Core Theme**: RACE DAY. PERFECTLY EXECUTED.
- **Keywords**: Pacesetter, Precision, Automation, Reliable, Minimalist, Speed

## 2. Design Tokens

```json
{
  "colors": {
    "primary":     { "hex": "#0066FF", "name": "Race Blue",    "usage": "科技/信任/主色/按鈕" },
    "secondary":   { "hex": "#00D4AA", "name": "Finish Green", "usage": "完成/數據/強調色" },
    "accent":      { "hex": "#FF3B30", "name": "Alert Red",    "usage": "異常/即時/關鍵警示" },
    "dark":        { "hex": "#0A0E17", "name": "Deep Space",   "usage": "開發者模式/文字" },
    "light":       { "hex": "#F8FAFC", "name": "Clean White",  "usage": "消費者模式/背景" }
  },
  "typography": {
    "sans":        ["Inter Variable", "sans-serif"],
    "tc":          ["Noto Sans TC", "sans-serif"],
    "mono":        ["JetBrains Mono", "Tabular Figures", "monospace"]
  }
}
```

## 3. Logo System

### Full Logo (`logo-full.svg`)
```
┌──────────────────────────────┐
│  ┌──┐                        │
│  │R1│  RaceOne.ai             │
│  └──┘  FIRST TO FINISH        │
│        ────────────────────── │
└──────────────────────────────┘
```
- **Left**: R1 icon badge (blue rounded rect, 18px/40px radius)
- **Top Right**: "RaceOne" Deep Space (800 weight), "." Finish Green, "ai" Deep Space
- **Bottom Right**: "FIRST TO FINISH" Race Blue (JetBrains Mono, letter-spacing 4)
- **Divider**: Thin Race Blue line

### R1 Icon (`logo-icon.svg`)
- Blue gradient rounded square (40px radius)
- White "R1" text (900 weight, centered)
- Use for: Favicon, App Icon, collapsed sidebar

## 4. Color Palette

| Name | Hex | Preview | Usage |
|------|:----:|:------:|-------|
| Race Blue | #0066FF | 🟦 | Primary actions, brand identity, buttons |
| Finish Green | #00D4AA | 🟩 | Success, completion, data accents |
| Alert Red | #FF3B30 | 🟥 | Errors, alerts, critical timing |
| Deep Space | #0A0E17 | ⬛ | Text, dark mode, developer tools |
| Clean White | #F8FAFC | ⬜ | Backgrounds, card surfaces |

## 5. Typography

| Language | Font | Usage |
|----------|------|-------|
| English | **Inter Variable** | Headings, UI labels, body text |
| Chinese | **Noto Sans TC** | Chinese content, labels, descriptions |
| Code | **JetBrains Mono** | Timing data, scoreboards, code blocks |
| Numbers | **Tabular Figures** | `91:23:45.678` — monospaced digits for alignment |

## 6. UI Application Rules

- **Primary CTAs**: Race Blue (`#0066FF`) + white text, full rounded
- **Status/Completion**: Finish Green (`#00D4AA`) for finished/success
- **Errors/Alerts**: Alert Red (`#FF3B30`) for DNF, DNS, errors
- **Timing Data**: JetBrains Mono with Tabular Figures for all time/score displays
- **Chinese Content**: Noto Sans TC for all Traditional Chinese text
- **Theme**: Clean White (`#F8FAFC`) default, Deep Space (`#0A0E17`) dark mode