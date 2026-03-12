const reminders = [
  "manners",
  "consideration",
  "respect",
  "gratitude",
  "kindness",
  "wonder",
  "play",
  "discovery",
];

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const slots = Array.from(document.querySelectorAll("[data-reminder-seed]"));
if (slots.length > 0) {
  const picks = shuffle(reminders);
  slots.forEach((slot, index) => {
    slot.textContent = picks[index % picks.length];
  });
}
