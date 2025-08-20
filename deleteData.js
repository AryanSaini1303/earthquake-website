import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://realtime-data-test-rym-default-rtdb.asia-southeast1.firebasedatabase.app',
});

const db = getDatabase();

const deleteParentNode = async () => {
  const refPath = 'TTGO2'; // Change to your parent node path
  try {
    await db.ref(refPath).remove();
    console.log(`🔥 Deleted parent node: /${refPath}`);
    return;
  } catch (err) {
    console.error(`❌ Failed to delete /${refPath}:`, err);
    return;
  }
};

deleteParentNode();
