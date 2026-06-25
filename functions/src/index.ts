import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

admin.initializeApp();

const db = admin.firestore();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export const joinClan = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to join a clan.");
  }

  const uid = request.auth.uid;
  const inviteCode = request.data?.inviteCode;

  if (!inviteCode || typeof inviteCode !== "string" || inviteCode.trim().length !== 6) {
    throw new HttpsError("invalid-argument", "A valid 6-character invite code is required.");
  }

  const normalizedCode = inviteCode.trim().toUpperCase();
  const now = Date.now();
  const rateLimitRef = db.collection("rateLimits").doc(uid);

  const rateLimitDoc = await rateLimitRef.get();

  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data()!;
    const windowStart = data.windowStart as number;
    const attempts = data.attempts as number;

    if (now - windowStart < WINDOW_MS) {
      if (attempts >= MAX_ATTEMPTS) {
        throw new HttpsError(
          "resource-exhausted",
          "Too many attempts. Please wait 10 minutes before trying again."
        );
      }
      await rateLimitRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
    } else {
      await rateLimitRef.set({ windowStart: now, attempts: 1 });
    }
  } else {
    await rateLimitRef.set({ windowStart: now, attempts: 1 });
  }

  const clansSnapshot = await db
    .collection("clans")
    .where("inviteCode", "==", normalizedCode)
    .limit(1)
    .get();

  if (clansSnapshot.empty) {
    throw new HttpsError("not-found", "Invalid invite code. No clan found.");
  }

  const clanDoc = clansSnapshot.docs[0];
  const clanData = clanDoc.data();

  const authUserRef = db.collection("authUsers").doc(uid);
  const authUserDoc = await authUserRef.get();

  if (authUserDoc.exists) {
    const existingClanId = authUserDoc.data()?.clanId;
    if (existingClanId) {
      throw new HttpsError("already-exists", "You are already a member of a clan.");
    }
    await authUserRef.update({
      clanId: clanDoc.id,
      role: "member",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await authUserRef.set({
      email: request.auth.token.email || "",
      clanId: clanDoc.id,
      role: "member",
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {
    clanId: clanDoc.id,
    name: clanData.name,
    ownerId: clanData.ownerId,
    ownerEmail: clanData.ownerEmail,
    inviteCode: clanData.inviteCode,
    createdAt: clanData.createdAt,
    updatedAt: clanData.updatedAt,
  };
});
