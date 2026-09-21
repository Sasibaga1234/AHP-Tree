# AHP Decision Tool (Analytic Hierarchy Process Web App)

An interactive, pure frontend web application for multi-criteria decision making based on the **Analytic Hierarchy Process (AHP)** proposed by Thomas L. Saaty.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue 3](https://img.shields.io/badge/vue-3.5-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.7-blue.svg)
![Vite](https://img.shields.io/badge/vite-6.1-purple.svg)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-3.4-38bdf8.svg)

## 🌟 Key Features

- 🌲 **Top-Down Visual Hierarchy Canvas**: Interactive top-down tree visualization with dynamic curved connectors for criteria and sub-criteria nodes.
- ⚖️ **Dual Comparison Modes**:
  - **Mode A (1–9 Saaty Scale)**: Dual-direction interactive rating bar.
  - **Mode B (Reciprocal Matrix)**: Direct editable matrix table with automatic reciprocal calculation ($a_{ji} = 1 / a_{ij}$).
- 🧮 **Decoupled Pure TypeScript Math Engine**:
  - Geometric Mean (Root Method) eigenvector weight vector calculation.
  - $\lambda_{max}$, Consistency Index ($CI$), and Consistency Ratio ($CR$) calculation using standard Saaty Random Index ($RI$) table.
  - Real-time logical consistency ratio warnings ($CR > 0.10$).
- 🌐 **Modular i18n Multi-Language Support**: English (Default), Russian (Русский), and Chinese (简体中文).
- 💾 **Model Persistence & Export**: Full JSON export & import capability.

---

## 🛠️ Project Architecture

```text
ahp-decision-tool/
├── src/
│   ├── ahp/                # Pure TypeScript AHP Engine (Math, Consistency, Synthesis)
│   │   ├── matrix.ts       # Matrix builder & cell parser
│   │   ├── priority.ts     # Eigenvector priority vector calculator
│   │   ├── consistency.ts  # LambdaMax, CI, CR, Saaty RI table
│   │   └── ahp.ts          # Multi-level synthesis & ranking
│   │
│   ├── components/         # Vue 3 UI Components
│   │   ├── VisualTreeCanvas.vue  # Top-down visual tree editor
│   │   ├── ComparisonScale.vue   # Saaty 1-9 scale component
│   │   ├── ComparisonMatrix.vue  # Reciprocal matrix editor
│   │   └── ResultView.vue        # Results, rankings & CR diagnostic
│   │
│   ├── locales/            # Modular i18n Translations (EN, RU, ZH)
│   │   ├── en.ts
│   │   ├── ru.ts
│   │   └── zh.ts
│   │
│   ├── i18n/               # Reactive i18n Manager
│   └── App.vue             # Main Application Layout
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- `npm` or `pnpm`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ahp-decision-tool.git

# Change directory
cd ahp-decision-tool

# Install dependencies
npm install
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Unit Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
```

---

## 📄 License

[MIT](LICENSE)
