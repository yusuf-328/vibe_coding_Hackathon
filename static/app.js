// static/app.js
const notesEl = document.getElementById("notes");
const numEl = document.getElementById("numCards");
const genBtn = document.getElementById("generateBtn");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");
const cardsEl = document.getElementById("cards");
const libraryEl = document.getElementById("library");
const refreshBtn = document.getElementById("refreshBtn");

let currentCards = [];

function setStatus(msg, color = "") {
  statusEl.textContent = msg || "";
  statusEl.style.color = color;
}

// Make escapeHTML robust
function escapeHTML(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

// Render preview cards
function renderCards(cards){
  cardsEl.innerHTML = "";
  if (!cards || !cards.length) {
    cardsEl.innerHTML = `<small style="color:var(--muted)">No cards generated yet.</small>`;
    return;
  }
  cards.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="card-inner">
        <div class="front"><strong>Q:</strong> ${escapeHTML(c.question)}</div>
        <div class="back"><strong>A:</strong> ${escapeHTML(c.answer)}</div>
      </div>`;
    cardsEl.appendChild(div);
  });
}

async function loadLibrary() {
  libraryEl.innerHTML = "...loading";
  try {
    const res = await fetch("/api/flashcards");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load library");
    libraryEl.innerHTML = "";
    (data.flashcards || []).forEach(c => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="card-inner">
          <div class="front"><strong>Q:</strong> ${escapeHTML(c.question)}</div>
          <div class="back"><strong>A:</strong> ${escapeHTML(c.answer)}</div>
        </div>`;
      libraryEl.appendChild(div);
    });
  } catch (err) {
    libraryEl.textContent = `Load error: ${err.message}`;
  }
}

// Generate
genBtn.addEventListener("click", async () => {
  const notes = notesEl.value.trim();
  const num = Math.max(1, Math.min(12, Number(numEl.value) || 5));

  if (!notes) {
    setStatus("Please paste some notes first.", "#ffb86b");
    return;
  }

  setStatus("Generating flashcards with AI...", "#b7c0ff");
  genBtn.disabled = true;
  saveBtn.disabled = true;
  cardsEl.innerHTML = "";

  try {
    // <<< IMPORTANT: send "topic" (backend expects this) >>>
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ topic: notes, numCards: num })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to generate");

    currentCards = data.flashcards || data || [];
    renderCards(currentCards);
    saveBtn.disabled = currentCards.length === 0;
    setStatus(`Generated ${currentCards.length} card(s). Hover to flip.`, "#2ecc71");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "#ff6b6b");
  } finally {
    genBtn.disabled = false;
  }
});

// Save to DB
saveBtn.addEventListener("click", async () => {
  if (!currentCards.length) return;
  saveBtn.disabled = true;
  setStatus("Saving to library...", "#b7c0ff");
  try {
    const res = await fetch("/api/flashcards/save", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ flashcards: currentCards })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save");
    setStatus(`Saved ${data.saved_ids.length} card(s) to library.`, "#2ecc71");
    await loadLibrary();
  } catch (err) {
    setStatus(`Save error: ${err.message}`, "#ff6b6b");
  } finally {
    saveBtn.disabled = false;
  }
});

refreshBtn.addEventListener("click", loadLibrary);

// Preload library on start
document.addEventListener('DOMContentLoaded', () => {
  saveBtn.disabled = true; // default
  loadLibrary();
});