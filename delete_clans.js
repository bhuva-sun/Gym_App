import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./thegymeye-app-bhuvan-firebase-adminsdk-fbsvc-b929b4dbf6.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteClans() {
  const clansSnap = await db.collection("clans").get();
  const batch = db.batch();
  let count = 0;
  
  clansSnap.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Successfully deleted ${count} clans.`);
  } else {
    console.log('No clans found to delete.');
  }
  process.exit(0);
}

deleteClans().catch(console.error);
