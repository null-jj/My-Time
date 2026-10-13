import fs from "node:fs";
import path from "node:path";
const names = new Set();
function scan(dir) {
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, file.name);
    if (file.isDirectory()) scan(full);
    else if (file.name.endsWith(".tsx")) {
      const text = fs.readFileSync(full, "utf8");
      for (const match of text.matchAll(
        /import\s*\{([^}]+)\}\s*from\s*['"](?:lucide-react|@\/components\/icons)['"]/gs,
      )) {
        for (const name of match[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean))
          names.add(name);
      }
    }
  }
}
scan("components");
scan("src");
if (process.argv[2]) scan(process.argv[2]);
const sorted = [...names].sort();
fs.writeFileSync(
  "components/icons.tsx",
  `import type { JSX } from '@solidjs/web';
import { Dynamic } from '@solidjs/web';
import { ${sorted.map((n) => `${n} as ${n}Node`).join(", ")} } from 'lucide';
import type { IconNode } from 'lucide';

type IconProps = JSX.SvgSVGAttributes<SVGSVGElement>;
function icon(nodes: IconNode) {
  return (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" {...props}>
      {nodes.map(([tag, attributes]) => <Dynamic component={tag} {...attributes} />)}
    </svg>
  );
}
${sorted.map((n) => `export const ${n} = icon(${n}Node);`).join("\n")}
`,
);
console.log(
  `Generated ${sorted.length} Solid icon components from Lucide's framework-independent icon nodes.`,
);
