/**
 * tools/delete-seed-users.js
 * Deletes mistakenly-imported seed docs from Firestore "users" collection.
 *
 * Usage:
 *   node tools/delete-seed-users.js --prefix seed_m_
 *
 * If your server is running in the terminal tab, open a NEW tab/window.
 */

const fs = require("fs");
const path = require("path");

function getArg(name, def) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

const PREFIX = getArg("prefix", "seed_m_");

// Try to load .env from common places (similar spirit to your importer)
try {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(__dirname, ".env"),
    path.join(__dirname, "..", "backend", ".env"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      require("dotenv").config({ path: p });
      break;
    }
  }
} catch {}

let admin;
try {
  admin = require("firebase-admin");
} catch (e) {
  console.error("❌ firebase-admin missing. Run: npm i firebase-admin");
  process.exit(1);
}

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const obj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (obj.private_key && obj.private_key.includes("\\n")) obj.private_key = obj.private_key.replace(/\\n/g, "\n");
    return obj;
  }

  const candidates = [
    path.join(__dirname, "firebase-service-account.json"),
    path.join(__dirname, "..", "firebase-service-account.json"),
    path.join(__dirname, "..", "backend", "firebase-service-account.json"),
    path.join(process.cwd(), "firebase-service-account.json"),
    path.join(process.cwd(), "backend", "firebase-service-account.json"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const obj = require(p);
      if (obj.private_key && obj.private_key.includes("\\n")) obj.private_key = obj.private_key.replace(/\\n/g, "\n");
      return obj;
    }
  }

  console.error("❌ Missing firebase-service-account.json (or set FIREBASE_SERVICE_ACCOUNT in .env)");
  process.exit(1);
}

async function main() {
  if (!admin.apps.length) {
    const sa = loadServiceAccount();
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }

  const db = admin.firestore();
  const col = db.collection("users");

  console.log(`🔎 Scanning users collection for doc IDs starting with "${PREFIX}"...`);

  const snap = await col.limit(5000).get();
  const toDelete = snap.docs
    .map(d => d.id)
    .filter(id => String(id).startsWith(PREFIX));

  console.log(`🧹 Found ${toDelete.length} docs to delete.`);

  const BATCH = 450;
  let deleted = 0;

  for (let i = 0; i < toDelete.length; i += BATCH) {
    const chunk = toDelete.slice(i, i + BATCH);
    const batch = db.batch();
    for (const id of chunk) batch.delete(col.doc(id));
    await batch.commit();
    deleted += chunk.length;
    console.log(`✅ Deleted ${deleted}/${toDelete.length}`);
  }

  console.log("🎉 Done.");
}

main().catch(err => {
  console.error("❌ Failed:", err && err.message ? err.message : err);
  process.exit(1);
});