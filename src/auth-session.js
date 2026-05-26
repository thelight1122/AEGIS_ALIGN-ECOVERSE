import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { getAegisAuth, getAegisFirestore } from "./firebase-app.js";

const DEFAULT_NOTIFICATIONS = {
  securityAlerts: true,
  protocolAnalytics: false,
  emailSummary: true,
};

function titleCase(value) {
  return String(value || "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function subscriptionLabel(value) {
  const normalized = String(value || "explorer").trim().toLowerCase();
  if (normalized === "subscriber") return "Subscriber";
  if (normalized === "enterprise") return "Enterprise";
  if (normalized === "custodian") return "Custodian";
  return "Explorer";
}

export function sanitizeProfileInput(input = {}) {
  return {
    fullName: String(input.fullName || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    company: String(input.company || "").trim(),
    rememberDevice: Boolean(input.rememberDevice),
  };
}

export function buildUserProfile(user, input = {}) {
  const cleaned = sanitizeProfileInput(input);
  const displayName = cleaned.fullName || user?.displayName || titleCase(String(user?.email || "").split("@")[0]) || "AEGIS Peer";

  return {
    uid: user.uid,
    email: cleaned.email || user.email || "",
    displayName,
    company: cleaned.company || "",
    photoURL: user.photoURL || "",
    role: input.role || "peer",
    accountStatus: "active",
    subscriptionTier: input.subscriptionTier || "explorer",
    onboardingStage: input.onboardingStage || "active",
    createdAt: input.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    settings: {
      notifications: {
        ...DEFAULT_NOTIFICATIONS,
        ...(input.settings?.notifications || {}),
      },
      apiKeys: Array.isArray(input.settings?.apiKeys) ? input.settings.apiKeys : [],
    },
  };
}

export function buildNexusStateFromSession(session = {}) {
  const user = session.user || null;
  const profile = session.profile || {};
  const displayName = profile.displayName || user?.displayName || titleCase(String(user?.email || "").split("@")[0]) || "Authenticated Peer";

  return {
    peerLabel: displayName,
    signedIn: Boolean(user),
    subscription: subscriptionLabel(profile.subscriptionTier),
    onboardingStage: profile.onboardingStage || (user ? "active" : "public"),
    profile: {
      fullName: displayName,
      email: profile.email || user?.email || "",
      company: profile.company || "",
      rememberDevice: Boolean(session.rememberDevice),
      security2fa: Boolean(profile.security2fa),
    },
    settings: {
      notifications: {
        ...DEFAULT_NOTIFICATIONS,
        ...(profile.settings?.notifications || {}),
      },
      apiKeys: Array.isArray(profile.settings?.apiKeys) ? profile.settings.apiKeys : [],
    },
  };
}

async function readUserProfile(user) {
  if (!user?.uid) return null;
  const snap = await getDoc(doc(getAegisFirestore(), "users", user.uid));
  return snap.exists() ? snap.data() : null;
}

async function sessionFromUser(user, rememberDevice = false) {
  if (!user) return { user: null, profile: null, nexusState: buildNexusStateFromSession({ user: null }) };
  const profile = await readUserProfile(user);
  return {
    user,
    profile,
    nexusState: buildNexusStateFromSession({ user, profile, rememberDevice }),
  };
}

export function observeAuthSession(callback) {
  const auth = getAegisAuth();
  return onAuthStateChanged(auth, async (user) => {
    callback(await sessionFromUser(user));
  });
}

export async function signUpWithEmail({ fullName, email, company, password, rememberDevice = true }) {
  const cleaned = sanitizeProfileInput({ fullName, email, company, rememberDevice });
  const auth = getAegisAuth();
  await setPersistence(auth, rememberDevice ? browserLocalPersistence : browserSessionPersistence);
  const credential = await createUserWithEmailAndPassword(auth, cleaned.email, password);
  await updateProfile(credential.user, { displayName: cleaned.fullName });

  const profile = buildUserProfile(
    {
      uid: credential.user.uid,
      email: credential.user.email || cleaned.email,
      displayName: cleaned.fullName,
      photoURL: credential.user.photoURL || "",
    },
    { ...cleaned, onboardingStage: "active" },
  );
  await setDoc(doc(getAegisFirestore(), "users", credential.user.uid), profile, { merge: true });

  return {
    user: credential.user,
    profile,
    nexusState: buildNexusStateFromSession({ user: credential.user, profile, rememberDevice }),
  };
}

export async function signInWithEmail({ email, password, rememberDevice = false }) {
  const cleaned = sanitizeProfileInput({ email, rememberDevice });
  const auth = getAegisAuth();
  await setPersistence(auth, rememberDevice ? browserLocalPersistence : browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(auth, cleaned.email, password);
  let profile = await readUserProfile(credential.user);

  if (!profile) {
    profile = buildUserProfile(credential.user, { email: cleaned.email });
  } else {
    profile = {
      ...profile,
      email: profile.email || credential.user.email || cleaned.email,
      displayName: profile.displayName || credential.user.displayName || titleCase(cleaned.email.split("@")[0]),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
  }

  await setDoc(doc(getAegisFirestore(), "users", credential.user.uid), profile, { merge: true });

  return {
    user: credential.user,
    profile,
    nexusState: buildNexusStateFromSession({ user: credential.user, profile, rememberDevice }),
  };
}

export async function updateAccountProfile({ fullName, email, company, settings = {} }) {
  const auth = getAegisAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("A signed-in account is required to update profile settings.");
  }

  const cleaned = sanitizeProfileInput({ fullName, email, company });
  if (cleaned.fullName && cleaned.fullName !== user.displayName) {
    await updateProfile(user, { displayName: cleaned.fullName });
  }

  const patch = {
    displayName: cleaned.fullName || user.displayName || "",
    email: cleaned.email || user.email || "",
    company: cleaned.company,
    settings: {
      notifications: {
        ...DEFAULT_NOTIFICATIONS,
        ...(settings.notifications || {}),
      },
      apiKeys: Array.isArray(settings.apiKeys) ? settings.apiKeys : [],
    },
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(getAegisFirestore(), "users", user.uid), patch, { merge: true });
  const profile = { ...(await readUserProfile(user)), ...patch };
  return {
    user,
    profile,
    nexusState: buildNexusStateFromSession({ user, profile }),
  };
}

export async function requestPasswordReset(email) {
  const cleaned = sanitizeProfileInput({ email });
  if (!cleaned.email) throw new Error("Email is required for password reset.");
  await sendPasswordResetEmail(getAegisAuth(), cleaned.email);
}

export async function signOutOfEcoVerse() {
  await signOut(getAegisAuth());
}
