// ============================================================================
// THE CABINET SHELL. Two things every arcade game needs and none of them should
// implement twice: the player's skin, and a noise when something happens.
//
// These games are iframes of standalone files, so they cannot reach the app's
// theme object or its procedural audio. The app hands the skin over on the URL
// instead, and the audio is rebuilt here in about thirty lines.
// NOTE ON THE FILENAME. These were called _shell.css and _shell.js, and
// GitHub Pages runs Jekyll, which HIDES anything beginning with an underscore.
// Both returned 404 on the live site while working perfectly on the dev server,
// so the arcade shipped unstyled and silent for two releases without any local
// test being able to see it. There is a .nojekyll now as well, but the real fix
// is the name: it cannot happen again on any host.
// ============================================================================

(function () {
  // ---- THE SKIN ------------------------------------------------------------
  // The app has eight papers, three of them light, and the arcade was hardcoded
  // dark: a player on the Notebook or Newsprint skin opened a cabinet and got a
  // black hole. Every colour comes in on the query string now, and anything not
  // sent keeps the dark default already in shell.css.
  var q = new URLSearchParams(location.search);
  var MAP = {
    bg: "--bg", ink: "--ink", dim: "--dim", dim2: "--dim2", line: "--line",
    info: "--info", gold: "--gold", rot: "--rot", ok: "--ok", myst: "--myst",
  };
  var root = document.documentElement;
  for (var k in MAP) {
    var v = q.get(k);
    if (v && /^[#a-zA-Z0-9(),.% ]+$/.test(v)) root.style.setProperty(MAP[k], v);
  }
  // A LIGHT PAPER NEEDS MORE THAN NEW COLOURS. Panels and cells are drawn with
  // near-black washes that vanish on cream, so the page carries a class and the
  // stylesheet flips those to ink-on-paper.
  if (q.get("paper") === "1") root.className += " paper";

  // ---- THE NOISE -----------------------------------------------------------
  // Procedural, like the rest of the game, so there are no files to load and
  // nothing to cache. Built lazily inside the first gesture because iOS will
  // not start an AudioContext any other way.
  var ctx = null, muted = q.get("mute") === "1";
  function ac() {
    if (muted) return null;
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, ms, type, vol) {
    var a = ac(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.value = 0;
    o.connect(g); g.connect(a.destination);
    var t = a.currentTime;
    g.gain.linearRampToValueAtTime(vol === undefined ? 0.06 : vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.start(t); o.stop(t + ms / 1000 + 0.02);
  }
  // One vocabulary across the whole cabinet, so a sound means the same thing in
  // every game: tick you moved, place you committed, no you broke a rule,
  // good something completed, win the board is finished.
  window.SFX = {
    tick:  function () { tone(520, 45, "square", 0.025); },
    place: function () { tone(660, 70, "triangle", 0.05); },
    no:    function () { tone(150, 150, "sawtooth", 0.05); },
    good:  function () { tone(720, 90, "triangle", 0.06); setTimeout(function () { tone(1080, 120, "triangle", 0.05); }, 80); },
    win:   function () { [0, 110, 220, 380].forEach(function (d, i) { setTimeout(function () { tone([523, 659, 784, 1046][i], 200, "triangle", 0.06); }, d); }); },
    mute:  function (on) { muted = on; },
  };
})();
