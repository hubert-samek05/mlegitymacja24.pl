// Zwalnia slot certyfikatu dystrybucyjnego przez App Store Connect API.
// Uniewaznia certyfikat uzywany WYLACZNIE przez profile pl.rezerwacja24.app
// (lub nieuzywany w ogole). Nie rusza certow powiazanych z innymi aplikacjami.
import crypto from 'node:crypto';

const ISS = process.env.APP_STORE_CONNECT_ISSUER_ID;
const KID = process.env.APP_STORE_CONNECT_KEY_IDENTIFIER;
const PK = process.env.APP_STORE_CONNECT_PRIVATE_KEY;
const TARGET_BUNDLE = 'pl.rezerwacja24.app';

if (!ISS || !KID || !PK) {
  console.log('Brak zmiennych App Store Connect — pomijam (integracja niepodpieta)');
  process.exit(0);
}

function jwt() {
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KID, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const p = Buffer.from(JSON.stringify({ iss: ISS, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const data = `${h}.${p}`;
  const sig = crypto.sign('sha256', Buffer.from(data), { key: PK, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${data}.${sig}`;
}

async function api(path, method = 'GET') {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt()}` },
  });
  if (method === 'DELETE') return res.status;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  return body;
}

const certs = await api('/v1/certificates?filter[certificateType]=DISTRIBUTION,IOS_DISTRIBUTION&limit=200');
console.log(`Certyfikaty dystrybucyjne: ${certs.data.length}`);
if (certs.data.length < 3) {
  console.log('Wolny slot — nic do zwalniania.');
  process.exit(0);
}

const profs = await api('/v1/profiles?include=bundleId,certificates&limit=200');
const bundleById = {};
const certMeta = {};
for (const inc of profs.included ?? []) {
  if (inc.type === 'bundleIds') bundleById[inc.id] = inc.attributes.identifier;
  if (inc.type === 'certificates') certMeta[inc.id] = inc;
}

// mapowanie: certId -> [{profileName, bundleId, state}]
const usage = {};
for (const c of certs.data) usage[c.id] = [];
for (const p of profs.data) {
  const bidRel = p.relationships?.bundleId?.data?.id;
  const bundle = bundleById[bidRel] ?? '?';
  const entry = { name: p.attributes.name, bundle, state: p.attributes.profileState };
  for (const c of p.relationships?.certificates?.data ?? []) {
    if (usage[c.id]) usage[c.id].push(entry);
  }
}

const isLive = (e) => e.bundle !== TARGET_BUNDLE && e.state === 'ACTIVE';
const protectedCerts = new Set();
const candidates = new Set();
for (const [certId, list] of Object.entries(usage)) {
  const live = list.filter(isLive);
  const onlyTarget = list.length > 0 && list.every((e) => e.bundle === TARGET_BUNDLE);
  if (live.length === 0 && (onlyTarget || list.every((e) => e.bundle === TARGET_BUNDLE || e.state !== 'ACTIVE'))) {
    candidates.add(certId);
  } else {
    protectedCerts.add(certId);
  }
}

for (const [certId, list] of Object.entries(usage)) {
  console.log(`cert ${certId}:`, JSON.stringify(list));
}

let candidate = [...candidates].find((id) => !protectedCerts.has(id));
if (!candidate) {
  candidate = Object.keys(usage).find((id) => usage[id].length === 0 && !protectedCerts.has(id));
}
if (!candidate) {
  console.log('UWAGA: wszystkie 3 certyfikaty sa powiazane z profilami innych appek.');
  console.log('Nie uniewazniam niczego automatycznie — wymagana decyzja reczna.');
  process.exit(1);
}

const meta = certMeta[candidate];
console.log(`Uniewazniam certyfikat ${candidate} (uzywany tylko przez ${TARGET_BUNDLE} lub nieuzywany, serial ${meta?.attributes?.serialNumber ?? '?'})`);
const status = await api(`/v1/certificates/${candidate}`, 'DELETE');
if (status === 204) {
  console.log('Certyfikat uniewazniony — slot zwolniony.');
} else {
  console.log(`DELETE zwrocil ${status} — kontynuuje, fetch-signing-files zweryfikuje.`);
}
