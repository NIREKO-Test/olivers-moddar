// Ritytan: 16x16 rutor som man ritar på med fingret.

const SIDA = 16;
const MAX_ANGRA = 60;

export function skapaRityta(canvas, { onAndring } = {}) {
  const ctx = canvas.getContext("2d");
  let pixlar = Array(SIDA * SIDA).fill(null);
  let verktyg = "penna";
  let farg = "#e53935";
  const historik = [];
  let ritar = false;
  let senaste = null;

  function rita() {
    const ruta = canvas.width / SIDA;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixlar.length; i++) {
      const x = (i % SIDA) * ruta;
      const y = Math.floor(i / SIDA) * ruta;
      if (pixlar[i]) {
        ctx.fillStyle = pixlar[i];
        ctx.fillRect(x, y, ruta, ruta);
      } else {
        // Rutmönster visar att rutan är genomskinlig.
        const halv = ruta / 2;
        ctx.fillStyle = "#f4f6f8";
        ctx.fillRect(x, y, ruta, ruta);
        ctx.fillStyle = "#e3e7eb";
        ctx.fillRect(x, y, halv, halv);
        ctx.fillRect(x + halv, y + halv, halv, halv);
      }
    }
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < SIDA; i++) {
      ctx.beginPath();
      ctx.moveTo(i * ruta + 0.5, 0);
      ctx.lineTo(i * ruta + 0.5, canvas.height);
      ctx.moveTo(0, i * ruta + 0.5);
      ctx.lineTo(canvas.width, i * ruta + 0.5);
      ctx.stroke();
    }
  }

  function sparaHistorik() {
    historik.push(pixlar.slice());
    if (historik.length > MAX_ANGRA) historik.shift();
  }

  function rutaVid(event) {
    const ram = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - ram.left) / ram.width) * SIDA);
    const y = Math.floor(((event.clientY - ram.top) / ram.height) * SIDA);
    if (x < 0 || y < 0 || x >= SIDA || y >= SIDA) return null;
    return { x, y };
  }

  function malaRuta({ x, y }) {
    pixlar[y * SIDA + x] = verktyg === "sudd" ? null : farg;
  }

  // Fyller alla sammanhängande rutor med samma färg.
  function fyll({ x, y }) {
    const start = pixlar[y * SIDA + x];
    if (start === farg) return;
    const ko = [[x, y]];
    while (ko.length) {
      const [cx, cy] = ko.pop();
      if (cx < 0 || cy < 0 || cx >= SIDA || cy >= SIDA) continue;
      if (pixlar[cy * SIDA + cx] !== start) continue;
      pixlar[cy * SIDA + cx] = farg;
      ko.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  // Fyller i rutorna mellan två punkter så snabba drag inte blir prickiga.
  function linje(fran, till) {
    let { x, y } = fran;
    const dx = Math.abs(till.x - x);
    const dy = -Math.abs(till.y - y);
    const sx = x < till.x ? 1 : -1;
    const sy = y < till.y ? 1 : -1;
    let fel = dx + dy;
    for (;;) {
      malaRuta({ x, y });
      if (x === till.x && y === till.y) break;
      const e2 = 2 * fel;
      if (e2 >= dy) {
        fel += dy;
        x += sx;
      }
      if (e2 <= dx) {
        fel += dx;
        y += sy;
      }
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    const ruta = rutaVid(event);
    if (!ruta) return;
    event.preventDefault();
    sparaHistorik();
    if (verktyg === "hink") {
      fyll(ruta);
    } else {
      ritar = true;
      senaste = ruta;
      canvas.setPointerCapture(event.pointerId);
      malaRuta(ruta);
    }
    rita();
    onAndring?.();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!ritar) return;
    const ruta = rutaVid(event);
    if (!ruta || (ruta.x === senaste.x && ruta.y === senaste.y)) return;
    linje(senaste, ruta);
    senaste = ruta;
    rita();
    onAndring?.();
  });

  const slutaRita = () => {
    ritar = false;
    senaste = null;
  };
  canvas.addEventListener("pointerup", slutaRita);
  canvas.addEventListener("pointercancel", slutaRita);

  return {
    laddaPixlar(nya) {
      pixlar = nya.slice();
      historik.length = 0;
      rita();
    },
    hamtaPixlar: () => pixlar.slice(),
    sattVerktyg(nytt) {
      verktyg = nytt;
    },
    sattFarg(nyFarg) {
      farg = nyFarg;
    },
    angra() {
      if (!historik.length) return false;
      pixlar = historik.pop();
      rita();
      onAndring?.();
      return true;
    },
    kanAngra: () => historik.length > 0,
    arTom: () => pixlar.every((p) => p === null),
  };
}

// Liten bild av en sak, till exempel på korten på startsidan.
export function ritaMiniatyr(canvas, pixlar) {
  const ctx = canvas.getContext("2d");
  const ruta = canvas.width / SIDA;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pixlar.forEach((hex, i) => {
    if (!hex) return;
    ctx.fillStyle = hex;
    ctx.fillRect((i % SIDA) * ruta, Math.floor(i / SIDA) * ruta, Math.ceil(ruta), Math.ceil(ruta));
  });
}
