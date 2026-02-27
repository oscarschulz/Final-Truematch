/**
 * tools/generate-and-import-seed-men.js
 *
 * Generates 500 men seed profiles (Western + Spain neighbors) and imports them into Firestore.
 *
 * Run in the SAME terminal tab if your server is NOT running there.
 * If your server is running in that tab, open a NEW terminal tab/window.
 *
 * Usage:
 *   node tools/generate-and-import-seed-men.js
 * Optional:
 *   --count 500
 *   --collection seedProfiles
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
const COUNT = Math.max(1, Number(getArg("count", "500")));
const COLLECTION = getArg("collection", "seedProfiles");
const ROOT = path.resolve(__dirname, "..");

// Load .env if present
try {
  const envPath = path.join(ROOT, ".env");
  if (fs.existsSync(envPath)) require("dotenv").config({ path: envPath });
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
  const p = path.join(ROOT, "firebase-service-account.json");
  if (!fs.existsSync(p)) {
    console.error("❌ Missing firebase-service-account.json in project root");
    process.exit(1);
  }
  const obj = require(p);
  if (obj.private_key && obj.private_key.includes("\\n")) obj.private_key = obj.private_key.replace(/\\n/g, "\n");
  return obj;
}

function weightedChoice(items) {
  let r = Math.random();
  let cum = 0;
  for (const [val, w] of items) {
    cum += w;
    if (r <= cum) return val;
  }
  return items[items.length - 1][0];
}

function triangular(min, max, mode) {
  const u = Math.random();
  const c = (mode - min) / (max - min);
  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

const countries = [
  ["Spain", 0.22], ["Portugal", 0.07], ["France", 0.10], ["Italy", 0.08],
  ["United Kingdom", 0.08], ["Ireland", 0.03], ["Germany", 0.08], ["Netherlands", 0.05],
  ["Belgium", 0.03], ["Switzerland", 0.03], ["Austria", 0.02], ["Denmark", 0.02],
  ["Sweden", 0.02], ["Norway", 0.01], ["Finland", 0.01], ["United States", 0.08],
  ["Canada", 0.04], ["Australia", 0.02], ["New Zealand", 0.01],
];
// normalize weights
const totalW = countries.reduce((a, x) => a + x[1], 0);
for (const c of countries) c[1] = c[1] / totalW;

const cities = {
  "Spain": ["Madrid","Barcelona","Valencia","Sevilla","Málaga","Bilbao","Zaragoza","Granada","Palma","Alicante"],
  "Portugal": ["Lisboa","Porto","Braga","Coimbra","Faro","Aveiro","Évora","Guimarães","Setúbal","Viseu"],
  "France": ["Paris","Lyon","Marseille","Toulouse","Nice","Nantes","Bordeaux","Lille","Strasbourg","Montpellier"],
  "Italy": ["Milano","Roma","Torino","Bologna","Firenze","Napoli","Venezia","Verona","Genova","Palermo"],
  "United Kingdom": ["London","Manchester","Birmingham","Leeds","Bristol","Edinburgh","Glasgow","Liverpool","Cardiff","Brighton"],
  "Ireland": ["Dublin","Cork","Galway","Limerick","Waterford","Kilkenny","Sligo","Wexford","Drogheda","Athlone"],
  "Germany": ["Berlin","Hamburg","München","Köln","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dresden","Bremen"],
  "Netherlands": ["Amsterdam","Rotterdam","Utrecht","Den Haag","Eindhoven","Groningen","Maastricht","Leiden","Tilburg","Haarlem"],
  "Belgium": ["Brussels","Antwerp","Ghent","Bruges","Leuven","Liège","Namur","Mechelen","Mons","Ostend"],
  "Switzerland": ["Zürich","Geneva","Basel","Bern","Lausanne","Lucerne","Lugano","St. Gallen","Winterthur","Fribourg"],
  "Austria": ["Wien","Salzburg","Graz","Innsbruck","Linz","Klagenfurt","Bregenz","Villach","Wels","St. Pölten"],
  "Denmark": ["Copenhagen","Aarhus","Odense","Aalborg","Esbjerg","Randers","Kolding","Vejle","Roskilde","Helsingør"],
  "Sweden": ["Stockholm","Gothenburg","Malmö","Uppsala","Västerås","Örebro","Linköping","Helsingborg","Jönköping","Lund"],
  "Norway": ["Oslo","Bergen","Trondheim","Stavanger","Kristiansand","Tromsø","Drammen","Ålesund","Bodø","Fredrikstad"],
  "Finland": ["Helsinki","Espoo","Tampere","Turku","Oulu","Jyväskylä","Kuopio","Lahti","Vaasa","Rovaniemi"],
  "United States": ["New York","Los Angeles","Chicago","Austin","Seattle","Miami","Boston","San Diego","Denver","Portland"],
  "Canada": ["Toronto","Vancouver","Montreal","Calgary","Ottawa","Edmonton","Quebec City","Winnipeg","Halifax","Victoria"],
  "Australia": ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Hobart","Newcastle","Darwin"],
  "New Zealand": ["Auckland","Wellington","Christchurch","Queenstown","Dunedin","Hamilton","Tauranga","Nelson","Rotorua","Napier"],
};

const namePools = {
  "Spain": { first: ["Hugo","Mateo","Leo","Daniel","Alejandro","Pablo","Álvaro","Adrián","Mario","Diego","Lucas","Bruno","Enzo","Sergio","Iker"], last: ["García","Martínez","López","Sánchez","Pérez","Gómez","Fernández","Ruiz","Díaz","Moreno","Muñoz","Álvarez","Romero","Alonso","Navarro"], langs: ["es","en"] },
  "Portugal": { first: ["João","Tiago","Francisco","Afonso","Duarte","Diogo","Miguel","Rafael","Guilherme","Pedro","Tomás","Gonçalo","André","Rodrigo","Bruno"], last: ["Silva","Santos","Ferreira","Pereira","Oliveira","Costa","Rodrigues","Martins","Gomes","Lopes","Sousa","Ribeiro","Alves","Pinto","Carvalho"], langs: ["pt","en"] },
  "France": { first: ["Gabriel","Louis","Jules","Arthur","Raphaël","Hugo","Lucas","Léo","Ethan","Paul","Antoine","Nicolas","Maxime","Mathis","Nathan"], last: ["Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau","Simon","Laurent","Michel","Garcia","Fournier"], langs: ["fr","en"] },
  "Italy": { first: ["Luca","Marco","Matteo","Leonardo","Francesco","Alessandro","Giovanni","Gabriele","Riccardo","Antonio","Federico","Simone","Davide","Niccolò","Stefano"], last: ["Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco","Bruno","Gallo","Conti","De Luca","Mancini"], langs: ["it","en"] },
  "United Kingdom": { first: ["Jack","Noah","Oliver","Harry","George","Leo","Charlie","Jacob","Thomas","Oscar","James","William","Henry","Alfie","Joshua"], last: ["Smith","Jones","Taylor","Brown","Williams","Wilson","Johnson","Davies","Patel","Wright","Walker","Thompson","Roberts","Hall","Lewis"], langs: ["en"] },
  "Ireland": { first: ["Conor","Cian","Fionn","Oisín","Ronan","Darragh","Cathal","Seán","Aidan","Niall","Eoin","Declan","Shane","Cormac","Liam"], last: ["Murphy","Kelly","O'Brien","Walsh","Ryan","Byrne","O'Connor","O'Neill","Reilly","Doyle","McCarthy","Gallagher","Doherty","Kennedy","Lynch"], langs: ["en"] },
  "Germany": { first: ["Noah","Leon","Paul","Finn","Elias","Ben","Luca","Jonas","Felix","Moritz","Maximilian","Tim","David","Jan","Erik"], last: ["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Schäfer","Koch","Bauer","Richter","Klein"], langs: ["de","en"] },
  "Netherlands": { first: ["Daan","Sem","Lucas","Milan","Finn","Noah","Jesse","Levi","Thijs","Bram","Julian","Max","Sam","Stijn","Tom"], last: ["de Jong","Jansen","de Vries","van den Berg","van Dijk","Bakker","Visser","Smit","Meijer","de Boer","Mulder","Jacobs","de Groot","Bos","Vos"], langs: ["nl","en"] },
  "Belgium": { first: ["Liam","Noah","Arthur","Louis","Lucas","Milan","Jules","Victor","Felix","Thomas","Oscar","Maxime","Elias","Mathis","Nicolas"], last: ["Peeters","Janssens","Maes","Jacobs","Mertens","Willems","Claes","Goossens","Wouters","De Smet","Dubois","Lambert","Simon","Dupont","Leroy"], langs: ["nl","fr","en"] },
  "Switzerland": { first: ["Noah","Luca","Leon","Elias","Louis","Finn","Julian","David","Simon","Matteo","Max","Jonas","Nico","Raphael","Samuel"], last: ["Meier","Müller","Schmid","Keller","Weber","Frei","Huber","Steiner","Brunner","Baumann","Morel","Rossi","Schneider","Moser","Dubois"], langs: ["de","fr","it","en"] },
  "Austria": { first: ["Paul","Leon","Lukas","Noah","Felix","Maximilian","David","Julian","Jakob","Jonas","Moritz","Simon","Tobias","Florian","Matteo"], last: ["Gruber","Huber","Bauer","Wagner","Müller","Pichler","Steiner","Moser","Hofer","Leitner","Fuchs","Fischer","Schmid","Schneider","Maier"], langs: ["de","en"] },
  "Denmark": { first: ["William","Noah","Elias","Oliver","Lucas","Leo","Emil","Oskar","Hugo","Axel","Liam","Mikkel","Filip","Sander","Matias"], last: ["Andersen","Jensen","Nielsen","Hansen","Larsen","Berg","Lund","Dahl"], langs: ["da","en"] },
  "Sweden": { first: ["William","Noah","Elias","Oliver","Lucas","Leo","Emil","Oskar","Hugo","Axel","Liam","Filip","Sander","Matias"], last: ["Johansson","Andersson","Karlsson","Svensson","Berg","Lund","Dahl"], langs: ["sv","en"] },
  "Norway": { first: ["William","Noah","Elias","Oliver","Lucas","Leo","Emil","Oskar","Hugo","Axel","Liam","Sander","Matias"], last: ["Hansen","Johansen","Olsen","Larsen","Andersen","Berg","Lund"], langs: ["no","en"] },
  "Finland": { first: ["Noah","Elias","Oliver","Lucas","Leo","Emil","Oskar","Hugo","Axel","Liam"], last: ["Korhonen","Virtanen","Mäkinen","Nieminen","Mäkelä","Hämäläinen","Laine"], langs: ["fi","en"] },
  "United States": { first: ["Liam","Noah","Oliver","Elijah","James","William","Benjamin","Lucas","Henry","Jack","Levi","Alexander","Daniel","Mateo"], last: ["Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Martinez","Hernandez","Lopez","Wilson","Anderson","Thomas"], langs: ["en"] },
  "Canada": { first: ["Liam","Noah","Oliver","Benjamin","Lucas","Ethan","James","William","Henry","Jack","Leo","Alexander","Daniel","Owen"], last: ["Smith","Brown","Tremblay","Martin","Roy","Wilson","MacDonald","Gagnon","Johnson","Lee","Taylor"], langs: ["en","fr"] },
  "Australia": { first: ["Jack","Noah","Oliver","William","Henry","Leo","Charlie","Thomas","James","Lucas","Cooper","Ethan","Oscar"], last: ["Smith","Jones","Williams","Brown","Wilson","Taylor","Johnson","White","Martin","Anderson"], langs: ["en"] },
  "New Zealand": { first: ["Jack","Noah","Oliver","Liam","Lucas","William","Leo","James","Henry","Charlie","Ethan","Oscar","Finn"], last: ["Smith","Williams","Brown","Taylor","Jones","Wilson","Thompson","Anderson","Martin","Lee"], langs: ["en"] },
};

const jobs = [
  "Software Engineer","Product Manager","Account Executive","Photographer","Fitness Coach","Architect",
  "Chef","Financial Analyst","Marketing Specialist","UX Designer","Data Analyst","Sales Manager",
  "Doctor","Teacher","Entrepreneur","Consultant","Engineer","Civil Engineer",
  "Barista","Airline Pilot","Real Estate Agent","Video Editor","Music Producer","Startup Founder"
];

const interests = ["gym","football","coffee","travel","live music","running","hiking","cinema","photography","cooking","tech","books","road trips","beach days","museums","design","podcasts","tennis","basketball","languages","street food","mountains","gaming","volunteering"];

const bioTemplates = [
  "Low-key driven. Big on {a} and {b}.",
  "Weekend plans: {a}, {b}, and trying new spots.",
  "Here for good vibes and real conversations. {a} + {b}.",
  "City explorer — {a}, {b}, and a good playlist.",
  "If you like {a}, we’ll get along. Bonus for {b}.",
  "Working hard, living soft. {a} & {b} are my reset."
];

function sample(arr, k) {
  const copy = arr.slice();
  const out = [];
  while (out.length < k && copy.length) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function pad4(n) {
  return String(n).padStart(4, "0");
}

async function main() {
  if (!admin.apps.length) {
    const sa = loadServiceAccount();
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }

  const createdAtMs = Date.UTC(2026, 1, 26, 0, 0, 0); // 2026-02-26
  const profiles = [];
  const usedNames = new Set();

  for (let i = 1; i <= COUNT; i++) {
    const country = weightedChoice(countries);
    const city = (cities[country] && cities[country].length) ? cities[country][Math.floor(Math.random() * cities[country].length)] : "Global";

    const pool = namePools[country] || namePools["United States"];
    const first = pool.first[Math.floor(Math.random() * pool.first.length)];
    const last = pool.last[Math.floor(Math.random() * pool.last.length)];
    let name = `${first} ${last}`;
    if (usedNames.has(name)) {
      const mid = String.fromCharCode(65 + (i % 26));
      name = `${first} ${mid}. ${last}`;
    }
    usedNames.add(name);

    const age = Math.round(triangular(18, 40, 28));
    const ints = sample(interests, 2 + Math.floor(Math.random() * 3)); // 2-4
    const jobTitle = jobs[Math.floor(Math.random() * jobs.length)];
    const a = ints[0], b = ints[1];
    const bio = bioTemplates[Math.floor(Math.random() * bioTemplates.length)].replace("{a}", a).replace("{b}", b);

    const id = `seed_m_${pad4(i)}`;

    // Note: leave photoUrl empty for now to avoid 404 spam until you upload men images
    // Later you can update it to: /seed/men/man_0001.jpg ... and serve images from public/seed/men/
    profiles.push({
      id,
      gender: "men",
      name,
      age,
      country,
      city,
      jobTitle,
      languages: pool.langs.length > 1 ? sample(pool.langs, 1 + Math.floor(Math.random() * Math.min(2, pool.langs.length))) : pool.langs,
      interests: ints,
      bio,
      photoKey: `man_${pad4(i)}.jpg`,
      photoUrl: "",

      isSeed: true,
      seedLabel: "Sample profile (Beta)",
      createdAtMs,
      updatedAtMs: Date.now(),
    });
  }

  // Write files (backup)
  const jsonOut = path.join(ROOT, `seed_men_profiles_${COUNT}.json`);
  const csvOut = path.join(ROOT, `seed_men_profiles_${COUNT}.csv`);
  fs.writeFileSync(jsonOut, JSON.stringify(profiles, null, 2), "utf8");

  const header = ["id","gender","name","age","country","city","jobTitle","languages","interests","bio","photoKey","photoUrl","isSeed","seedLabel","createdAtMs","updatedAtMs"];
  const lines = [header.join(",")];
  for (const p of profiles) {
    const row = {
      ...p,
      languages: Array.isArray(p.languages) ? p.languages.join("|") : String(p.languages || ""),
      interests: Array.isArray(p.interests) ? p.interests.join("|") : String(p.interests || ""),
    };
    lines.push(header.map(k => {
      const v = row[k] === undefined || row[k] === null ? "" : String(row[k]);
      // basic CSV escaping
      const esc = v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
      return esc;
    }).join(","));
  }
  fs.writeFileSync(csvOut, lines.join("\n"), "utf8");

  console.log("✅ Generated:", profiles.length);
  console.log("   JSON:", jsonOut);
  console.log("   CSV:", csvOut);

  console.log(`✅ Ready to import into Firestore collection "${COLLECTION}"`);
  if (DRY_RUN) {
    console.log("🟡 DRY RUN mode: no writes will happen.");
    return;
  }

  const db = admin.firestore();
  const col = db.collection(COLLECTION);

  const BATCH_SIZE = 450;
  let written = 0;
  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const chunk = profiles.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const p of chunk) batch.set(col.doc(p.id), p, { merge: true });
    await batch.commit();
    written += chunk.length;
    console.log(`✅ Imported ${written}/${profiles.length}`);
  }

  console.log("🎉 Done.");
}

main().catch(err => {
  console.error("❌ Failed:", err && err.message ? err.message : err);
  process.exit(1);
});