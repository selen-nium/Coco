import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const value = argv[index + 1];
    args[key] = value;
    index += 1;
  }
  return args;
}

async function main() {
  const repoRoot = process.cwd();
  loadEnvFile(path.join(repoRoot, ".env.local"));
  loadEnvFile(path.join(repoRoot, ".env"));

  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const baseUrl =
    args["base-url"] ||
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
    );
  }

  if (!baseUrl) {
    throw new Error(
      "Missing base URL. Pass --base-url https://call-coco.vercel.app or set APP_BASE_URL."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: flows, error } = await supabase
    .from("ingested_flows")
    .select("id, name")
    .is("embedding", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!flows || flows.length === 0) {
    console.log("No flows with NULL embeddings found.");
    return;
  }

  console.log(`Found ${flows.length} flows with NULL embeddings.`);

  for (const flow of flows) {
    console.log(`Embedding flow ${flow.id} (${flow.name})...`);

    const response = await fetch(
      new URL("/api/intelligence/embed-flow", baseUrl),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ flow_id: flow.id }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed embedding flow ${flow.id}: ${response.status} ${body}`
      );
    }
  }

  console.log("Finished backfilling flow embeddings.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
