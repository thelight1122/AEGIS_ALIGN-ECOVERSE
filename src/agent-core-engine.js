import coreEngineReference from "./generated/core-engine-reference.json" with { type: "json" };

export const CORE_ENGINE = {
  ...coreEngineReference,
  displayVersion: `Canon v${coreEngineReference.canonVersion} · ${String(coreEngineReference.currentStatus || "unknown")
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")}`,
  propagation: "EcoVerse references the canon-locked Core Engine repository and applies its synchronized snapshot to Workshop creation surfaces during build.",
};

export function getCoreAgentManifest() {
  return {
    coreEngineId: CORE_ENGINE.id,
    sourceRepoPath: CORE_ENGINE.sourceRepoPath,
    referenceDate: CORE_ENGINE.referenceDate,
    canonVersion: CORE_ENGINE.canonVersion,
    standardsVersion: CORE_ENGINE.standardsVersion,
    currentStatus: CORE_ENGINE.currentStatus,
    posture: CORE_ENGINE.posture,
    invariants: [...(CORE_ENGINE.governanceInvariants || [])],
    defaults: { ...CORE_ENGINE.creationDefaults },
  };
}
