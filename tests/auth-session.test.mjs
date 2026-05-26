import test from "node:test";
import assert from "node:assert/strict";

import {
  buildUserProfile,
  buildNexusStateFromSession,
  sanitizeProfileInput,
} from "../src/auth-session.js";

test("sanitizeProfileInput trims account fields and preserves remember-device intent", () => {
  assert.deepEqual(
    sanitizeProfileInput({
      fullName: "  Tracey Peer  ",
      email: "  PEER@example.com  ",
      company: "  AEGIS  ",
      rememberDevice: true,
    }),
    {
      fullName: "Tracey Peer",
      email: "peer@example.com",
      company: "AEGIS",
      rememberDevice: true,
    },
  );
});

test("buildUserProfile creates an owned Firestore profile without mock account data", () => {
  const profile = buildUserProfile(
    {
      uid: "uid-123",
      email: "peer@example.com",
      displayName: "Tracey Peer",
      photoURL: "https://example.com/avatar.png",
    },
    {
      company: "AEGIS",
      role: "developer",
    },
  );

  assert.equal(profile.uid, "uid-123");
  assert.equal(profile.email, "peer@example.com");
  assert.equal(profile.displayName, "Tracey Peer");
  assert.equal(profile.company, "AEGIS");
  assert.equal(profile.role, "developer");
  assert.equal(profile.subscriptionTier, "explorer");
  assert.equal(profile.accountStatus, "active");
  assert.deepEqual(profile.settings.apiKeys, []);
});

test("buildNexusStateFromSession hydrates signed-in UI state from the auth user and profile", () => {
  const state = buildNexusStateFromSession({
    user: {
      uid: "uid-123",
      email: "peer@example.com",
      displayName: "Tracey Peer",
    },
    profile: {
      company: "AEGIS",
      subscriptionTier: "subscriber",
      settings: {
        notifications: {
          securityAlerts: false,
          protocolAnalytics: true,
          emailSummary: false,
        },
        apiKeys: [],
      },
    },
  });

  assert.equal(state.signedIn, true);
  assert.equal(state.peerLabel, "Tracey Peer");
  assert.equal(state.subscription, "Subscriber");
  assert.equal(state.profile.email, "peer@example.com");
  assert.equal(state.profile.company, "AEGIS");
  assert.deepEqual(state.settings.apiKeys, []);
  assert.equal(state.settings.notifications.protocolAnalytics, true);
});
