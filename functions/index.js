const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const corsHandler = cors({ origin: true });

admin.initializeApp();
const db = admin.firestore();

exports.receiveSchedule = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'POST') {
      const events = req.body;

      if (!Array.isArray(events)) {
        return res.status(400).send('Invalid schedule format');
      }

      try {
        const ref = db.collection('tvSchedule');
        const old = await ref.get();
        const batch = db.batch();

        old.forEach(doc => batch.delete(doc.ref)); // Optional: clear old

        events.forEach(event => {
          const docRef = ref.doc();
          batch.set(docRef, event);
        });

        await batch.commit();
        console.log('✅ Saved to Firestore:', events.length);
        res.status(200).send('Schedule saved to Firestore');
      } catch (err) {
        console.error('❌ Firestore error:', err);
        res.status(500).send('Failed to save schedule');
      }
    } else if (req.method === 'GET') {
      try {
        const snapshot = await db.collection('tvSchedule').get();
        const result = snapshot.docs.map(doc => doc.data());
        res.status(200).json(result);
      } catch (err) {
        console.error('❌ Failed to load schedule:', err);
        res.status(500).send('Failed to load schedule');
      }
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});