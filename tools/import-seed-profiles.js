/**
 * tools/import-seed-profiles.js
 *
 * Imports seed profiles into Firestore collection (default: seedProfiles).
 *
 * Run in the SAME terminal tab if your server is NOT running there.
 * If your server is running in that tab, open a NEW terminal tab/window.
 *
 * Usage:
 *   node tools/import-seed-profiles.js --file seed_women_profiles_500.json --collection seedProfiles
 * Optional:
 *   --dry-run
 */

const fs = require("fs");
const path = require("path");

function getArg(name, def) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

const DRY_RUN = process.argv.includes("--dry-run");
const INPUT_FILE = getArg("file", "seed_women_profiles_500.json");
const COLLECTION = getArg("collection", "seedProfiles");

// project root is parent of /tools
const ROOT = path.resolve(__dirname, "..");

function resolveEnvPath() {
  const candidates = [path.join(ROOT, ".env"), path.join(process.cwd(), ".env")];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

// Load .env if present
const envPath = resolveEnvPath();
if (envPath) {
  require("dotenv").config({ path: envPath });
  console.log("[env] loaded:", envPath);
} else {
  console.log("[env] no .env found (ok if creds are in firebase-service-account.json)");
}

let admin;
try {
  admin = require("firebase-admin");
} catch (e) {
  console.error("❌ firebase-admin is not installed. Run: npm i firebase-admin");
  process.exit(1);
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const obj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (obj && typeof obj.private_key === "string" && obj.private_key.includes("\\n")) {
      obj.private_key = obj.private_key.replace(/\\n/g, "\n");
    }
    return obj;
  }

  const p = path.join(ROOT, "firebase-service-account.json");
  if (!fs.existsSync(p)) {
    console.error("❌ Missing firebase-service-account.json in:", ROOT);
    process.exit(1);
  }

  const obj = require(p);
  if (obj && typeof obj.private_key === "string" && obj.private_key.includes("\\n")) {
    obj.private_key = obj.private_key.replace(/\\n/g, "\n");
  }
  return obj;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  const inPath = path.isAbsolute(INPUT_FILE) ? INPUT_FILE : path.join(ROOT, INPUT_FILE);
  if (!fs.existsSync(inPath)) {
    console.error("❌ Seed JSON file not found:", inPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(inPath, "utf8");
  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    console.error("❌ Invalid JSON:", e.message);
    process.exit(1);
  }

  if (!Array.isArray(arr) || arr.length === 0) {
    console.error("❌ JSON must be a non-empty array of profiles.");
    process.exit(1);
  }

  if (!admin.apps.length) {
    const serviceAccount = loadServiceAccount();
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const db = admin.firestore();
  const col = db.collection(COLLECTION);

  console.log(`✅ Ready to import ${arr.length} docs into collection "${COLLECTION}"`);
  console.log("   File:", inPath);
  if (DRY_RUN) console.log("🟡 DRY RUN mode: no writes will happen.");

  // Firestore batch limit = 500 writes. Keep safe margin.
  const BATCH_SIZE = 450;

  // randomize slightly so the deck feels mixed
  shuffleInPlace(arr);

  let written = 0;
  for (let i = 0; i < arr.length; i += BATCH_SIZE) {
    const chunk = arr.slice(i, i + BATCH_SIZE);

    if (DRY_RUN) {
      written += chunk.length;
      console.log(`DRY batch ${Math.floor(i / BATCH_SIZE) + 1}: +${chunk.length} (total ${written})`);
      continue;
    }

    const batch = db.batch();
    for (const p of chunk) {
      const id = String(p.id || "").trim();
      if (!id) continue;

      batch.set(col.doc(id), { ...p, isSeed: true, updatedAtMs: Date.now() }, { merge: true });
    }

    await batch.commit();
    written += chunk.length;
    console.log(`✅ Imported ${written}/${arr.length}`);
  }

  console.log("🎉 Done.");
  console.log(`Next: check Firestore → collection "${COLLECTION}" for seed_w_0001 ...`);
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});