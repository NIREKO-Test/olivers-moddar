// Färger, startformer och krafter. Allt som syns i appen och som inte är kod.

// Färgerna i ritverktyget. Bokstaven används i formerna nedan.
export const FARGER = [
  { bokstav: "W", namn: "Vit", hex: "#ffffff" },
  { bokstav: "L", namn: "Ljusgrå", hex: "#c8cdd2" },
  { bokstav: "G", namn: "Grå", hex: "#7d848c" },
  { bokstav: "K", namn: "Svart", hex: "#1d1d21" },
  { bokstav: "B", namn: "Brun", hex: "#9a6332" },
  { bokstav: "b", namn: "Mörkbrun", hex: "#5c3a1a" },
  { bokstav: "R", namn: "Röd", hex: "#e53935" },
  { bokstav: "O", namn: "Orange", hex: "#fb8c00" },
  { bokstav: "E", namn: "Gul", hex: "#fdd835" },
  { bokstav: "Y", namn: "Guld", hex: "#f2b632" },
  { bokstav: "M", namn: "Lime", hex: "#9be15d" },
  { bokstav: "N", namn: "Grön", hex: "#2e9d43" },
  { bokstav: "C", namn: "Diamant", hex: "#4dd8e6" },
  { bokstav: "U", namn: "Blå", hex: "#1e6fe0" },
  { bokstav: "P", namn: "Lila", hex: "#8e3fd1" },
  { bokstav: "S", namn: "Rosa", hex: "#f06fae" },
];

export const FARG_PER_BOKSTAV = Object.fromEntries(FARGER.map((f) => [f.bokstav, f.hex]));

// Startformer, 16x16. "." är genomskinligt.
export const MALLAR = [
  {
    id: "svard",
    namn: "Svärd",
    form: [
      "..............KK",
      ".............KWK",
      "............KWLK",
      "...........KWLK.",
      "..........KWLK..",
      ".........KWLK...",
      "........KWLK....",
      ".......KWLK.....",
      "..KK..KWLK......",
      "..KYKKWLK.......",
      "...KYKLK........",
      "....KYYK........",
      "...KbKKYK.......",
      "..KbbK.KK.......",
      ".KYbK...........",
      ".KKK............",
    ],
  },
  {
    id: "stav",
    namn: "Trollstav",
    form: [
      "...........KKK..",
      "..........KCWCK.",
      ".........KCWWCCK",
      ".........KCCWCK.",
      "..........KCCK..",
      ".........KbKK...",
      "........KbBK....",
      ".......KbBK.....",
      "......KbBK......",
      ".....KbBK.......",
      "....KbBK........",
      "...KbBK.........",
      "..KbBK..........",
      ".KbBK...........",
      ".KKK............",
      "................",
    ],
  },
  {
    id: "yxa",
    namn: "Yxa",
    form: [
      "................",
      "...KKKK.........",
      "..KWLLLK........",
      ".KWLLLLLK..KK...",
      ".KWLLLLLLKKBK...",
      ".KWLLLLGKbBK....",
      "..KWLLGKbBK.....",
      "...KKKKbBK......",
      ".....KbBK.......",
      "....KbBK........",
      "...KbBK.........",
      "..KbBK..........",
      ".KbBK...........",
      "KbBK............",
      "KKK.............",
      "................",
    ],
  },
  {
    id: "hammare",
    namn: "Hammare",
    form: [
      "........KK......",
      ".......KGLK.....",
      "......KGGLWK....",
      ".......KGLLWK...",
      "........KGLLWK..",
      "........KbGLLWK.",
      ".......KbBKGLLWK",
      "......KbBK.KGLLK",
      ".....KbBK...KGK.",
      "....KbBK.....K..",
      "...KbBK.........",
      "..KbBK..........",
      ".KbBK...........",
      "KbBK............",
      "KKK.............",
      "................",
    ],
  },
  {
    id: "spjut",
    namn: "Spjut",
    form: [
      "............KKKK",
      "...........KWLLK",
      "..........KWLLK.",
      "..........KLLGK.",
      ".........KbKKK..",
      "........KbBK....",
      ".......KbBK.....",
      "......KbBK......",
      ".....KbBK.......",
      "....KbBK........",
      "...KbBK.........",
      "..KbBK..........",
      ".KbBK...........",
      "KbBK............",
      "KKK.............",
      "................",
    ],
  },
  {
    id: "tom",
    namn: "Tomt",
    form: Array(16).fill("................"),
  },
];

// Krafterna. "slag" = när man slår en fiende, "tryck" = när man trycker
// med saken i handen. Texten visas i rutan när kraften är vald.
export const KRAFTER = [
  { id: "eld", emoji: "🔥", namn: "Eld", slag: "Fienden börjar brinna" },
  { id: "blixt", emoji: "⚡", namn: "Blixt", slag: "Blixten slår ner i fienden", tryck: "Blixten slår ner där du tittar" },
  { id: "frys", emoji: "❄️", namn: "Frys", slag: "Fienden fryser fast" },
  { id: "explosion", emoji: "💥", namn: "Pang!", slag: "Det smäller vid fienden", tryck: "Det smäller där du tittar" },
  { id: "skatt", emoji: "💎", namn: "Skatt", slag: "Fienden tappar en skatt" },
  { id: "kyckling", emoji: "🐔", namn: "Kyckling", slag: "Fienden blir en kyckling" },
  { id: "lakning", emoji: "❤️", namn: "Läkning", slag: "Du får hälsa när du slår" },
  { id: "teleport", emoji: "🌀", namn: "Teleport", tryck: "Du hoppar dit du tittar" },
  { id: "hopp", emoji: "🦘", namn: "Superhopp", tryck: "Du flyger högt upp i luften" },
  { id: "regnbage", emoji: "🌈", namn: "Regnbåge", tryck: "Det du tittar på blir regnbåge" },
  { id: "magnet", emoji: "🧲", namn: "Magnet", tryck: "Fienden du tittar på dras till dig" },
  { id: "eldklot", emoji: "☄️", namn: "Eldklot", tryck: "Skjut eld på fienden du tittar på" },
];

// Hur många krafter ett vapen får ha, slag och tryck tillsammans.
export const MAX_KRAFTER = 3;

export const STYRKOR = [
  { niva: 1, emoji: "🪶", namn: "Lätt", skada: 4 },
  { niva: 2, emoji: "⚔️", namn: "Stark", skada: 8 },
  { niva: 3, emoji: "💪", namn: "Superstark", skada: 14 },
];

export const NAMNFORSLAG = [
  "Eldsvärdet", "Blixtstaven", "Frostyxan", "Drakdödaren", "Stjärnstaven",
  "Monsterkrossaren", "Superhammaren", "Regnbågsstaven", "Åskspjutet", "Ninjasvärdet",
];

export function formTillPixlar(form) {
  return form.join("").split("").map((tecken) => FARG_PER_BOKSTAV[tecken] ?? null);
}
