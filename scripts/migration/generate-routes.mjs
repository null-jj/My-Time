import fs from "node:fs";
import path from "node:path";
const routes = [
  [
    "dashboard",
    "import { getDashboardData } from '../server-data';\nimport { DashboardPage } from '../pages/dashboard';",
    "loader: () => getDashboardData(),",
    "<DashboardPage data={data()} />",
  ],
  [
    "dtr",
    "import { getDtrData } from '../server-data';\nimport { DTRContent } from '@/components/dtr/dtr-content';",
    "loader: () => getDtrData(),",
    "<DTRContent initialActiveEntry={data().activeEntry} initialTodayEntries={data().todayEntries} initialIsClockedIn={data().isClockedIn} />",
  ],
  [
    "tracker",
    "import { getTrackerData } from '../server-data';\nimport { TrackerClient } from '@/components/tracker/tracker-client';",
    "loader: () => getTrackerData(),",
    "<TrackerClient records={data().records} userName={data().userName} />",
  ],
  [
    "admin",
    "import { getAdminData } from '../server-data';\nimport { AdminPage } from '../pages/admin';",
    "loader: () => getAdminData(),",
    "<AdminPage data={data()} />",
  ],
  ...["calendar", "tokens", "welcome", "themes"].map((page) => [
    page,
    `import FeaturePage from '../pages/${page}';\nimport { getSession } from '../server-data';`,
    "beforeLoad: () => getSession(),",
    "<FeaturePage />",
  ]),
  [
    "dtr.adjustments",
    "import { DtrAdjustmentsContent } from '@/components/dtr/dtr-adjustments-content';\nimport { getSession } from '../server-data';",
    "beforeLoad: () => getSession(),",
    "<DtrAdjustmentsContent />",
  ],
];
for (const [name, imports, options, element] of routes) {
  fs.writeFileSync(
    `src/routes/${name}.tsx`,
    `import { createFileRoute } from '@tanstack/solid-router';\n${imports}\nexport const Route = createFileRoute('/${name.replaceAll(".", "/")}')({\n  ${options}\n  component: Page,\n});\nfunction Page() { ${options.startsWith("loader:") ? "const data = Route.useLoaderData();" : ""} return ${element}; }\n`,
  );
}
const handlerNames = [
  "GET",
  "POST",
  "PATCH",
  "PUT",
  "DELETE",
  "OPTIONS",
  "HEAD",
];
for (const [name, url] of [
  ["api/$", "/api/$"],
  ...["dtr", "calendar", "tracker", "admin"].map((name) => [
    `${name}.api`,
    `/${name}/api`,
  ]),
]) {
  const filename = `src/routes/${name}.ts`;
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(
    filename,
    `import { createFileRoute } from '@tanstack/solid-router';\nimport { dispatchApiRequest } from '@/server/api';\nexport const Route = createFileRoute('${url}')({\n  server: { handlers: {\n${handlerNames.map((method) => `    ${method}: ({ request }) => dispatchApiRequest(request),`).join("\n")}\n  } },\n});\n`,
  );
}
console.log(
  "Generated page routes and Fetch API route adapters with existing URL paths.",
);
