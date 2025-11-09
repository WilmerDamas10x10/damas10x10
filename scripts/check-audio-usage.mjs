// scripts/check-audio-usage.mjs
// Auditoría de uso de audio: busca new Audio, .play(, AudioContext, <audio>, e imports de sfx.
// Ejecuta desde la raíz del repo: `node scripts/check-audio-usage.mjs`

import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");

// Qué extensiones escanear
const CODE_EXTS = new Set([".js", ".mjs", ".cjs", ".ts", ".jsx", ".tsx", ".html"]);

// Patrones a buscar
const PATTERNS = [
  { key: "NEW_AUDIO",     re: /new\s+Audio\s*\(/ },
  { key: "DOT_PLAY",      re: /\.play\s*\(/ },
  { key: "AUDIO_CTX",     re: /\bAudioContext\b|\bwebkitAudioContext\b/ },
  { key: "HTML_AUDIO",    re: /<audio\b/i },
  { key: "SFX_IMPORTS",   re: /from\s+['"][^'"]*\/sound\/sfx(\.js)?['"]/ },
];

// Reporte acumulado
const report = {
  scannedFiles: 0,
  findings: {
    NEW_AUDIO: [],
    DOT_PLAY: [],
    AUDIO_CTX: [],
    HTML_AUDIO: [],
    SFX_IMPORTS: [],
  },
};

// Recorrido recursivo
function walk(dir) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }

  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // ignora node_modules, dist, build
      const base = ent.name.toLowerCase();
      if (["node_modules", "dist", "build", ".git"].includes(base)) continue;
      walk(p);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (!CODE_EXTS.has(ext)) continue;
      scanFile(p);
    }
  }
}

function scanFile(filePath) {
  let text = "";
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch { return; }

  report.scannedFiles++;

  for (const { key, re } of PATTERNS) {
    if (!re.test(text)) continue;

    // Guardar coincidencias con número de línea
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (re.test(line)) {
        report.findings[key].push({
          file: path.relative(ROOT, filePath),
          line: idx + 1,
          snippet: line.trim().slice(0, 140),
        });
      }
    });
  }
}

function printFindings() {
  console.log("=== Audio Usage Audit ===");
  console.log(`Raíz: ${ROOT}`);
  console.log(`Escaneado: ${report.scannedFiles} archivo(s)\n`);

  const sections = [
    { key: "NEW_AUDIO",  title: "⚠️ new Audio(...)" },
    { key: "DOT_PLAY",   title: "⚠️ .play(" },
    { key: "AUDIO_CTX",  title: "ℹ️  AudioContext/webkitAudioContext" },
    { key: "HTML_AUDIO", title: "⚠️ <audio> en HTML/plantillas" },
    { key: "SFX_IMPORTS",title: "ℹ️  Imports que apuntan a /sound/sfx" },
  ];

  let problems = 0;

  for (const { key, title } of sections) {
    const arr = report.findings[key];
    const isProblem = (key === "NEW_AUDIO" || key === "DOT_PLAY" || key === "HTML_AUDIO");
    if (arr.length === 0) {
      console.log(`${title}: OK (0)\n`);
      continue;
    }

    if (isProblem) problems += arr.length;

    console.log(`${title}: ${arr.length}`);
    arr.forEach((f) => {
      console.log(`  - ${f.file}:${f.line}  ${f.snippet}`);
    });
    console.log("");
  }

  if (problems === 0) {
    console.log("✅ Sin usos prohibidos detectados. Solo revisa 'AUDIO_CTX' y 'SFX_IMPORTS' para mantener la arquitectura limpia.");
    process.exitCode = 0;
  } else {
    console.log(`❌ Se detectaron ${problems} uso(s) a corregir (new Audio, .play o <audio>).`);
    process.exitCode = 2;
  }
}

(function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`No encuentro la carpeta src en: ${SRC_DIR}`);
    process.exit(1);
  }
  walk(SRC_DIR);
  printFindings();
})();
