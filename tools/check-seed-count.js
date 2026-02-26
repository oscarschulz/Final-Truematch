const admin = require("firebase-admin");
const sa = require("../firebase-service-account.json");

if (sa.private_key && sa.private_key.includes("\\n")) {
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

admin
  .firestore()
  .collection("seedProfiles")
  .get()
  .then((snap) => {
    console.log("seedProfiles docs:", snap.size);
    process.exit(0);
  })
  .catch((err) => {
    console.error("count error:", err && err.message ? err.message : err);
    process.exit(1);
  });