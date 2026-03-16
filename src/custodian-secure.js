const output = document.getElementById("secure-output");
const buttons = Array.from(document.querySelectorAll(".secure-btn"));

const roleContent = {
  operator: {
    title: "Operations View",
    items: [
      "Review live system health and node saturation at 5-minute intervals.",
      "Approve or reject automated mitigation suggestions.",
      "Invite incident assessment when anomaly severity exceeds threshold.",
    ],
  },
  incident: {
    title: "Incident Assessor",
    items: [
      "Assess containment pathways and publish recommended response sequencing.",
      "Document severity findings and recovery checkpoints for team alignment.",
      "Record incident timeline artifacts for post-incident reflection and learning.",
    ],
  },
  governance: {
    title: "Governance Custodian",
    items: [
      "Validate policy change requests against protocol guardrails.",
      "Queue governance votes and monitor quorum progression.",
      "Archive approved policy events with immutable trace metadata.",
    ],
  },
};

function renderRole(role) {
  const data = roleContent[role];
  if (!data || !output) {
    return;
  }

  const listItems = data.items.map((item) => `<li>${item}</li>`).join("");
  output.innerHTML = `<h2>${data.title}</h2><ul>${listItems}</ul>`;
}

const roleRoutes = {
  operator: "/custodian-ui/custodian-hub-operations-gallery/",
  incident: "/custodian-ui/security-incident-assessor-center/",
  governance: "/custodian-ui/decentralized-governance-voting/",
};

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderRole(button.dataset.role);
    const route = roleRoutes[button.dataset.role];
    if (route) {
      window.setTimeout(() => {
        if (typeof window.aegisTransit === "function") {
          window.aegisTransit(route);
        } else {
          window.location.href = route;
        }
      }, 220);
    }
  });
});
