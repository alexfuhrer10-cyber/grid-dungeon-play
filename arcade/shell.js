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

/* global SFX */ // assigned as window.SFX further down this same file;
// bare reads are correct at runtime because every one of them is inside a
// handler that cannot fire before the assignment. eslint cannot see that
// through `window.`, and 13 no-undef errors buried the two real ones.
(function () {
  // ---- THE SKIN ------------------------------------------------------------
  // The app has ten papers, seven of them light, and the arcade was hardcoded
  // dark: a player on the Notebook or Newsprint skin opened a cabinet and got a
  // black hole. Every colour comes in on the query string now, and anything not
  // sent keeps the dark default already in shell.css.
  var q = new URLSearchParams(location.search);
  var MAP = {
    bg: "--bg", bgDeep: "--bgDeep", surf: "--surf", surf2: "--surf2",
    ink: "--ink", dim: "--dim", dim2: "--dim2", line: "--line", edge: "--edge",
    info: "--info", gold: "--gold", rot: "--rot", ok: "--ok", myst: "--myst",
    accentInk: "--accentInk",
  };
  var root = document.documentElement;
  var got = {};
  for (var k in MAP) {
    var v = q.get(k);
    if (v && /^[#a-zA-Z0-9(),.% ]+$/.test(v)) { root.style.setProperty(MAP[k], v); got[k] = v; }
  }
  // A LIGHT PAPER NEEDS MORE THAN NEW COLOURS. Panels and cells are drawn with
  // near-black washes that vanish on cream, so the page carries a class and the
  // stylesheet flips those to ink-on-paper.
  var paper = q.get("paper") === "1";
  if (paper) root.className += " paper";

  // ---- ONE PALETTE PER PAPER, NOT TWO ----------------------------------------
  //
  // The colours above only ever reached the CHROME: the headings, the side
  // panel, the buttons. Every BOARD in here was drawn with its own literal
  // hexes, and there were exactly two sets of them — a midnight-indigo one and
  // a cream one — repeated in all five games. So the app has ten papers and
  // the cabinets had two. Somebody on the Legal Pad got a yellow game around a
  // Vault-indigo Sudoku grid, and every dark skin got the same indigo whatever
  // its own hue was.
  //
  // These are the SEMANTIC surfaces a puzzle board actually needs, worked out
  // once, here, from the skin the player chose. A game now says `var(--sel)`
  // and gets that skin's selection wash. Nothing downstream repeats a palette,
  // and adding a twelfth paper needs no edit in this folder at all.
  //
  // Deliberately computed in JS rather than with color-mix(): this file is
  // served to whatever browser the player has, and a board that silently loses
  // its selection colour is worse than a few lines of arithmetic.
  var hex = function (s) { return typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s) ? s : null; };
  var rgb = function (s) { var n = parseInt(s.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  var a = function (s, alpha) {                                   // a wash of a colour
    var c = hex(s); if (!c) return "transparent";
    var p = rgb(c); return "rgba(" + p[0] + "," + p[1] + "," + p[2] + "," + alpha + ")";
  };
  var mix = function (s, t, amt) {                                // one step toward another
    var c = hex(s), d = hex(t); if (!c || !d) return c || d || "#000000";
    var p = rgb(c), r = rgb(d), out = "#";
    for (var i = 0; i < 3; i++) {
      var v = Math.round(p[i] * (1 - amt) + r[i] * amt);
      out += (v < 16 ? "0" : "") + v.toString(16);
    }
    return out;
  };
  var BG = hex(got.bg) || "#0a0716";
  var DEEP = hex(got.bgDeep) || mix(BG, "#000000", 0.35);
  var SURF = hex(got.surf) || mix(BG, "#ffffff", 0.08);
  var INK = hex(got.ink) || "#f2efff";
  var INFO = hex(got.info) || "#22e0ff";
  var GOLD = hex(got.gold) || "#f5c842";
  var ROT = hex(got.rot) || "#ff2d95";
  var OK = hex(got.ok) || "#5df0c8";
  var MYST = hex(got.myst) || "#a78bfa";
  var SEM = {
    // the board's own field, and the two cell states either side of it
    "--panel": paper ? mix(SURF, "#ffffff", 0.55) : DEEP,
    "--cell": paper ? a(INK, 0.07) : SURF,
    "--cell2": paper ? a(INK, 0.16) : mix(DEEP, "#000000", 0.4),
    // the rules between cells, and the heavier ones between boxes
    "--rule": a(INK, paper ? 0.16 : 0.1),
    "--rule2": a(INK, paper ? 0.4 : 0.34),
    // what the board says about where you are
    "--sel": a(INFO, paper ? 0.2 : 0.26),
    "--same": a(INFO, paper ? 0.1 : 0.14),
    "--peer": a(INK, paper ? 0.06 : 0.05),
    "--cage": a(MYST, paper ? 0.12 : 0.17),
    // the verdict washes, each its own token so a skin carries them, and each
    // in two strengths: Cage Fall alone needs "this row is done" to sit next to
    // "this square is sealed" and still be told apart.
    "--okw": a(OK, paper ? 0.14 : 0.17),
    "--okwS": a(OK, paper ? 0.26 : 0.3),
    "--goldw": a(GOLD, paper ? 0.14 : 0.17),
    "--goldwS": a(GOLD, paper ? 0.26 : 0.3),
    "--rotw": a(ROT, paper ? 0.14 : 0.19),
    "--rotwS": a(ROT, paper ? 0.26 : 0.32),
    "--btn": a(INFO, paper ? 0.12 : 0.16),
    // the light the board throws, and what covers it when a round ends
    "--glow": a(INFO, paper ? 0.1 : 0.14),
    "--scrim": a(BG, 0.91),
    "--sheet": paper ? mix(SURF, "#ffffff", 0.5) : mix(BG, "#ffffff", 0.06),
    "--shadow": "rgba(0,0,0," + (paper ? 0.2 : 0.66) + ")",
  };
  for (var s in SEM) root.style.setProperty(s, SEM[s]);

  // A GAME THAT NEEDS A COLOUR RAMP CANNOT DO IT IN CSS. 2048 tints eleven tile
  // values, and it carried two hardcoded eleven-step ladders to do it. The skin
  // is handed over instead, so a ramp can be BUILT from whatever paper the
  // player is on rather than picked from two.
  var SKIN = {
    paper: paper, bg: BG, deep: DEEP, surf: SURF, panel: SEM["--panel"],
    ink: INK, info: INFO, gold: GOLD, rot: ROT, ok: OK, myst: MYST,
    mix: mix, alpha: a,
    // black or white on a given fill, whichever actually reads
    inkOn: function (c) {
      var p = rgb(hex(c) || "#000000");
      var lum = (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
      return lum > 0.55 ? "#141014" : "#f6f3ff";
    },
  };

  // ---- REPORTING A RESULT BACK TO THE GAME ---------------------------------
  // A cabinet is an iframe, so it cannot touch the save. It posts what happened
  // and the app decides what that is worth. Deliberately one-way and
  // deliberately dumb: the frame says "I solved a hard Sudoku with no
  // mistakes", never "give me fifty Kencoins". Every rate lives in one table in
  // the app, so the economy can be retuned without opening five files, and a
  // tampered frame can only lie about WHAT it did, not about what it is owed.
  var CURRENT_LEVEL = "";      // set by the front page, read by every report
  window.ARCADE = {
    skin: SKIN,
    setLevel: function (name) { CURRENT_LEVEL = name || ""; },
    report: function (what) {
      try {
        var full = {};
        for (var k in what) full[k] = what[k];
        // stamped centrally: a cabinet cannot forget to send them, and an
        // achievement never has to guess what a missing field meant
        if (full.secs === undefined && window.ARCADE.clock) full.secs = window.ARCADE.clock.secs();
        if (full.level === undefined && CURRENT_LEVEL) full.level = CURRENT_LEVEL;
        parent.postMessage({ kkdArcade: true, game: q.get("game") || "", what: full }, "*");
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
#teachWrap{position:fixed;inset:0;background:var(--scrim);backdrop-filter:blur(7px);
  display:flex;align-items:center;justify-content:center;z-index:60;padding:18px}
.tCard{width:100%;max-width:560px;background:var(--sheet);border:1px solid var(--gold);
  border-radius:12px;padding:20px 22px;box-shadow:0 20px 60px #000a;max-height:92vh;overflow:auto}
.tHead{display:flex;align-items:center;gap:12px;margin-bottom:12px}
#tFace{width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);flex-shrink:0}
#tWho{font-size:13px;font-weight:900;letter-spacing:2.4px;color:var(--gold)}
#tStep{font-size:9px;letter-spacing:2px;color:var(--dim2);margin-top:2px}
#tSay{font-size:14.5px;line-height:1.62;margin:0 0 12px;color:var(--ink)}
#tSay b{color:var(--ok)}
#tSay i{color:var(--rot);font-style:normal}
#tBody{margin:0 0 14px}
.tDemo{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin:4px 0}
.tG{display:grid;border:2px solid var(--ink);border-radius:3px;background:var(--panel)}
.tC{width:42px;height:42px;display:flex;align-items:center;justify-content:center;
  border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);
  font-size:19px;font-weight:800;position:relative;color:var(--ink)}
.tC .cl{position:absolute;top:1px;left:3px;font-size:9px;font-weight:900;color:var(--gold)}
.tC.wr{border-right:3px solid var(--ink)} .tC.wb{border-bottom:3px solid var(--ink)}
.tC.ok{background:var(--okw);color:var(--ok)} .tC.no{background:var(--rotw);color:var(--rot)}
.tC.hl{background:var(--goldw);color:var(--gold)}
.tC.blk{background:var(--cell2)}
.tNote{font-size:12px;color:var(--dim);line-height:1.55;margin:10px 0 0;text-align:center}
.tBtns{display:flex;gap:8px}
.tBtns button{width:auto;flex:1}

/* ---- THE BAR. A way out and a way into the settings, in the same place in
   every cabinet, whether the game is running inside the app or on its own. ---- */
body{padding-top:56px}
#arcBar{position:fixed;top:0;left:0;right:0;height:46px;z-index:70;
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:0 12px calc(0px) 12px;padding-top:env(safe-area-inset-top,0px);
  background:var(--scrim);backdrop-filter:blur(9px);border-bottom:1px solid var(--line)}
.abBtn{width:auto;padding:8px 13px;font-size:10px;letter-spacing:2px;
  border:1px solid var(--line);background:transparent;color:var(--dim)}
.abBtn:hover{color:var(--ink);border-color:var(--dim2)}
#setWrap{position:fixed;inset:0;background:var(--scrim);backdrop-filter:blur(7px);
  display:none;align-items:center;justify-content:center;z-index:80;padding:18px}
#setTitle{font-size:12px;font-weight:900;letter-spacing:3px;color:var(--gold);margin-bottom:14px}
.setRow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;
  font-size:11px;letter-spacing:2px;color:var(--dim)}
.seg{display:flex;gap:0}
.seg button{width:auto;padding:8px 14px;font-size:10px;letter-spacing:1.6px;border-radius:0;
  border:1px solid var(--line);background:transparent;color:var(--dim2)}
.seg button:first-child{border-radius:6px 0 0 6px}
.seg button:last-child{border-radius:0 6px 6px 0;border-left:none}
.seg button.on{background:var(--gold);color:var(--accentInk);border-color:var(--gold)}
.setNote{font-size:10.5px;line-height:1.55;color:var(--dim2);margin:2px 0 0}
/* ---- THE CABINET'S OWN FRONT PAGE. What it is, what you can set, START, and
   HOW TO PLAY as a choice rather than an interruption. ---- */
#menuWrap{position:fixed;inset:0;background:var(--scrim);backdrop-filter:blur(7px);
  display:flex;align-items:center;justify-content:center;z-index:75;padding:18px}
#mTitle{font-size:15px;font-weight:900;letter-spacing:3px;color:var(--gold);margin-bottom:8px}
#mBlurb{font-size:12.5px;line-height:1.55;color:var(--dim);margin:0 0 14px}
.tCard{position:relative}
#tClose{position:absolute;top:8px;right:8px;width:36px;min-height:36px;padding:0;font-size:17px;
  border:1px solid var(--line);background:transparent;color:var(--dim);border-radius:8px}
/* ---- ON A PHONE THE CABINET STACKS. Every one of these is a flex ROW of a
   board plus a 206px side panel. Under about 560px that panel climbs on top of
   the board: measured at 375, the board still ran to 350px while the panel
   started at 304. Nothing scrolled sideways, so it read as a layout that fit
   when it was actually overlapping. Column below the break, and the panel goes
   full width under the board where there is room for it. ---- */
@media (max-width: 560px){
  body{flex-direction:column; align-items:center; gap:14px; padding:14px 10px 26px}
  .side{width:100%; max-width:430px}
  .pad{width:100%; max-width:430px}
  #arcBar{position:sticky}
}
/* ---- THE BOARDS FIT THE PHONE, not the other way round -------------------
   Every board in here was authored at a fixed pixel size that happens to suit a
   desktop. On a 375 phone with 10px of padding there are 355 CSS pixels to play
   with, so a 9-wide Sudoku gets 39 per square and a 44px cell simply hangs off
   the edge. These sizes are computed from the viewport instead, with a floor so
   nothing becomes untappable, and the numbers scale with them.

   The pad is the other half: nine number keys in one row are 39px each, which is
   under the 44px touch minimum, so below the break they wrap to a comfortable
   grid instead. ---- */
@media (max-width: 560px){
  /* 9-wide boards: Sudoku and the Killer */
  /* the board's PARENT is a plain div with no width of its own, so the grid
     sized itself off content and ran past the viewport even with 100% set */
  body > div{width:100%; max-width:100%; min-width:0}
  #grid{grid-template-columns:repeat(9, minmax(0, 1fr)) !important;
        width:100%; max-width:min(430px, 100%); margin:0 auto}
  #grid .c{width:auto !important; height:auto !important; aspect-ratio:1;
           font-size:clamp(13px, 4.4vw, 20px) !important}
  #grid .c .sum{font-size:clamp(7px, 2.3vw, 10px)}
  #grid .c .nt{font-size:clamp(6px, 2vw, 9px)}
  /* the number pad: never fewer than 44px of finger */
  /* .pad carries a hardcoded 396px width, which hangs the ninth key off a 375
     screen. The grid also has to be told a width or it inherits that one. */
  .pad{display:grid !important; grid-template-columns:repeat(5, 1fr); gap:6px;
       width:100% !important; max-width:min(430px, 100%); margin:10px auto 0}
  .pad button{width:auto !important; min-height:46px; flex:none !important; font-size:17px}
  .pad button.era{grid-column:span 2; font-size:11px}
  /* the well and the board in Cage Fall, and the 2048 tiles */
  #well, #board{max-width:100%}
  #say{min-height:26px}
}
@media (max-width: 380px){
  body{padding:12px 8px 24px}
  h1{font-size:14px; letter-spacing:4px}
  .box{padding:9px 11px}
}
/* A PHONE IN THE HAND IS SHORT, NOT JUST NARROW. Landscape on a small device
   leaves ~360px of height, and a fixed 46px bar plus 56px of padding eats a
   third of it before the board is drawn. */
@media (max-height: 480px){
  body{padding-top:50px}
  #arcBar{height:38px}
  .abBtn{padding:6px 10px}
}
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
          '<button id="tClose" aria-label="Close">&times;</button>' +
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
      // OPENED FROM HOW TO PLAY MID-GAME, the only way out was to page all the
      // way to the end. A lesson you cannot leave is not a lesson.
      document.getElementById("tClose").onclick = function () {
        SFX.tick(); wrap.style.display = "none"; if (teachDone) teachDone();
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


  // ---- A CLOCK EVERY CABINET SHARES ---------------------------------------
  // Nothing in here was timed, so "solved it" was the only thing a machine could
  // ever say about a run. An achievement ladder needs to know how long it took
  // and how hard the board was, so both ride home on every report.
  var clockT0 = 0;
  window.ARCADE.clock = {
    start: function () { clockT0 = Date.now(); },
    secs: function () { return clockT0 ? Math.max(0, Math.round((Date.now() - clockT0) / 1000)) : 0; },
  };

  // ---- THE FRONT OF THE CABINET -------------------------------------------
  //
  // A machine should not start teaching the moment you walk up to it. Every
  // cabinet used to deal a board and throw its lesson over the top on the first
  // visit, so the first thing a new player did was dismiss something.
  //
  // Now each one opens on its own small menu: what it is, whatever it lets you
  // set, START, and HOW TO PLAY sitting there as a choice for anyone who wants
  // it. The lesson is never automatic again.
  window.ARCADE.start = function (cfg) {
    var wrap = document.createElement("div");
    wrap.id = "menuWrap";
    var opts = cfg.options || [];
    function paint() {
      var h = '<div class="tCard" style="max-width:380px">' +
        '<div id="mTitle">' + cfg.title + '</div>' +
        (cfg.blurb ? '<p id="mBlurb">' + cfg.blurb + '</p>' : "");
      opts.forEach(function (o, i) {
        h += '<div class="setRow" style="flex-direction:column;align-items:stretch;gap:6px">' +
             '<span>' + o.label + '</span><span class="seg" data-opt="' + i + '">';
        o.choices.forEach(function (ch) {
          h += '<button data-v="' + ch[0] + '"' + (String(o.value()) === String(ch[0]) ? ' class="on"' : "") + '>' + ch[1] + '</button>';
        });
        h += '</span></div>';
      });
      h += '<button id="mStart" style="margin-top:12px">START</button>' +
           '<button class="ghost" id="mTeach" style="margin-top:7px">HOW TO PLAY</button>' +
           // THE FRONT PAGE SITS ABOVE THE BAR, so without this the first screen
           // of every machine was a dead end: no START pressed yet, and the only
           // exit hidden underneath it. Reloading was the way out.
           '<button class="ghost" id="mBack" style="margin-top:7px">' +
             (INAPP ? '&larr; BACK TO THE ARCADE' : 'BACK') + '</button>' +
           '</div>';
      wrap.innerHTML = h;
    }
    paint();
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.id === "mStart") {
        SFX.tick(); wrap.style.display = "none";
        window.ARCADE.clock.start();
        if (cfg.level) window.ARCADE.setLevel(cfg.level());
        if (cfg.onStart) cfg.onStart();
        return;
      }
      if (b.id === "mTeach") { SFX.tick(); window.ARCADE.teach(cfg.lesson); return; }
      if (b.id === "mBack") { SFX.tick(); if (!ctl("exit")) history.back(); return; }
      var seg = b.closest("[data-opt]"); if (!seg) return;
      var o = opts[+seg.dataset.opt];
      SFX.tick(); o.onPick(b.dataset.v); paint();
    });
    // HOW TO PLAY in the side panel opens the same lesson, from anywhere
    var side = document.getElementById("howto");
    if (side) side.onclick = function () { window.ARCADE.teach(cfg.lesson); };
    // and the settings sheet's own HOW TO PLAY keeps working
    window.ARCADE.__lesson = cfg.lesson;
    return { reopen: function () { wrap.style.display = "flex"; paint(); } };
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
      if (t && t.style.display === "flex") { t.style.display = "none"; return; }
      var m = document.getElementById("menuWrap");
      if (m && m.style.display !== "none") { if (!ctl("exit")) history.back(); return; }
      if (INAPP) ctl("exit");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildBar);
  else buildBar();
})();
