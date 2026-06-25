import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./thegymeye-app-bhuvan-firebase-adminsdk-fbsvc-b929b4dbf6.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fetchClans() {
  const clansSnap = await db.collection("clans").get();
  console.log("Clans in Database:");
  clansSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- Clan Name: ${data.name} | Invite Code: ${data.inviteCode}`);
  });
  process.exit(0);
}

fetchClans().catch(console.error);
