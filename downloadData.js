import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { readFileSync, writeFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://iitr-base-default-rtdb.asia-southeast1.firebasedatabase.app',
});

const db = getDatabase();

const exportData = async () => {
  const date = '2025-07-02'; // 🔁 change this to the desired date
  const fileName = `${date}_backup.json`;

  let totalData = [];

  try {
    for (let i = 0; i < 24; i++) {
      const hour = i < 10 ? `0${i}` : `${i}`;
      const refPath = `EQ/${date}/${hour}`;

      const snapshot = await db.ref(refPath).once('value');
      const data = snapshot.val();

      if (data) {
        totalData.push({ [hour]: data });
      }
    }

    if (totalData.length === 0) {
      console.log(`⚠️ No data found for /EQ/${date}`);
      return;
    }

    writeFileSync(`./${fileName}`, JSON.stringify(totalData, null, 2));
    console.log(`✅ Data exported successfully to ${fileName}`);
  } catch (err) {
    console.error(`❌ Failed to export data:`, err);
  }
};

exportData();
