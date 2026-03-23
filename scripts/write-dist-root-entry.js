/**
 * Nest compila para dist/src/main.js. Gera dist/main.js que reexporta,
 * para `node dist/main` / `node dist/main.js` funcionarem.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const target = path.join(distDir, 'main.js');
const nestEntry = path.join(distDir, 'src', 'main.js');

if (!fs.existsSync(nestEntry)) {
  console.error(
    '[write-dist-root-entry] Falta dist/src/main.js. Rode `nest build` antes.',
  );
  process.exit(1);
}

fs.writeFileSync(
  target,
  "// Gerado por scripts/write-dist-root-entry.js — não editar\nrequire('./src/main.js');\n",
);
console.log('[write-dist-root-entry] OK:', target);
