/* ─── Find Match ─────────────────────────────────────────────────────────── */

function selectMatchType(el) {
  var cards = el.closest(".match-type-grid").querySelectorAll(".match-type-card");
  cards.forEach(function (c) { c.classList.remove("active"); });
  el.classList.add("active");
}

function selectSkillLevel(el) {
  var chips = el.closest(".option-grid").querySelectorAll(".option-chip");
  chips.forEach(function (c) { c.classList.remove("active"); });
  el.classList.add("active");
}

function updateDateDisplay(input) {
  var el = document.getElementById("date-display");
  if (!el || !input.value) return;
  var d = new Date(input.value + "T00:00:00");
  el.textContent = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function updateTimeDisplay(spanId, val) {
  var el = document.getElementById(spanId);
  if (!el || !val) return;
  var parts = val.split(":");
  var h = parseInt(parts[0], 10);
  var m = parts[1];
  var ampm = h >= 12 ? "PM" : "AM";
  var h12 = h % 12 || 12;
  el.textContent = h12 + ":" + m + " " + ampm;
}

function updateDuration() {
  var startEl = document.getElementById("start-time");
  var endEl = document.getElementById("end-time");
  var hintEl = document.getElementById("duration-hint");
  var textEl = document.getElementById("duration-text");
  if (!startEl || !endEl || !hintEl || !textEl) return;
  if (!startEl.value || !endEl.value) return;

  var startMins = timeToMins(startEl.value);
  var endMins = timeToMins(endEl.value);
  var diff = endMins - startMins;

  hintEl.classList.remove("duration-hint-warn");

  if (diff <= 0) {
    hintEl.classList.add("duration-hint-warn");
    textEl.textContent = "End time must be after start time";
    return;
  }

  var hrs = Math.floor(diff / 60);
  var mins = diff % 60;
  var label = hrs > 0 ? hrs + " hr" + (hrs > 1 ? "s" : "") : "";
  if (mins > 0) label += (label ? " " : "") + mins + " min";
  textEl.textContent = label + " session";
}

function timeToMins(val) {
  var parts = val.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/* ─── Join Lobby ─────────────────────────────────────────────────────────── */

function showJoinSuccess() {
  var modal = document.getElementById("join-success-modal");
  if (!modal) return;
  modal.hidden = false;
  requestAnimationFrame(function () {
    modal.classList.add("match-modal-visible");
  });
}

function closeJoinModal() {
  var modal = document.getElementById("join-success-modal");
  if (!modal) return;
  modal.classList.remove("match-modal-visible");
  setTimeout(function () { modal.hidden = true; }, 250);
}

function goToBookings() {
  window.location.href = "bookings.html";
}

/* ─── Score Tracking ─────────────────────────────────────────────────────── */

var SCORE_TARGET = 15;
var SCORE_WIN = 16;
var matchFinished = false;

function adjustScore(team, delta) {
  if (matchFinished) return;
  var scoreEl = document.getElementById("score-" + team);
  var next = Math.max(0, parseInt(scoreEl.textContent, 10) + delta);
  scoreEl.textContent = next;
  var bar = document.getElementById("progress-" + team);
  if (bar) {
    bar.style.width = Math.min(100, Math.round((next / SCORE_TARGET) * 100)) + "%";
  }
  if (next >= SCORE_WIN) {
    matchFinished = true;
    var winnerName = team === "a" ? "Team A" : "Team B";
    var msgEl = document.getElementById("match-modal-msg");
    if (msgEl) msgEl.textContent = winnerName + " wins the match!";
    var modal = document.getElementById("match-finish-modal");
    if (modal) {
      modal.hidden = false;
      modal.classList.add("match-modal-visible");
    }
  }
}

function closeMatchModal() {
  window.location.href = "player-feedback.html";
}

/* ─── Player Feedback ────────────────────────────────────────────────────── */

function setRating(el) {
  var stars = el.closest(".feedback-stars").querySelectorAll(".fstar");
  var idx = Array.prototype.indexOf.call(stars, el);
  stars.forEach(function (s, i) { s.classList.toggle("active", i <= idx); });
}

function toggleTag(el) {
  el.classList.toggle("active");
}

/* ─── Invite Friends ─────────────────────────────────────────────────────── */

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(function () {
    var original = btn.textContent;
    btn.textContent = "Copied!";
    btn.style.opacity = "0.7";
    setTimeout(function () {
      btn.textContent = original;
      btn.style.opacity = "";
    }, 1500);
  });
}

function copyInviteCode() {
  var code = document.getElementById("invite-code").textContent;
  copyText(code, document.getElementById("copy-code-btn"));
}

function copyInviteLink() {
  var link = document.getElementById("invite-link").textContent;
  copyText(link, document.getElementById("copy-link-btn"));
}

function generateNewCode() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var newCode = "CC";
  for (var i = 0; i < 4; i++) {
    newCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById("invite-code").textContent = newCode;
  document.getElementById("invite-link").textContent =
    "courtconnect.com/session/" + newCode;
}
