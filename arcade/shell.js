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

  // ---- REPORTING A RESULT BACK TO THE GAME ---------------------------------
  // A cabinet is an iframe, so it cannot touch the save. It posts what happened
  // and the app decides what that is worth. Deliberately one-way and
  // deliberately dumb: the frame says "I solved a hard Sudoku with no
  // mistakes", never "give me fifty Kencoins". Every rate lives in one table in
  // the app, so the economy can be retuned without opening five files, and a
  // tampered frame can only lie about WHAT it did, not about what it is owed.
  window.ARCADE = {
    report: function (what) {
      try {
        parent.postMessage({ kkdArcade: true, game: q.get("game") || "", what: what }, "*");
      } catch (e) { /* opened directly, outside the app: nothing to report to */ }
    },
  };

  // ---- THE OVERLAY STYLES TRAVEL WITH THE SCRIPT ---------------------------
  //
  // These used to live in shell.css, which every cabinet links. Cage Fall does
  // not: it is older than the shell and carries its own complete stylesheet, so
  // it got the bar and the settings sheet as raw unstyled markup dumped down the
  // side of the page. Anything the shell BUILDS, the shell must also STYLE, or
  // the next file that loads only the script breaks the same way.
  (function () {
    if (document.getElementById("arcShellCss")) return;
    var st = document.createElement("style");
    st.id = "arcShellCss";
    st.textContent = `/* ---- THE TUTORIAL CARD. One layout for every cabinet, so a player who has met
   one of these has met all of them. ---- */
#teachWrap{position:fixed;inset:0;background:#080612e8;backdrop-filter:blur(7px);
  display:flex;align-items:center;justify-content:center;z-index:60;padding:18px}
.paper #teachWrap{background:#f4efe2ee}
.tCard{width:100%;max-width:560px;background:#150f2e;border:1px solid var(--gold);
  border-radius:12px;padding:20px 22px;box-shadow:0 20px 60px #000a;max-height:92vh;overflow:auto}
.paper .tCard{background:#fffdf8;box-shadow:0 20px 60px #0003}
.tHead{display:flex;align-items:center;gap:12px;margin-bottom:12px}
#tFace{width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);flex-shrink:0}
#tWho{font-size:13px;font-weight:900;letter-spacing:2.4px;color:var(--gold)}
#tStep{font-size:9px;letter-spacing:2px;color:var(--dim2);margin-top:2px}
#tSay{font-size:14.5px;line-height:1.62;margin:0 0 12px;color:var(--ink)}
#tSay b{color:var(--ok)}
#tSay i{color:var(--rot);font-style:normal}
#tBody{margin:0 0 14px}
.tDemo{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin:4px 0}
.tG{display:grid;border:2px solid var(--ink);border-radius:3px;background:#0d0920}
.paper .tG{background:#fffdf8}
.tC{width:42px;height:42px;display:flex;align-items:center;justify-content:center;
  border-right:1px solid #ffffff1a;border-bottom:1px solid #ffffff1a;
  font-size:19px;font-weight:800;position:relative;color:var(--ink)}
.paper .tC{border-right-color:#00000018;border-bottom-color:#00000018}
.tC .cl{position:absolute;top:1px;left:3px;font-size:9px;font-weight:900;color:var(--gold)}
.tC.wr{border-right:3px solid var(--ink)} .tC.wb{border-bottom:3px solid var(--ink)}
.tC.ok{background:#1a7a5e2e;color:var(--ok)} .tC.no{background:#b0206030;color:var(--rot)}
.tC.hl{background:#a8761a2e;color:var(--gold)}
.tC.blk{background:#00000040}
.paper .tC.blk{background:#00000026}
.tNote{font-size:12px;color:var(--dim);line-height:1.55;margin:10px 0 0;text-align:center}
.tBtns{display:flex;gap:8px}
.tBtns button{width:auto;flex:1}

/* ---- THE BAR. A way out and a way into the settings, in the same place in
   every cabinet, whether the game is running inside the app or on its own. ---- */
body{padding-top:56px}
#arcBar{position:fixed;top:0;left:0;right:0;height:46px;z-index:70;
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:0 12px calc(0px) 12px;padding-top:env(safe-area-inset-top,0px);
  background:#0a0716d9;backdrop-filter:blur(9px);border-bottom:1px solid var(--line)}
.paper #arcBar{background:#fffdf8d9;border-bottom-color:#00000018}
.abBtn{width:auto;padding:8px 13px;font-size:10px;letter-spacing:2px;
  border:1px solid var(--line);background:transparent;color:var(--dim)}
.abBtn:hover{color:var(--ink);border-color:var(--dim2)}
#setWrap{position:fixed;inset:0;background:#080612e8;backdrop-filter:blur(7px);
  display:none;align-items:center;justify-content:center;z-index:80;padding:18px}
.paper #setWrap{background:#f4efe2ee}
#setTitle{font-size:12px;font-weight:900;letter-spacing:3px;color:var(--gold);margin-bottom:14px}
.setRow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;
  font-size:11px;letter-spacing:2px;color:var(--dim)}
.seg{display:flex;gap:0}
.seg button{width:auto;padding:8px 14px;font-size:10px;letter-spacing:1.6px;border-radius:0;
  border:1px solid var(--line);background:transparent;color:var(--dim2)}
.seg button:first-child{border-radius:6px 0 0 6px}
.seg button:last-child{border-radius:0 6px 6px 0;border-left:none}
.seg button.on{background:var(--gold);color:#241c07;border-color:var(--gold)}
.paper .seg button.on{color:#fff}
.setNote{font-size:10.5px;line-height:1.55;color:var(--dim2);margin:2px 0 0}
`;
    (document.head || document.documentElement).appendChild(st);
  })();

  // ---- A TUTORIAL, TAUGHT BY SOMEBODY ---------------------------------------
  //
  // Every cabinet had a HOW IT WORKS box: correct, silent, and read by nobody.
  // A rule explained by a person who has opinions about it is a different
  // object entirely, and this game already has a cast whose whole job is
  // explaining things in character.
  //
  // Who teaches what is not arbitrary. Each of them is already written to speak
  // a particular way in the main game, and the machines are handed out to match:
  //
  //   LULU        moves first, encourages     -> CAGE FALL, which is under a clock
  //   KENCULATOR  blunt, literal, capitals    -> SUDOKU, which is pure elimination
  //   DR. TEZ     explains the why            -> KILLER SUDOKU, the bridge to KenKen
  //   THE KEEPER  asks rather than tells      -> KAKURO, which is a question about sets
  //   MICHI       draws a grid to get in      -> HIDATO, which has no arithmetic at all
  //   KELLY       reads the clock             -> 2048, which is pace and greed
  //
  // The art lives with the app, not the cabinet, so the path is worked out from
  // this script's own src rather than guessed.
  var ART = (function () {
    var me = document.currentScript || (function () {
      var all = document.getElementsByTagName("script");
      for (var i = all.length - 1; i >= 0; i--) if ((all[i].src || "").indexOf("shell.js") >= 0) return all[i];
      return null;
    })();
    var src = me ? me.src : "";
    return src.replace(/arcade\/shell\.js.*$/, "art/");
  })();

  var CAST = {
    lulu:   { name: "LULU",           art: "char_lulu.webp",   tint: "#ff9d5c" },
    ken:    { name: "THE KENCULATOR", art: "char_ken.webp",    tint: "#a78bfa" },
    tez:    { name: "DR. TEZ",        art: "char_tez.webp",    tint: "#22e0ff" },
    keeper: { name: "THE KEEPER",     art: "char_keeper.webp", tint: "#5df0c8" },
    michi:  { name: "MICHI",          art: "char_michi.webp",  tint: "#cfe0ff" },
    kelly:  { name: "KELLY",          art: "char_kelly.webp",  tint: "#f5c842" },
  };

  var teachStep = 0, teachScript = null, teachDone = null;
  function paintTeach() {
    var st = teachScript[teachStep];
    var who = CAST[st.who] || CAST.ken;
    document.getElementById("tWho").textContent = who.name;
    document.getElementById("tStep").textContent = "STEP " + (teachStep + 1) + " OF " + teachScript.length;
    document.getElementById("tSay").innerHTML = st.say;
    document.getElementById("tBody").innerHTML = st.show || "";
    var img = document.getElementById("tFace");
    img.src = ART + who.art;
    img.style.borderColor = who.tint;
    document.getElementById("tWho").style.color = who.tint;
    document.getElementById("tBack").style.visibility = teachStep ? "visible" : "hidden";
    document.getElementById("tNext").textContent = teachStep === teachScript.length - 1 ? "PLAY" : "NEXT";
  }
  window.ARCADE = window.ARCADE || {};
  window.ARCADE.teach = function (script, onDone) {
    teachScript = script; teachStep = 0; teachDone = onDone;
    var wrap = document.getElementById("teachWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "teachWrap";
      wrap.innerHTML =
        '<div class="tCard">' +
          '<div class="tHead">' +
            '<img id="tFace" alt="">' +
            '<div><div id="tWho"></div><div id="tStep"></div></div>' +
          '</div>' +
          '<p id="tSay"></p>' +
          '<div id="tBody"></div>' +
          '<div class="tBtns"><button class="ghost" id="tBack">BACK</button><button id="tNext">NEXT</button></div>' +
        '</div>';
      document.body.appendChild(wrap);
      document.getElementById("tNext").onclick = function () {
        if (teachStep < teachScript.length - 1) { teachStep++; SFX.tick(); paintTeach(); return; }
        wrap.style.display = "none";
        if (teachDone) teachDone();
      };
      document.getElementById("tBack").onclick = function () {
        if (teachStep) { teachStep--; SFX.tick(); paintTeach(); }
      };
    }
    wrap.style.display = "flex";
    paintTeach();
  };
  // The lesson runs itself the first time you ever open a cabinet, and never
  // again on its own. Anything else is a wall between the player and the game.
  // HOW TO PLAY stays in the panel for as long as they want it.
  window.ARCADE.teachOnce = function (script, onDone) {
    // the file's own name, so a cabinet opened directly outside the app still
    // remembers its own lesson rather than sharing one flag with the others
    var key = "kkd-taught-" + (q.get("game") || location.pathname.split("/").pop());
    var seen = false;
    try { seen = !!localStorage.getItem(key); } catch (e) {}
    var btn = document.getElementById("howto");
    if (btn) btn.onclick = function () { window.ARCADE.teach(script); };
    if (seen) { if (onDone) onDone(); return; }
    try { localStorage.setItem(key, "1"); } catch (e) {}
    window.ARCADE.teach(script, onDone);
  };

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
    isMuted: function () { return muted; },
  };

  // ---- THE BAR ------------------------------------------------------------
  //
  // Every cabinet needs the same two things and none of them should own either:
  // a way OUT, and the settings a player expects to find without leaving. The
  // app draws its own back button over the frame, but that only exists when the
  // frame is inside the app. Opened directly, or on a phone where the app's
  // overlay sits under the notch, there was no way back at all.
  //
  // Control messages are a SEPARATE channel from ARCADE.report on purpose. The
  // report path is wired to the economy, and a button that changes the volume
  // must not be able to reach a function that pays out coins.
  function ctl(cmd, extra) {
    if (parent === window) return false;
    var msg = { kkdCtl: true, cmd: cmd };
    for (var k in (extra || {})) msg[k] = extra[k];
    try { parent.postMessage(msg, "*"); return true; } catch (e) { return false; }
  }
  var INAPP = parent !== window;
  function buildBar() {
    var bar = document.createElement("div");
    bar.id = "arcBar";
    bar.innerHTML =
      (INAPP ? '<button class="abBtn" id="abBack">&larr; ARCADE</button>' : '<span></span>') +
      '<button class="abBtn" id="abSet">SETTINGS</button>';
    document.body.appendChild(bar);

    var sheet = document.createElement("div");
    sheet.id = "setWrap";
    sheet.innerHTML =
      '<div class="tCard" style="max-width:360px">' +
        '<div id="setTitle">SETTINGS</div>' +
        '<div class="setRow"><span>SOUND</span>' +
          '<span class="seg"><button data-snd="1">ON</button><button data-snd="0">OFF</button></span></div>' +
        (INAPP ? '<div class="setRow"><span>PAPER</span>' +
          '<span class="seg"><button data-pap="dark">DARK</button><button data-pap="light">LIGHT</button></span></div>' +
          '<p class="setNote">Every paper the game has lives in the main settings. This just swaps between your dark one and your light one.</p>' : "") +
        '<button class="ghost" id="setTeach" style="margin-top:12px">HOW TO PLAY</button>' +
        '<button id="setClose" style="margin-top:7px">BACK TO THE GAME</button>' +
      '</div>';
    document.body.appendChild(sheet);

    function paintSeg() {
      var on = !muted;
      var b = sheet.querySelectorAll("[data-snd]");
      b[0].className = on ? "on" : ""; b[1].className = on ? "" : "on";
      var light = document.documentElement.className.indexOf("paper") >= 0;
      var p = sheet.querySelectorAll("[data-pap]");
      if (p.length) { p[0].className = light ? "" : "on"; p[1].className = light ? "on" : ""; }
    }
    if (document.getElementById("abBack")) {
      document.getElementById("abBack").onclick = function () {
        SFX.tick();
        // no parent means it was opened on its own, so the browser's own history
        // is the only "back" there is
        if (!ctl("exit")) history.back();
      };
    }
    document.getElementById("abSet").onclick = function () {
      SFX.tick(); paintSeg(); sheet.style.display = "flex";
    };
    document.getElementById("setClose").onclick = function () {
      SFX.tick(); sheet.style.display = "none";
    };
    document.getElementById("setTeach").onclick = function () {
      sheet.style.display = "none";
      var btn = document.getElementById("howto");
      if (btn && btn.onclick) btn.onclick();
    };
    sheet.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.snd !== undefined) {
        muted = b.dataset.snd === "0";
        ctl("mute", { on: muted });
        if (!muted) SFX.tick();
        paintSeg();
      } else if (b.dataset.pap !== undefined) {
        SFX.tick();
        // the app owns the skins, so it makes the change and re-opens the frame
        ctl("paper", { kind: b.dataset.pap });
      }
    });
    // the sheet closes on the backdrop, like every other overlay in the game
    sheet.addEventListener("mousedown", function (e) {
      if (e.target === sheet) { SFX.tick(); sheet.style.display = "none"; }
    });
    window.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (sheet.style.display === "flex") { sheet.style.display = "none"; return; }
      var t = document.getElementById("teachWrap");
      if (t && t.style.display === "flex") return;   // the lesson has its own buttons
      if (INAPP) ctl("exit");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildBar);
  else buildBar();
})();
