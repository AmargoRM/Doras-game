// Doras Survivor — runner web basado en la mecánica de Crucitas Survivor.
// Tres carriles, obstáculos que bajan, saltos, power-ups y eventos especiales.
// Sátira ficticia: el enemigo es la comida engordadora, no las personas.
(() => {
  "use strict";

  // ---------- Configuración ----------
  const W = 540;
  const H = 960;
  const LANE_X = [140, 270, 400];
  const PATH_LEFT = 62;
  const PATH_RIGHT = 478;
  const ENT = 96; // tamaño base de colisión
  const PLAYER_Y = H * 0.77;
  const PLAYER_DRAW_H = 190;
  const BASE_SPEED = 330;
  const LEVEL_DURATION = 30;
  const BASE_OBSTACLE_INTERVAL = 1.05 * 0.65;
  const OBSTACLE_INTERVAL_VARIATION = 0.45 * 0.65;
  const MIN_OBSTACLE_INTERVAL = 0.34;
  const COLLECTIBLE_INTERVAL = 2.4;
  const COLLECTIBLE_VARIATION = 2.2;
  const JUMP_VELOCITY = ENT * 6.45;
  const JUMP_GRAVITY = ENT * 10.8;
  const JUMP_CLEARANCE = ENT * 0.30;
  const TENIS_JUMP_BOOST = 1.18;
  const LANDING_GRACE = 0.16;
  const HIT_INVULNERABLE = 0.9;
  const MAX_BARRIGA = 100;
  const FIT_APPLES_FIRST = 10;
  const FIT_APPLES_REPEAT = 15;
  const FIT_DURATION = 13;
  const PARTY_DURATION = 18;
  const PARTY_COOLDOWN = 55;
  const PARTY_INITIAL_COOLDOWN = 20;
  const TRUCK_INITIAL_DELAY = 15;
  const TRUCK_WARNING = 0.9;
  const EVENT_EXIT = 3;
  const SWIPE = 38;

  const STORAGE_BEST = "doras_best_score";
  const STORAGE_MUTE = "doras_muted";

  // ---------- Textos satíricos ----------
  const phrasesGeneral = [
    "¡Dí «ensalada»! … Más fuerte, que el combo no te escucha.",
    "La dieta empieza el lunes. Hoy es jueves. Desde 2019.",
    "Mapa dice: primero el Puente de las Papas, luego el arrepentimiento.",
    "Botas recomienda no comer nada que venga con juguete.",
    "Ese «solo una probadita» viene con 900 calorías de acompañamiento.",
    "El nutricionista vio tu historial de delivery y pidió vacaciones.",
    "«Light» significa que el empaque pesa menos.",
    "La hamburguesa dice que es de res. La res no confirma.",
    "Corré: cada paso quema 0,3 calorías. Te faltan 4 mil.",
    "Zorro Antojo anda suelto. ¡Antojo, no te lo comás!",
    "La mochila trae fruta. Nadie la abre desde marzo.",
    "El refresco tiene azúcar suficiente para endulzar un río.",
    "La pizza es un vegetal si contás la salsa de tomate.",
    "Las papas fritas también son verdura. Según las papas.",
    "El gimnasio te cobra igual aunque no vayás. Gran negocio.",
    "Cada dona es un círculo vicioso con glaseado.",
    "El combo agrandado no te pregunta: te asume.",
    "Comer sano es caro. Comer mal también, pero en cuotas.",
    "¿Quién se comió el mapa? Ah, era una tortilla.",
    "El cuerpo es un templo. El tuyo tiene buffet en la entrada.",
    "Botas jura que el brócoli no muerde.",
    "Te sigue un perro caliente. No es metáfora.",
    "El médico dijo «menos sal». Escuchaste «más salsa».",
    "Ese batido verde es verde por colorante, no por espinaca.",
    "La báscula no miente, pero tampoco ayuda."
  ];

  const levelNames = [
    "Puente de las Papas",
    "Río de Refresco",
    "Bosque de las Donas",
    "Montaña de Nachos",
    "Pantano de Queso Fundido",
    "Valle del Combo Agrandado",
    "Cueva del Antojo de Medianoche",
    "Feria de Comidas Rápidas",
    "Selva del Buffet Libre",
    "Isla del «Lunes Empiezo»"
  ];

  const levelPhrases = [
    "Mapa actualizó la ruta: ahora con más fritura.",
    "Nivel nuevo, misma tentación con otro empaque.",
    "La dificultad subió. Como el colesterol.",
    "El terreno ahora viene con papas de acompañamiento.",
    "¡Lo logramos! … Ah no, falta todo el postre.",
    "Botas pidió agua. Le trajeron horchata.",
    "Este nivel fue patrocinado por nadie, pero huele a fritura."
  ];

  const partyPhrases = [
    "Cumpleaños en la oficina: nadie conoce al cumpleañero, todos al pastel.",
    "«Solo un pedacito» dijo alguien hace tres pedacitos.",
    "El pastel tiene más pisos que el edificio.",
    "Llegó el queque de la tía. Viene con chantillí de autoridad.",
    "Cantaron «Feliz cumpleaños» y apareció otro pastel.",
    "Rechazar pastel en la oficina es causal de despido emocional.",
    "La dieta no aplica en cumpleaños. Hay uno cada día.",
    "El refresco es gratis. El arrepentimiento también.",
    "Recursos Humanos aprobó el tercer pastel del mes.",
    "Te guardaron un pedazo «para la casa». Es una trampa."
  ];

  const fitPhrases = [
    "MODO FIT: ahora todo dice «saludable» en letra grande.",
    "La barra proteica tiene más azúcar que una dona sincera.",
    "Granola: el cereal que se cree ensalada.",
    "El influencer vende batidos detox. Detoxifica tu billetera.",
    "Smoothie de 700 calorías, pero con hojita de menta.",
    "«Sin azúcar añadida»: ya venía incluida de fábrica.",
    "Comé manzanas: no tienen influencer ni código de descuento.",
    "El yogur «natural» trae tres capas de mermelada.",
    "Fit es comer bien, no tomarse fotos comiendo bien.",
    "Botas encontró una ensalada real. La tienen en un museo."
  ];

  const truckPhrases = [
    "¡FOOD TRUCK! Viene bajando sin frenos y con extra queso.",
    "El food truck no respeta carriles ni porciones.",
    "Alerta: camión de comida con sobrepeso en la vía."
  ];

  const gameOverTaglines = [
    "Mañana empiezo la dieta. Esta vez sí. (Spoiler: no.)",
    "Botas ya está buscando tenis de una talla más.",
    "Mapa recalculó la ruta… hacia la sala de espera del médico.",
    "No perdiste: ganaste peso.",
    "El combo agrandado te manda saludos.",
    "La mochila ahora pesa menos que vos.",
    "Zorro Antojo: 1 — Doras: 0.",
    "Tu nutricionista va a necesitar terapia.",
    "Al menos el refresco era «zero». Lo demás era «mil».",
    "Respirá, tomá agua, volvé a intentar. Eso sí es fit."
  ];

  // ---------- Tipos de obstáculos ----------
  // kcal: cuánto llena el Barriga-metro. jump: se puede saltar. tenis: los tenis lo cruzan.
  const OBST = {
    burger:   { emoji: "🍔", name: "Hamburguesa triple", kcal: 22, jump: true,
                hit: "Tres tortas, cuatro quesos y cero culpa… por ahora.",
                defeat: "La hamburguesa triple te dio jaque mate en tres mordidas." },
    pizza:    { emoji: "🍕", name: "Pizza 4 quesos (y 3 más)", kcal: 20, jump: true,
                hit: "Era «una tajada». Eran ocho.",
                defeat: "La pizza te convenció: «el tomate es verdura»." },
    donut:    { emoji: "🍩", name: "Dona glaseada", kcal: 15, jump: true,
                hit: "Un círculo vicioso con glaseado.",
                defeat: "Caíste en el hueco de la dona. No tiene fondo." },
    fries:    { emoji: "🍟", name: "Papas agrandadas", kcal: 18, jump: true,
                hit: "«¿Las agrando por 200 más?» Siempre decís que sí.",
                defeat: "Las papas agrandadas agrandaron otras cosas." },
    hotdog:   { emoji: "🌭", name: "Perro caliente", kcal: 18, jump: true,
                hit: "Ni es perro ni está tan caliente. Pero llena.",
                defeat: "El perro caliente te mordió primero." },
    chicharron: { emoji: "🥓", name: "Chicharrón", kcal: 24, jump: true,
                hit: "Crujiente por fuera, cardiólogo por dentro.",
                defeat: "El chicharrón se declaró ganador por fritura técnica." },
    chicken:  { emoji: "🍗", name: "Pollo frito", kcal: 18, jump: true,
                hit: "El pollo corrió más que vos en vida.",
                defeat: "El pollo frito cruzó la calle y te cruzó a vos." },
    chocolate:{ emoji: "🍫", name: "Chocolate de caja", kcal: 12, jump: true,
                hit: "«Para compartir». Nunca se compartió.",
                defeat: "El chocolate se derritió. Vos también." },
    taco:     { emoji: "🌮", name: "Taco con extra todo", kcal: 16, jump: true,
                hit: "Pediste «sin nada». Llegó con todo.",
                defeat: "El taco extra todo te dejó sin extra nada." },
    soda:     { emoji: "🥤", name: "Refresco de 3 litros", kcal: 14, jump: true,
                hit: "Azúcar líquida con burbujas de autoengaño.",
                defeat: "El refresco te ahogó en 3 litros de azúcar." },
    icecream: { emoji: "🍦", name: "Helado triple", kcal: 14, jump: true,
                hit: "Se derrite rápido, pero se queda años.",
                defeat: "El helado triple te congeló la dieta." },
    cake:     { emoji: "🎂", name: "Pastel de cumpleaños", kcal: 20, jump: true,
                hit: "Ni sabés quién cumple, pero ya comiste.",
                defeat: "El pastel te cantó «Feliz cumpleaños» y te tumbó." },
    cupcake:  { emoji: "🧁", name: "Cupcake con chantillí", kcal: 14, jump: true,
                hit: "Pequeño, tierno y calóricamente agresivo.",
                defeat: "El cupcake parecía inofensivo. Ahí está el truco." },
    oil:      { emoji: null, name: "Charco de aceite", kcal: 15, jump: true, tenis: true, ground: true,
                hit: "Aceite de freidora reciclado desde 2015.",
                defeat: "Resbalaste en aceite de freidora de quinta mano." },
    buffet:   { emoji: null, name: "Buffet libre", kcal: 34, jump: false, wide: true,
                hit: "«Libre» de pagar de más. No de comer de más.",
                defeat: "El buffet libre te cobró en kilos." },
    combo:    { emoji: null, name: "Combo agrandado", kcal: 30, jump: false,
                hit: "Combo agrandado: hamburguesa, papas, refresco y una siesta.",
                defeat: "El combo agrandado te agrandó a vos." },
    vending:  { emoji: null, name: "Máquina de snacks", kcal: 26, jump: false,
                hit: "La máquina se tragó tu moneda y vos sus galletas.",
                defeat: "La máquina de snacks te atrapó con un «solo uno más»." },
    // Comida «fit» engañosa (Modo Fit)
    proteinbar: { emoji: "🍫", tag: "FIT", name: "Barra «saludable»", kcal: 12, jump: true,
                hit: "40 g de azúcar y una foto de una hoja.",
                defeat: "La barra «saludable» tenía más azúcar que una dona sincera." },
    smoothie: { emoji: "🧋", tag: "DETOX", name: "Batido detox de 700 kcal", kcal: 14, jump: true,
                hit: "Detoxificó tu billetera, no tu cuerpo.",
                defeat: "El batido detox te intoxicó de calorías." },
    granola:  { emoji: "🥣", tag: "LIGHT", name: "Granola con miel", kcal: 11, jump: true,
                hit: "Granola: el cereal que se cree ensalada.",
                defeat: "La granola con miel te endulzó la derrota." },
    influencer: { emoji: "🤳", tag: "CÓDIGO 10%", name: "Influencer fitness", kcal: 10, jump: true,
                hit: "Te vendió un té adelgazante. Solo adelgazó tu cuenta.",
                defeat: "El influencer fitness te etiquetó en su antes y después." },
    truck:    { emoji: "🚚", name: "Food truck", kcal: 40, jump: false,
                hit: "Te atropelló el menú completo del food truck.",
                defeat: "El food truck te sirvió de todo, hasta el game over." }
  };

  const NORMAL_POOL = ["burger", "pizza", "donut", "fries", "hotdog", "chicharron", "chicken",
    "chocolate", "taco", "soda", "icecream", "oil", "oil", "buffet", "combo", "vending"];
  const PARTY_POOL = ["cake", "cake", "cupcake", "cupcake", "soda", "icecream", "chocolate", "buffet"];
  const FIT_POOL = ["proteinbar", "smoothie", "granola", "influencer", "influencer", "oil"];

  const ITEMS = {
    apple:   { emoji: "🍎", name: "Manzana" },
    water:   { emoji: "💧", name: "Agua" },
    tenis:   { emoji: "👟", name: "Tenis" },
    broccoli:{ emoji: "🥦", name: "Brócoli" },
    salad:   { emoji: "🥗", name: "Ensalada" }
  };

  // ---------- Canvas ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let scale = 1;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    const cssW = Math.floor(W * scale);
    const cssH = Math.floor(H * scale);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    emojiCache.clear();
  }

  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  const emojiCache = new Map();
  function emojiSprite(ch, size) {
    const key = ch + "|" + size;
    let c = emojiCache.get(key);
    if (c) return c;
    const px = Math.ceil(size * 1.3 * scale * dpr);
    c = document.createElement("canvas");
    c.width = px;
    c.height = px;
    const g = c.getContext("2d");
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = Math.floor(size * scale * dpr) + "px " + EMOJI_FONT;
    g.fillText(ch, px / 2, px / 2 + px * 0.04);
    emojiCache.set(key, c);
    return c;
  }
  function drawEmoji(ch, x, y, size, alpha = 1) {
    const s = emojiSprite(ch, size);
    const d = size * 1.3;
    ctx.globalAlpha = alpha;
    ctx.drawImage(s, x - d / 2, y - d / 2, d, d);
    ctx.globalAlpha = 1;
  }

  const doraImg = new Image();
  let doraReady = false;
  doraImg.onload = () => { doraReady = true; };
  doraImg.src = "assets/doras.webp";

  // ---------- Audio (sintetizado, sin archivos) ----------
  const audio = {
    ctx: null,
    muted: readStorage(STORAGE_MUTE) === "1",
    musicTimer: null,
    step: 0,
    tempo: 1,
    ensure() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { this.ctx = null; }
    },
    tone(freq, dur, type = "square", vol = 0.06, when = 0, slide = 0) {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime + when;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    jump() { this.tone(330, 0.16, "square", 0.05, 0, 420); },
    collect() { this.tone(880, 0.08, "triangle", 0.08); this.tone(1320, 0.12, "triangle", 0.07, 0.07); },
    hit() { this.tone(160, 0.28, "sawtooth", 0.08, 0, -90); },
    level() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, "triangle", 0.07, i * 0.09)); },
    warn() { this.tone(740, 0.12, "square", 0.06); this.tone(740, 0.12, "square", 0.06, 0.2); },
    over() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, "triangle", 0.08, i * 0.18)); },
    startMusic() {
      this.stopMusic();
      if (!this.ctx) return;
      this.step = 0;
      const melody = [523, 0, 659, 0, 784, 659, 523, 0, 587, 0, 698, 0, 880, 698, 587, 0,
                      659, 0, 784, 0, 988, 784, 659, 0, 587, 659, 698, 784, 659, 0, 523, 0];
      const bass = [131, 131, 196, 196, 147, 147, 220, 220];
      const tick = () => {
        if (state.screen === "playing" && !this.muted && this.ctx) {
          const n = melody[this.step % melody.length];
          if (n) this.tone(n, 0.11, "triangle", 0.025);
          if (this.step % 4 === 0) this.tone(bass[(this.step / 4) % bass.length], 0.22, "sine", 0.05);
          this.step++;
        }
        this.musicTimer = setTimeout(tick, 150 / this.tempo);
      };
      tick();
    },
    stopMusic() {
      if (this.musicTimer) clearTimeout(this.musicTimer);
      this.musicTimer = null;
    },
    toggleMute() {
      this.muted = !this.muted;
      writeStorage(STORAGE_MUTE, this.muted ? "1" : "0");
    }
  };

  function readStorage(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function writeStorage(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }

  // ---------- Estado ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffled = (arr) => arr.slice().sort(() => Math.random() - 0.5);

  const state = {
    screen: "menu", // menu | howto | playing | paused | gameover
    best: parseInt(readStorage(STORAGE_BEST) || "0", 10) || 0,
    newRecord: false,
    defeat: "",
    tagline: ""
  };

  const player = {
    lane: 1, x: LANE_X[1], targetX: LANE_X[1],
    jumping: false, jumpV: 0, jumpH: 0, landing: 0,
    anim: 0, invul: 0, squash: 0,
    shield: false, waterTime: 0, tenisTime: 0
  };

  let g = {};
  let obstacles = [];
  let items = [];
  let particles = [];
  let scroll = 0;

  function resetGame() {
    obstacles = [];
    items = [];
    particles = [];
    Object.assign(player, {
      lane: 1, x: LANE_X[1], targetX: LANE_X[1],
      jumping: false, jumpV: 0, jumpH: 0, landing: 0,
      anim: 0, invul: 0, squash: 0,
      shield: false, waterTime: 0, tenisTime: 0
    });
    g = {
      time: 0,
      difficulty: 1,
      level: 1,
      speed: BASE_SPEED,
      score: 0,
      passive: 0,
      bonus: 0,
      barriga: 0,
      apples: 0,
      nextFitAt: FIT_APPLES_FIRST,
      obstacleTimer: 0.8,
      itemTimer: 1.6,
      phrase: pick(phrasesGeneral),
      phraseTimer: 5,
      levelMsg: "",
      levelMsgTimer: 0,
      powerMsg: "",
      powerMsgTimer: 0,
      fit: false, fitTimer: 0, fitEnding: 0,
      party: false, partyTimer: 0, partyEnding: 0, partyCooldown: PARTY_INITIAL_COOLDOWN,
      bannerMsg: "", bannerTimer: 0, bannerColor: "#d6336c",
      pendingFit: false,
      truck: { active: false, charging: false, lane: 1, y: 0, speed: 0, warn: 0, next: TRUCK_INITIAL_DELAY },
      flash: 0
    };
  }

  function startGame() {
    audio.ensure();
    if (audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
    resetGame();
    state.screen = "playing";
    state.newRecord = false;
    audio.tempo = 1;
    audio.startMusic();
  }

  // ---------- Jugador ----------
  function moveLeft() { setLane(player.lane - 1); }
  function moveRight() { setLane(player.lane + 1); }
  function setLane(l) {
    player.lane = Math.max(0, Math.min(2, l));
    player.targetX = LANE_X[player.lane];
  }
  function jump() {
    if (player.jumping) return;
    player.jumping = true;
    player.landing = 0;
    player.jumpV = JUMP_VELOCITY * (player.tenisTime > 0 ? TENIS_JUMP_BOOST : 1);
    player.jumpH = ENT * 0.1;
    audio.jump();
  }
  function updatePlayer(dt) {
    player.anim += dt;
    if (player.jumping) {
      player.jumpH += player.jumpV * dt;
      player.jumpV -= JUMP_GRAVITY * dt;
      if (player.jumpH <= 0 && player.jumpV < 0) {
        player.jumpH = 0;
        player.jumpV = 0;
        player.jumping = false;
        player.landing = LANDING_GRACE;
        player.squash = 0.18;
      }
    } else {
      player.landing = Math.max(0, player.landing - dt);
    }
    player.squash = Math.max(0, player.squash - dt);
    player.invul = Math.max(0, player.invul - dt);
    player.waterTime = Math.max(0, player.waterTime - dt);
    player.tenisTime = Math.max(0, player.tenisTime - dt);
    const d = player.targetX - player.x;
    player.x = Math.abs(d) < 1 ? player.targetX : player.x + d * Math.min(1, 14 * dt);
  }
  function playerBounds() {
    return { l: player.x - ENT * 0.28, t: PLAYER_Y - ENT * 0.42, r: player.x + ENT * 0.28, b: PLAYER_Y + ENT * 0.40 };
  }

  // ---------- Obstáculos / ítems ----------
  function obstacleBounds(o) {
    const def = OBST[o.type];
    const hw = ENT * (def.wide ? 0.46 : o.type === "truck" ? 0.42 : def.ground ? 0.40 : 0.30);
    const hh = ENT * (o.type === "truck" ? 0.5 : def.jump ? 0.30 : 0.38);
    return { l: LANE_X[o.lane] - hw, t: o.y - hh, r: LANE_X[o.lane] + hw, b: o.y + hh };
  }
  function itemBounds(it) {
    return { l: LANE_X[it.lane] - ENT * 0.28, t: it.y - ENT * 0.28, r: LANE_X[it.lane] + ENT * 0.28, b: it.y + ENT * 0.28 };
  }
  const overlap = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

  function spawnClear(lane, y, sameLaneGap) {
    const near = (ly, l) => Math.abs(LANE_X[l] - LANE_X[lane]) < ENT * 1.2 &&
      Math.abs(ly - y) < (l === lane ? sameLaneGap : ENT * 2.8);
    return !obstacles.some((o) => near(o.y, o.lane)) && !items.some((i) => near(i.y, i.lane));
  }
  function fairObstacleLane(y) {
    // Nunca dos obstáculos en la misma franja: siempre queda una salida.
    if (obstacles.some((o) => Math.abs(o.y - y) < ENT * 2.6)) return null;
    return shuffled([0, 1, 2]).find((l) => spawnClear(l, y, ENT * 4.6)) ?? null;
  }
  function fairItemLane(y) {
    return shuffled([0, 1, 2]).find((l) => spawnClear(l, y, ENT * 5.2)) ?? null;
  }

  function spawnObstacle() {
    const pool = g.fit ? FIT_POOL : g.party ? PARTY_POOL : NORMAL_POOL;
    const y = -ENT * 1.4;
    const lane = fairObstacleLane(y);
    if (lane === null) return;
    obstacles.push({ type: pick(pool), lane, y, seed: Math.random() * 10, cleared: false });
  }

  function spawnItem() {
    const r = Math.random();
    let type;
    if (g.fit) type = r < 0.7 ? "apple" : r < 0.85 ? "water" : "salad";
    else if (r < 0.32) type = "apple";
    else if (r < 0.46) type = "water";
    else if (r < 0.58) type = "tenis";
    else if (r < 0.70) type = "broccoli";
    else if (r < 0.75) type = "salad";
    else return;
    const y = -ENT * 2.2;
    const lane = fairItemLane(y);
    if (lane === null) return;
    items.push({ type, lane, y, seed: Math.random() * 10 });
  }

  // ---------- Mensajes ----------
  function powerMsg(t) { g.powerMsg = t; g.powerMsgTimer = 1.8; }
  function phrase(t, secs = 4) { g.phrase = t; g.phraseTimer = secs; }
  function banner(t, color) { g.bannerMsg = t; g.bannerTimer = 1.6; g.bannerColor = color; }

  function burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(90, 260);
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: rand(0.4, 0.8), max: 0.8, color });
    }
  }

  // ---------- Colisiones ----------
  function addBarriga(amount, def) {
    g.barriga = Math.min(MAX_BARRIGA, g.barriga + amount);
    player.invul = HIT_INVULNERABLE;
    player.squash = 0.3;
    g.flash = 0.25;
    audio.hit();
    if (g.barriga >= MAX_BARRIGA) {
      endGame(def.defeat);
    } else {
      powerMsg("+" + amount + " Barriga-metro");
      phrase(def.hit, 3.2);
    }
  }

  function checkCollisions() {
    const pb = playerBounds();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.cleared) continue;
      if (!overlap(pb, obstacleBounds(o))) continue;
      const def = OBST[o.type];
      if (def.jump && player.jumpH >= JUMP_CLEARANCE) {
        o.cleared = true;
        g.bonus += 20;
        continue;
      }
      if (player.invul > 0) continue;
      if (player.tenisTime > 0 && def.tenis) {
        obstacles.splice(i, 1);
        powerMsg("Los tenis cruzaron el aceite");
        continue;
      }
      if (player.shield) {
        player.shield = false;
        obstacles.splice(i, 1);
        burst(LANE_X[o.lane], o.y, "#3fa34d");
        powerMsg("El brócoli se sacrificó por vos");
        phrase("El brócoli: el único amigo que no te ofrece postre.", 3);
        continue;
      }
      obstacles.splice(i, 1);
      burst(LANE_X[o.lane], o.y, "#f59f00");
      addBarriga(def.kcal, def);
      if (state.screen !== "playing") return;
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (!overlap(pb, itemBounds(it))) continue;
      items.splice(i, 1);
      applyItem(it);
    }
  }

  function applyItem(it) {
    audio.collect();
    burst(LANE_X[it.lane], it.y, "#8ce99a", 8);
    switch (it.type) {
      case "apple": {
        const mult = g.fit ? 2 : 1;
        g.apples += 1;
        g.bonus += 150 * mult;
        g.barriga = Math.max(0, g.barriga - 4);
        powerMsg(g.fit ? "+2 manzanas fit" : "+1 manzana");
        if (g.apples >= g.nextFitAt) requestFit();
        break;
      }
      case "water":
        player.waterTime = 6;
        g.barriga = Math.max(0, g.barriga - 8);
        g.bonus += 50;
        powerMsg("Agua: todo va más lento y vos más liviano");
        phrase("Agua: la bebida que nadie publicita porque es gratis.", 3);
        break;
      case "tenis":
        player.tenisTime = 8;
        g.bonus += 75;
        powerMsg("¡Tenis! Saltás más y cruzás aceite");
        break;
      case "broccoli":
        player.shield = true;
        g.bonus += 75;
        powerMsg("Escudo de brócoli activado");
        break;
      case "salad":
        g.barriga = Math.max(0, g.barriga - 20);
        g.bonus += 200;
        powerMsg("¡Ensalada real! −20 barriga");
        phrase("Una ensalada de verdad. Mapa la marcó como sitio arqueológico.", 3);
        break;
    }
  }

  // ---------- Eventos especiales ----------
  const eventBusy = () => g.fit || g.party || g.fitEnding > 0 || g.partyEnding > 0;

  function requestFit() {
    g.nextFitAt += FIT_APPLES_REPEAT;
    if (eventBusy()) g.pendingFit = true;
    else startFit();
  }
  function startFit() {
    cancelTruck();
    g.fit = true;
    g.fitTimer = FIT_DURATION;
    banner("MODO FIT: comida «saludable» por " + FIT_DURATION + " s", "#2b8a3e");
    phrase(pick(fitPhrases), 3);
    audio.level();
  }
  function startParty() {
    cancelTruck();
    g.party = true;
    g.partyTimer = PARTY_DURATION;
    g.partyCooldown = PARTY_COOLDOWN;
    banner("CUMPLEAÑOS EN LA OFICINA", "#d6336c");
    phrase(pick(partyPhrases), 3);
    audio.level();
  }
  function updateEvents(dt) {
    if (g.fit) {
      g.fitTimer -= dt;
      g.barriga = Math.max(0, g.barriga - 1.5 * dt);
      if (g.fitTimer <= 0) {
        g.fit = false;
        g.fitEnding = EVENT_EXIT;
        phrase("Se acabó el Modo Fit. El influencer ya cobró.", EVENT_EXIT);
      }
    }
    if (g.party) {
      g.partyTimer -= dt;
      if (g.partyTimer <= 0) {
        g.party = false;
        g.partyEnding = EVENT_EXIT;
        phrase("Se acabó la fiesta. Quedó pastel «para mañana».", EVENT_EXIT);
      }
    }
    if (g.fitEnding > 0) g.fitEnding = Math.max(0, g.fitEnding - dt);
    if (g.partyEnding > 0) g.partyEnding = Math.max(0, g.partyEnding - dt);
    g.partyCooldown = Math.max(0, g.partyCooldown - dt);
    if (g.pendingFit && !eventBusy()) {
      g.pendingFit = false;
      startFit();
    }
  }

  function cancelTruck() {
    const t = g.truck;
    if (!t.active) return;
    t.active = false;
    t.charging = false;
    t.next = rand(20, 35);
  }
  function updateTruck(dt, effSpeed) {
    const t = g.truck;
    if (t.active) {
      if (!t.charging) {
        t.warn -= dt;
        if (t.warn <= 0) {
          t.charging = true;
          t.y = -ENT * 1.5;
        }
      } else {
        t.y += t.speed * dt;
        if (!t.hit && player.invul <= 0) {
          const tb = obstacleBounds({ type: "truck", lane: t.lane, y: t.y });
          if (overlap(playerBounds(), tb)) {
            t.hit = true;
            if (player.shield) {
              player.shield = false;
              g.bonus += 90;
              powerMsg("El brócoli frenó al food truck");
            } else {
              addBarriga(OBST.truck.kcal, OBST.truck);
              if (state.screen !== "playing") return;
            }
          }
        }
        if (t.y > H + ENT * 2) {
          if (!t.hit) {
            g.bonus += 180;
            powerMsg("¡Esquivaste el food truck! +180");
            phrase("El food truck siguió de largo. Tu arteria te lo agradece.", 2.5);
          }
          t.active = false;
          t.charging = false;
          t.next = rand(20, 35);
        }
      }
      return;
    }
    t.next -= dt;
    if (t.next > 0 || g.time < TRUCK_INITIAL_DELAY) return;
    if (eventBusy() || obstacles.length >= 5) { t.next = 3; return; }
    if (Math.random() > 0.55) { t.next = rand(20, 35); return; }
    const lane = shuffled([0, 1, 2]).find((l) => !obstacles.some((o) => o.lane === l && o.y < ENT * 4)) ?? null;
    if (lane === null) { t.next = 3; return; }
    Object.assign(t, { active: true, charging: false, lane, y: -ENT * 1.5, warn: TRUCK_WARNING, hit: false,
      speed: Math.min(effSpeed * 2.2, 1000) });
    phrase(pick(truckPhrases), TRUCK_WARNING + 1.5);
    audio.warn();
  }

  // ---------- Bucle de juego ----------
  function update(dt) {
    g.time += dt;
    g.difficulty = 1 + g.time * 0.0065 + g.time * g.time * 0.000012;
    const lvl = 1 + Math.floor(g.time / LEVEL_DURATION);
    if (lvl > g.level) {
      g.level = lvl;
      g.levelMsg = "NIVEL " + lvl + ": " + levelNames[(lvl - 1) % levelNames.length];
      g.levelMsgTimer = 2;
      g.bonus += 100;
      phrase(pick(levelPhrases), 3);
      audio.level();
      if (!eventBusy() && g.partyCooldown <= 0 && (lvl % 2 === 0 || Math.random() < 0.45)) startParty();
    }

    const eventMult = g.fit ? 1.08 : g.party ? 1.06 :
      g.fitEnding > 0 ? 1 + 0.08 * (g.fitEnding / EVENT_EXIT) :
      g.partyEnding > 0 ? 1 + 0.06 * (g.partyEnding / EVENT_EXIT) : 1;
    g.speed = BASE_SPEED * g.difficulty * eventMult;
    const eff = player.waterTime > 0 ? g.speed * 0.8 : g.speed;
    audio.tempo = Math.min(1.25, 1 + g.time / 300);

    updatePlayer(dt);
    updateEvents(dt);
    updateTruck(dt, eff);
    if (state.screen !== "playing") return;

    g.obstacleTimer -= dt;
    if (g.obstacleTimer <= 0) {
      spawnObstacle();
      const pressure = 1 + (g.level - 1) * 0.055;
      const base = BASE_OBSTACLE_INTERVAL + Math.random() * OBSTACLE_INTERVAL_VARIATION;
      g.obstacleTimer = Math.max(base / (g.difficulty * pressure) * (g.fit ? 1.35 : 1), MIN_OBSTACLE_INTERVAL);
    }
    g.itemTimer -= dt;
    if (g.itemTimer <= 0) {
      spawnItem();
      g.itemTimer = (COLLECTIBLE_INTERVAL + Math.random() * COLLECTIBLE_VARIATION) * (g.fit ? 0.45 : 1);
    }

    scroll += eff * dt;
    for (const o of obstacles) o.y += eff * dt;
    for (const it of items) it.y += eff * dt;
    obstacles = obstacles.filter((o) => o.y < H + ENT * 2);
    items = items.filter((it) => it.y < H + ENT * 2);

    checkCollisions();
    if (state.screen !== "playing") return;

    g.passive += dt * 10 * (g.fit ? 2 : 1);
    g.score = Math.floor(g.passive) + g.bonus;

    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);

    g.powerMsgTimer = Math.max(0, g.powerMsgTimer - dt);
    g.levelMsgTimer = Math.max(0, g.levelMsgTimer - dt);
    g.bannerTimer = Math.max(0, g.bannerTimer - dt);
    g.flash = Math.max(0, g.flash - dt);
    g.phraseTimer -= dt;
    if (g.phraseTimer <= 0) {
      phrase(g.fit ? pick(fitPhrases) : g.party ? pick(partyPhrases) : pick(phrasesGeneral),
        g.fit || g.party ? 3.2 : 5);
    }
  }

  function endGame(defeat) {
    state.screen = "gameover";
    state.defeat = defeat;
    state.tagline = pick(gameOverTaglines);
    g.score = Math.floor(g.passive) + g.bonus;
    if (g.score > state.best) {
      state.best = g.score;
      state.newRecord = true;
      writeStorage(STORAGE_BEST, String(state.best));
    }
    audio.stopMusic();
    audio.over();
  }

  function pause() {
    if (state.screen !== "playing") return;
    state.screen = "paused";
  }

  // ---------- Dibujo: helpers ----------
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrap(text, maxW) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function text(t, x, y, size, color = "#fff", align = "center", weight = "bold", stroke = null) {
    ctx.font = weight + " " + size + "px 'Trebuchet MS','Segoe UI',system-ui,sans-serif";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    if (stroke) {
      ctx.lineWidth = Math.max(3, size / 6);
      ctx.strokeStyle = stroke;
      ctx.lineJoin = "round";
      ctx.strokeText(t, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(t, x, y);
  }
  function wrappedText(t, x, y, maxW, size, color, lineH = size * 1.25, weight = "bold") {
    ctx.font = weight + " " + size + "px 'Trebuchet MS','Segoe UI',system-ui,sans-serif";
    const lines = wrap(t, maxW);
    lines.forEach((l, i) => text(l, x, y + i * lineH, size, color, "center", weight));
    return lines.length * lineH;
  }

  // ---------- Botones ----------
  const buttons = {
    play: { x: 130, y: 760, w: 280, h: 74, label: "¡Vámonos!" },
    how: { x: 150, y: 848, w: 240, h: 56, label: "Cómo jugar" },
    mute: { x: 470, y: 18, w: 54, h: 54, label: "" },
    back: { x: 60, y: 850, w: 190, h: 62, label: "Volver" },
    howPlay: { x: 290, y: 850, w: 190, h: 62, label: "Jugar" },
    pauseBtn: { x: 474, y: 16, w: 50, h: 50, label: "II" },
    resume: { x: 150, y: 430, w: 240, h: 66, label: "Seguir" },
    restart: { x: 150, y: 514, w: 240, h: 60, label: "Reiniciar" },
    toMenu: { x: 150, y: 592, w: 240, h: 60, label: "Menú" },
    retry: { x: 110, y: 744, w: 320, h: 70, label: "Intentar de nuevo" },
    overMenu: { x: 170, y: 826, w: 200, h: 58, label: "Menú" },
    left: { x: 16, y: 872, w: 150, h: 74, label: "◀" },
    jumpB: { x: 195, y: 872, w: 150, h: 74, label: "⤒ Saltar" },
    right: { x: 374, y: 872, w: 150, h: 74, label: "▶" }
  };
  const inBtn = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

  function drawButton(b, primary = true, size = 28) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    rr(b.x, b.y, b.w, b.h, b.h / 2);
    ctx.fillStyle = primary ? "#ffb703" : "#fff8e7";
    ctx.fill();
    ctx.restore();
    rr(b.x, b.y, b.w, b.h, b.h / 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = primary ? "#9c4a00" : "#7048a8";
    ctx.stroke();
    text(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, size, primary ? "#5b2a00" : "#4b2a7a");
  }

  // ---------- Dibujo: escenario ----------
  const sideDecor = ["🌴", "🌳", "🌿", "🦜", "🌺", "🍌", "🦋", "🌴"];
  function drawWorld(time) {
    // Selva lateral
    const grass = g.fit ? "#5cc77a" : g.party ? "#4aa864" : "#2d8a4e";
    ctx.fillStyle = grass;
    ctx.fillRect(0, 0, W, H);
    // Camino
    const pathGrad = ctx.createLinearGradient(PATH_LEFT, 0, PATH_RIGHT, 0);
    pathGrad.addColorStop(0, "#c99a5b");
    pathGrad.addColorStop(0.5, "#e2b97a");
    pathGrad.addColorStop(1, "#c99a5b");
    ctx.fillStyle = pathGrad;
    ctx.fillRect(PATH_LEFT, 0, PATH_RIGHT - PATH_LEFT, H);
    ctx.fillStyle = "rgba(90,55,20,.35)";
    ctx.fillRect(PATH_LEFT - 6, 0, 6, H);
    ctx.fillRect(PATH_RIGHT, 0, 6, H);
    // Líneas de carril
    ctx.strokeStyle = "rgba(255,248,231,.55)";
    ctx.lineWidth = 5;
    ctx.setLineDash([34, 30]);
    ctx.lineDashOffset = -(scroll % 64);
    for (const x of [205, 335]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // Piedritas del camino
    ctx.fillStyle = "rgba(120,80,40,.25)";
    for (let i = 0; i < 14; i++) {
      const y = ((i * 97 + scroll) % (H + 40)) - 20;
      const x = PATH_LEFT + 20 + ((i * 131) % (PATH_RIGHT - PATH_LEFT - 40));
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Decoración lateral
    for (let i = 0; i < 9; i++) {
      const y = ((i * 128 + scroll * 1.0) % (H + 128)) - 64;
      drawEmoji(sideDecor[i % sideDecor.length], 30, y, 44);
      drawEmoji(sideDecor[(i + 3) % sideDecor.length], W - 30, y + 64, 44);
    }
    if (g.party) {
      // Banderines de cumpleaños
      const colors = ["#ff6b6b", "#ffd43b", "#4dabf7", "#b197fc", "#63e6be"];
      for (let i = 0; i < 12; i++) {
        const y = ((i * 90 + scroll) % (H + 90)) - 45;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(PATH_LEFT - 4, y);
        ctx.lineTo(PATH_LEFT + 14, y + 10);
        ctx.lineTo(PATH_LEFT - 4, y + 20);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(PATH_RIGHT + 4, y + 45);
        ctx.lineTo(PATH_RIGHT - 14, y + 55);
        ctx.lineTo(PATH_RIGHT + 4, y + 65);
        ctx.fill();
      }
    }
    if (g.fit) {
      ctx.fillStyle = "rgba(180,255,200,.12)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawObstacle(o, time) {
    const def = OBST[o.type];
    const x = LANE_X[o.lane];
    const y = o.y + (o.type === "influencer" ? Math.sin(time * 6 + o.seed) * 4 : 0);
    // sombra
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.beginPath();
    ctx.ellipse(x, o.y + ENT * 0.36, ENT * (def.wide ? 0.5 : 0.34), ENT * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    if (o.type === "oil") {
      const grad = ctx.createRadialGradient(x - 10, y - 6, 4, x, y, ENT * 0.45);
      grad.addColorStop(0, "#fff3a3");
      grad.addColorStop(0.5, "#e8b923");
      grad.addColorStop(1, "#a86f0a");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, ENT * 0.44, ENT * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.beginPath();
      ctx.ellipse(x - 14, y - 6, 10, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      drawEmoji("🍟", x + 22, y - 4, 26);
    } else if (o.type === "buffet") {
      rr(x - ENT * 0.55, y - ENT * 0.18, ENT * 1.1, ENT * 0.5, 10);
      ctx.fillStyle = "#c92a2a";
      ctx.fill();
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 6; i++) ctx.fillRect(x - ENT * 0.55 + i * ENT * 0.2, y - ENT * 0.18, ENT * 0.1, ENT * 0.5);
      drawEmoji("🍝", x - 32, y - 18, 40);
      drawEmoji("🍗", x + 2, y - 26, 40);
      drawEmoji("🍰", x + 34, y - 16, 38);
    } else if (o.type === "combo") {
      drawEmoji("🥤", x - 30, y - 6, 46);
      drawEmoji("🍔", x + 6, y + 6, 54);
      drawEmoji("🍟", x + 34, y - 16, 40);
    } else if (o.type === "vending") {
      rr(x - 34, y - 52, 68, 100, 8);
      ctx.fillStyle = "#364fc7";
      ctx.fill();
      rr(x - 26, y - 44, 40, 70, 4);
      ctx.fillStyle = "#d0ebff";
      ctx.fill();
      const snack = ["#f03e3e", "#fab005", "#7950f2", "#e8590c"];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        ctx.fillStyle = snack[(r + c) % snack.length];
        ctx.fillRect(x - 22 + c * 12, y - 40 + r * 17, 9, 12);
      }
      ctx.fillStyle = "#ffd43b";
      ctx.fillRect(x + 18, y - 30, 8, 16);
      ctx.fillStyle = "#212529";
      ctx.fillRect(x - 26, y + 32, 52, 10);
    } else {
      drawEmoji(def.emoji, x, y, 66);
    }
    if (def.tag) {
      ctx.font = "bold 14px 'Trebuchet MS',sans-serif";
      const tw = ctx.measureText(def.tag).width + 14;
      rr(x - tw / 2, y - ENT * 0.62, tw, 22, 11);
      ctx.fillStyle = "#2b8a3e";
      ctx.fill();
      text(def.tag, x, y - ENT * 0.62 + 11, 14, "#fff");
    }
    // Etiqueta del nombre
    ctx.font = "bold 13px 'Trebuchet MS',sans-serif";
    const tw = Math.min(150, ctx.measureText(def.name).width + 12);
    rr(x - tw / 2, y + ENT * 0.38, tw, 20, 10);
    ctx.fillStyle = def.jump ? "rgba(0,0,0,.55)" : "rgba(201,42,42,.85)";
    ctx.fill();
    text(def.name, x, y + ENT * 0.38 + 10, 13, "#fff");
  }

  function drawItem(it, time) {
    const x = LANE_X[it.lane];
    const y = it.y + Math.sin(time * 5 + it.seed) * 5;
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath();
    ctx.arc(x, y, 34 + Math.sin(time * 6 + it.seed) * 3, 0, Math.PI * 2);
    ctx.fill();
    drawEmoji(ITEMS[it.type].emoji, x, y, 52);
  }

  function drawTruck(time) {
    const t = g.truck;
    if (!t.active) return;
    const x = LANE_X[t.lane];
    if (!t.charging) {
      const on = Math.floor(time * 8) % 2 === 0;
      ctx.fillStyle = on ? "rgba(255,59,48,.35)" : "rgba(255,59,48,.15)";
      ctx.fillRect(x - 64, 0, 128, H);
      rr(x - 74, 150, 148, 70, 14);
      ctx.fillStyle = "#c92a2a";
      ctx.fill();
      text("⚠ FOOD", x, 172, 22, "#fff");
      text("TRUCK", x, 198, 22, "#fff");
      return;
    }
    ctx.save();
    ctx.translate(x, t.y);
    ctx.rotate(Math.PI / 2);
    ctx.scale(-1, 1);
    drawEmoji("🚚", 0, 0, 120);
    ctx.restore();
    ctx.font = "bold 14px 'Trebuchet MS',sans-serif";
    rr(x - 52, t.y - 86, 104, 22, 11);
    ctx.fillStyle = "#c92a2a";
    ctx.fill();
    text("Food truck", x, t.y - 75, 14, "#fff");
  }

  function drawPlayer(time) {
    const jumpH = player.jumpH;
    const y = PLAYER_Y - jumpH + Math.sin(player.anim * 11) * 3;
    // sombra
    const sh = Math.max(0.35, 1 - jumpH / 260);
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(player.x, PLAYER_Y + 78, 52 * sh * (1 + g.barriga / 220), 13 * sh, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.invul > 0 && Math.floor(time * 16) % 2 === 0) return;

    // La barriga se nota: el sprite se ensancha con el Barriga-metro.
    const wide = 1 + (g.barriga / MAX_BARRIGA) * 0.55;
    const squash = player.squash > 0 ? Math.sin((player.squash / 0.3) * Math.PI) * 0.12 : 0;
    const air = 1 + Math.min(0.12, jumpH / 1600);
    const h = PLAYER_DRAW_H * air * (1 - squash);
    const w = (PLAYER_DRAW_H * (354 / 490)) * air * wide * (1 + squash);
    const tilt = (player.targetX - player.x) / 400;

    if (player.shield) {
      ctx.strokeStyle = "rgba(64,192,87,.85)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(player.x, y - 4, w * 0.62, h * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();
      drawEmoji("🥦", player.x + w * 0.5, y - h * 0.45, 30);
    }
    if (player.tenisTime > 0) {
      ctx.fillStyle = "rgba(77,171,247,.25)";
      ctx.beginPath();
      ctx.ellipse(player.x, y + h * 0.4, w * 0.45, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(player.x, y);
    ctx.rotate(tilt);
    if (doraReady) {
      ctx.drawImage(doraImg, -w / 2, -h * 0.58, w, h);
    } else {
      drawEmoji("🎒", 0, 0, 90);
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- HUD ----------
  function drawHud(time) {
    // Barra superior
    rr(12, 12, 450, 64, 18);
    ctx.fillStyle = "rgba(25,20,40,.72)";
    ctx.fill();
    text(String(g.score), 30, 34, 26, "#ffd43b", "left");
    text("Récord " + Math.max(state.best, g.score), 30, 60, 15, "#e9ecef", "left", "normal");
    text("Nivel " + g.level, 175, 34, 20, "#fff", "left");
    text("🍎 " + g.apples, 175, 60, 16, "#fff", "left", "normal");

    // Barriga-metro
    const bx = 262, by = 24, bw = 188, bh = 18;
    text("Barriga-metro", bx, by - 2 + 0, 13, "#ffe8cc", "left");
    rr(bx, by + 10, bw, bh, 9);
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fill();
    const pct = g.barriga / MAX_BARRIGA;
    if (pct > 0) {
      rr(bx, by + 10, Math.max(bh, bw * pct), bh, 9);
      ctx.fillStyle = pct < 0.5 ? "#69db7c" : pct < 0.8 ? "#ffa94d" : "#ff6b6b";
      ctx.fill();
    }
    text(Math.round(g.barriga) + "%", bx + bw / 2, by + 19, 13, "#fff");
    if (pct >= 0.8 && Math.floor(time * 4) % 2 === 0) text("¡Ojo!", bx + bw - 4, by + 42, 13, "#ffc9c9", "right");

    // Pausa
    const p = buttons.pauseBtn;
    rr(p.x, p.y, p.w, p.h, 14);
    ctx.fillStyle = "rgba(25,20,40,.72)";
    ctx.fill();
    text("II", p.x + p.w / 2, p.y + p.h / 2 + 1, 22, "#fff");

    // Power-ups activos
    let px = 18;
    const chips = [];
    if (player.shield) chips.push(["🥦", "Escudo"]);
    if (player.waterTime > 0) chips.push(["💧", player.waterTime.toFixed(1) + "s"]);
    if (player.tenisTime > 0) chips.push(["👟", player.tenisTime.toFixed(1) + "s"]);
    if (g.fit) chips.push(["💪", "Fit " + Math.ceil(g.fitTimer) + "s"]);
    if (g.party) chips.push(["🎂", "Fiesta " + Math.ceil(g.partyTimer) + "s"]);
    for (const [e, label] of chips) {
      ctx.font = "bold 15px 'Trebuchet MS',sans-serif";
      const w = ctx.measureText(label).width + 46;
      rr(px, 84, w, 30, 15);
      ctx.fillStyle = "rgba(25,20,40,.65)";
      ctx.fill();
      drawEmoji(e, px + 17, 99, 20);
      text(label, px + 32, 100, 15, "#fff", "left");
      px += w + 6;
    }

    // Frase satírica
    ctx.font = "bold 17px 'Trebuchet MS',sans-serif";
    const lines = wrap(g.phrase, 430);
    const ph = lines.length * 22 + 16;
    const py = 122;
    rr(40, py, 460, ph, 14);
    ctx.fillStyle = "rgba(255,248,231,.92)";
    ctx.fill();
    ctx.strokeStyle = "#7048a8";
    ctx.lineWidth = 3;
    ctx.stroke();
    lines.forEach((l, i) => text(l, W / 2, py + 19 + i * 22, 17, "#3b1f63"));

    // Banner de nivel / evento
    if (g.levelMsgTimer > 0) {
      rr(30, 330, 480, 60, 16);
      ctx.fillStyle = "rgba(112,72,168,.92)";
      ctx.fill();
      text("🗺️ " + g.levelMsg, W / 2, 361, 22, "#fff");
    } else if (g.bannerTimer > 0) {
      rr(30, 330, 480, 60, 16);
      ctx.fillStyle = g.bannerColor;
      ctx.fill();
      text(g.bannerMsg, W / 2, 361, 20, "#fff");
    }
    if (g.powerMsgTimer > 0) {
      ctx.globalAlpha = Math.min(1, g.powerMsgTimer * 2);
      text(g.powerMsg, W / 2, 430, 24, "#fff", "center", "bold", "rgba(30,20,50,.85)");
      ctx.globalAlpha = 1;
    }

    // Controles táctiles
    for (const b of [buttons.left, buttons.jumpB, buttons.right]) {
      rr(b.x, b.y, b.w, b.h, 22);
      ctx.fillStyle = "rgba(25,20,40,.38)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      text(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b === buttons.jumpB ? 24 : 32, "rgba(255,255,255,.9)");
    }

    if (g.flash > 0) {
      ctx.fillStyle = "rgba(255,120,0," + (g.flash * 1.2).toFixed(2) + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- Pantallas ----------
  function overlay(alpha = 0.6) {
    ctx.fillStyle = "rgba(20,12,35," + alpha + ")";
    ctx.fillRect(0, 0, W, H);
  }
  function panel(x, y, w, h) {
    rr(x, y, w, h, 24);
    ctx.fillStyle = "rgba(255,248,231,.97)";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#7048a8";
    ctx.stroke();
  }

  function drawMuteButton() {
    const b = buttons.mute;
    rr(b.x, b.y, b.w, b.h, 16);
    ctx.fillStyle = "rgba(25,20,40,.6)";
    ctx.fill();
    drawEmoji(audio.muted ? "🔇" : "🔊", b.x + b.w / 2, b.y + b.h / 2, 28);
  }

  function drawMenu(time) {
    overlay(0.35);
    text("DORAS", W / 2, 92, 74, "#ffd43b", "center", "bold", "#5b2a00");
    text("SURVIVOR", W / 2, 158, 48, "#ff8fab", "center", "bold", "#4b1d6b");
    text("Operación: Ni un Combo Más", W / 2, 208, 22, "#fff8e7", "center", "bold", "rgba(30,20,50,.8)");
    // Personaje
    const bob = Math.sin(time * 3) * 8;
    const h = 380;
    const w = h * (354 / 490);
    if (doraReady) ctx.drawImage(doraImg, W / 2 - w / 2, 240 + bob, w, h);
    // Comida que lo persigue
    const foods = ["🍔", "🍕", "🍩", "🍟", "🥤", "🌭"];
    foods.forEach((f, i) => {
      const a = time * 0.9 + (i / foods.length) * Math.PI * 2;
      drawEmoji(f, W / 2 + Math.cos(a) * 225, 430 + Math.sin(a) * 175, 44);
    });
    rr(70, 650, 400, 76, 16);
    ctx.fillStyle = "rgba(25,20,40,.7)";
    ctx.fill();
    text("¡Esquivá la comida engordadora!", W / 2, 676, 20, "#fff");
    text("Récord: " + state.best, W / 2, 704, 18, "#ffd43b");
    drawButton(buttons.play, true, 32);
    drawButton(buttons.how, false, 22);
    text("Sátira ficticia. Comé rico, pero tomá agua.", W / 2, 934, 14, "rgba(255,248,231,.8)", "center", "normal");
    drawMuteButton();
  }

  function drawHowTo() {
    overlay(0.55);
    panel(36, 50, 468, 780);
    text("Cómo jugar", W / 2, 96, 34, "#4b2a7a");
    const rows = [
      ["⬅️➡️", "Deslizá o usá ◀ ▶ / flechas para cambiar de carril."],
      ["⬆️", "Tocá la pantalla, deslizá arriba o Espacio para saltar."],
      ["🍔", "La comida chatarra llena el Barriga-metro. Al 100% perdés."],
      ["🍱", "Lo rojo (buffet, combo, máquina) no se salta: esquivalo."],
      ["🍎", "Manzana: puntos y baja la barriga. 10 = Modo Fit."],
      ["💧", "Agua: todo va más lento y baja la barriga."],
      ["👟", "Tenis: saltás más y cruzás charcos de aceite."],
      ["🥦", "Brócoli: escudo contra un golpe."],
      ["🥗", "Ensalada real: −20 de barriga."],
      ["🚚", "Food truck: avisa el carril y baja rapidísimo."],
      ["🎂", "Cumpleaños en la oficina: llueve pastel."]
    ];
    let y = 146;
    for (const [e, t] of rows) {
      drawEmoji(e.length > 2 ? e.slice(0, 2) : e, 80, y + 10, 30);
      ctx.font = "bold 17px 'Trebuchet MS',sans-serif";
      const lines = wrap(t, 360);
      lines.forEach((l, i) => text(l, 112, y + 2 + i * 21, 17, "#2b2140", "left"));
      y += Math.max(54, lines.length * 21 + 18);
    }
    drawButton(buttons.back, false, 24);
    drawButton(buttons.howPlay, true, 24);
  }

  function drawPause() {
    overlay(0.6);
    panel(100, 300, 340, 380);
    text("Pausa", W / 2, 350, 36, "#4b2a7a");
    text("Botas aprovechó para comerse una fruta.", W / 2, 394, 15, "#5c5470", "center", "normal");
    drawButton(buttons.resume, true, 26);
    drawButton(buttons.restart, false, 22);
    drawButton(buttons.toMenu, false, 22);
  }

  function drawGameOver(time) {
    overlay(0.65);
    panel(40, 90, 460, 630);
    text("¡Se llenó la barriga!", W / 2, 140, 32, "#c92a2a");
    // Personaje ancho y triste
    const h = 200;
    const w = h * (354 / 490) * 1.55;
    if (doraReady) {
      ctx.save();
      ctx.translate(W / 2, 270);
      ctx.rotate(Math.sin(time * 2) * 0.05);
      ctx.drawImage(doraImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    drawEmoji("🍔", W / 2 - 150, 300, 44);
    drawEmoji("🍩", W / 2 + 150, 240, 44);
    let y = 400;
    y += wrappedText(state.defeat, W / 2, y, 400, 21, "#2b2140");
    y += 14;
    text("Puntaje: " + g.score, W / 2, y + 10, 34, "#5b2a00");
    text("Récord: " + state.best, W / 2, y + 50, 20, "#7048a8");
    if (state.newRecord) {
      text("¡NUEVO RÉCORD!", W / 2, y + 84, 22, "#2b8a3e");
    }
    wrappedText(state.tagline, W / 2, 668, 400, 16, "#5c5470", 20, "normal");
    drawButton(buttons.retry, true, 26);
    drawButton(buttons.overMenu, false, 22);
  }

  // ---------- Render principal ----------
  let menuScroll = 0;
  function render(time) {
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (state.screen === "menu" || state.screen === "howto") {
      scroll = menuScroll;
      drawWorld(time);
      if (state.screen === "menu") drawMenu(time);
      else drawHowTo();
      return;
    }
    drawWorld(time);
    const sortedObs = obstacles.slice().sort((a, b) => a.y - b.y);
    for (const it of items) drawItem(it, time);
    for (const o of sortedObs) drawObstacle(o, time);
    drawTruck(time);
    drawPlayer(time);
    drawParticles();
    drawHud(time);
    if (state.screen === "paused") drawPause();
    if (state.screen === "gameover") drawGameOver(time);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;
    if (state.screen === "playing") update(dt);
    else if (state.screen === "menu" || state.screen === "howto") menuScroll += 120 * dt;
    render(time);
    requestAnimationFrame(frame);
  }

  // ---------- Entrada ----------
  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  let down = null;
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    audio.ensure();
    if (audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
    down = toLogical(e);
    // En juego, los botones responden al tocar (sin esperar a soltar).
    if (state.screen === "playing") {
      const { x, y } = down;
      if (inBtn(buttons.pauseBtn, x, y)) { pause(); down = null; }
      else if (inBtn(buttons.left, x, y)) { moveLeft(); down = null; }
      else if (inBtn(buttons.right, x, y)) { moveRight(); down = null; }
      else if (inBtn(buttons.jumpB, x, y)) { jump(); down = null; }
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    e.preventDefault();
    if (!down) return;
    const up = toLogical(e);
    const dx = up.x - down.x;
    const dy = up.y - down.y;
    const { x, y } = down;
    down = null;
    switch (state.screen) {
      case "menu":
        if (inBtn(buttons.play, x, y)) startGame();
        else if (inBtn(buttons.how, x, y)) state.screen = "howto";
        else if (inBtn(buttons.mute, x, y)) audio.toggleMute();
        break;
      case "howto":
        if (inBtn(buttons.back, x, y)) state.screen = "menu";
        else if (inBtn(buttons.howPlay, x, y)) startGame();
        break;
      case "playing":
        if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) moveLeft(); else moveRight(); }
        else jump(); // toque o deslizar hacia arriba
        break;
      case "paused":
        if (inBtn(buttons.resume, x, y)) state.screen = "playing";
        else if (inBtn(buttons.restart, x, y)) startGame();
        else if (inBtn(buttons.toMenu, x, y)) { state.screen = "menu"; audio.stopMusic(); }
        break;
      case "gameover":
        if (inBtn(buttons.retry, x, y)) startGame();
        else if (inBtn(buttons.overMenu, x, y)) state.screen = "menu";
        break;
    }
  });
  canvas.addEventListener("pointercancel", () => { down = null; });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(k)) e.preventDefault();
    if (state.screen === "playing") {
      if (k === "ArrowLeft" || k === "a" || k === "A") moveLeft();
      else if (k === "ArrowRight" || k === "d" || k === "D") moveRight();
      else if (k === "ArrowUp" || k === " " || k === "w" || k === "W") jump();
      else if (k === "p" || k === "P" || k === "Escape") pause();
    } else if (state.screen === "paused") {
      if (k === "p" || k === "P" || k === "Escape" || k === "Enter") state.screen = "playing";
    } else if (k === "Enter" || k === " ") {
      startGame();
    } else if (k === "m" || k === "M") {
      audio.toggleMute();
    }
  });

  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  window.addEventListener("resize", resize);

  // Hook para pruebas automáticas (no afecta el juego).
  window.__doras = { state, get g() { return g; }, player, startGame, jump, moveLeft, moveRight };

  resize();
  resetGame();
  requestAnimationFrame(frame);
})();
