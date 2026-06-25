import * as admin from "firebase-admin";
import * as path from "path";

const DRY_RUN = true;

const serviceAccount = require(path.resolve(__dirname, "../thegymeye-app-bhuvan-firebase-adminsdk-fbsvc-b929b4dbf6.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

interface MigrationResult {
  email: string;
  oldId: string;
  newId: string;
  status: "success" | "skipped" | "failed";
  reason?: string;
}

async function migrate() {
  console.log(`\n🔄 AuthUsers Migration ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}\n`);

  const snapshot = await db.collection("authUsers").get();
  console.log(`Found ${snapshot.size} documents in authUsers\n`);

  const results: MigrationResult[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const oldId = docSnap.id;
    const email = data.email as string;

    if (!email) {
      results.push({ email: "(missing)", oldId, newId: "", status: "failed", reason: "No email field" });
      console.log(`❌ FAILED: doc ${oldId} — no email field`);
      continue;
    }

    let firebaseUid: string;
    try {
      const userRecord = await auth.getUserByEmail(email);
      firebaseUid = userRecord.uid;
    } catch (err: any) {
      results.push({ email, oldId, newId: "", status: "failed", reason: `Auth lookup failed: ${err.message}` });
      console.log(`❌ FAILED: ${email} | old ID: ${oldId} — user not found in Firebase Auth`);
      continue;
    }

    if (oldId === firebaseUid) {
      results.push({ email, oldId, newId: firebaseUid, status: "skipped", reason: "Already migrated" });
      console.log(`⏭️  SKIPPED: ${email} | doc ID already matches UID ${firebaseUid}`);
      continue;
    }

    const newDocRef = db.collection("authUsers").doc(firebaseUid);
    const existingDoc = await newDocRef.get();

    if (existingDoc.exists) {
      results.push({ email, oldId, newId: firebaseUid, status: "skipped", reason: "Target doc already exists" });
      console.log(`⏭️  SKIPPED: ${email} | target doc ${firebaseUid} already exists`);
      continue;
    }

    if (DRY_RUN) {
      results.push({ email, oldId, newId: firebaseUid, status: "success" });
      console.log(`🟡 WOULD MIGRATE: ${email} | old ID: ${oldId} → new ID: ${firebaseUid}`);
      continue;
    }

    try {
      const newData = { ...data, uid: firebaseUid };
      await newDocRef.set(newData);
      await db.collection("authUsers").doc(oldId).delete();
      results.push({ email, oldId, newId: firebaseUid, status: "success" });
      console.log(`✅ Migrated: ${email} | old ID: ${oldId} → new ID: ${firebaseUid}`);
    } catch (err: any) {
      results.push({ email, oldId, newId: firebaseUid, status: "failed", reason: err.message });
      console.log(`❌ FAILED: ${email} | old ID: ${oldId} — ${err.message}`);
    }
  }

  const succeeded = results.filter((r) => r.status === "success").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\n${"=".repeat(50)}`);
  console.log(`📊 Migration Summary ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  console.log(`${"=".repeat(50)}`);
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Succeeded:    ${succeeded}`);
  console.log(`⏭️  Skipped:      ${skipped}`);
  console.log(`❌ Failed:        ${failed}`);

  if (failed > 0) {
    console.log(`\nFailed details:`);
    results
      .filter((r) => r.status === "failed")
      .forEach((r) => console.log(`  - ${r.email} (${r.oldId}): ${r.reason}`));
  }

  console.log();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration crashed:", err);
  process.exit(1);
});
