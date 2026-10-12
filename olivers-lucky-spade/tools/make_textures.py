#!/usr/bin/env python3
"""Ritar texturerna till Olivers Lucky-spade.

Allt är vanliga pixlar i listor, så du kan ändra färger och form här
och köra om skriptet:  python3 tools/make_textures.py
"""

import struct
import zlib
from pathlib import Path

ROT = Path(__file__).resolve().parent.parent
RP = ROT / "resource_pack"

# ---------------- Färger (R, G, B, A) ----------------
GENOMSKINLIG = (0, 0, 0, 0)

BLAD_LJUS = (255, 238, 122, 255)
BLAD = (255, 216, 43, 255)
BLAD_MORK = (201, 154, 0, 255)
BLAD_KANT = (107, 78, 0, 255)

SKAFT_LJUS = (232, 91, 91, 255)
SKAFT = (198, 40, 40, 255)
SKAFT_MORK = (142, 31, 31, 255)

GULD = (255, 196, 0, 255)
GULD_MORK = (184, 135, 0, 255)

SVART = (26, 26, 26, 255)
TEXT = (255, 215, 0, 255)


# ---------------- PNG-skrivare ----------------
def skriv_png(sokvag: Path, pixlar):
    hojd = len(pixlar)
    bredd = len(pixlar[0])
    rader = b"".join(
        b"\x00" + bytes(kanal for pixel in rad for kanal in pixel) for rad in pixlar
    )

    def block(typ, data):
        kropp = typ + data
        return struct.pack(">I", len(data)) + kropp + struct.pack(">I", zlib.crc32(kropp) & 0xFFFFFFFF)

    sokvag.parent.mkdir(parents=True, exist_ok=True)
    sokvag.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + block(b"IHDR", struct.pack(">IIBBBBB", bredd, hojd, 8, 6, 0, 0, 0))
        + block(b"IDAT", zlib.compress(rader, 9))
        + block(b"IEND", b"")
    )
    try:
        namn = sokvag.relative_to(ROT)
    except ValueError:
        namn = sokvag
    print(f"  {namn}  ({bredd}x{hojd})")


def tom_duk(bredd, hojd, farg=GENOMSKINLIG):
    return [[farg for _ in range(bredd)] for _ in range(hojd)]


def satt(duk, x, y, farg):
    if 0 <= y < len(duk) and 0 <= x < len(duk[0]):
        duk[y][x] = farg


def stampla(duk, mall, x0, y0, farg, skala=1):
    """Ritar en pixelkarta ('#' = fylld) med valfri förstoring."""
    for rad, text in enumerate(mall):
        for kol, tecken in enumerate(text):
            if tecken != "#":
                continue
            for dy in range(skala):
                for dx in range(skala):
                    satt(duk, x0 + kol * skala + dx, y0 + rad * skala + dy, farg)


# ---------------- Pixelfont 3x5 ----------------
FONT = {
    "O": ["###", "#.#", "#.#", "#.#", "###"],
    "L": ["#..", "#..", "#..", "#..", "###"],
    "I": ["###", ".#.", ".#.", ".#.", "###"],
    "V": ["#.#", "#.#", "#.#", "#.#", ".#."],
    "E": ["###", "#..", "###", "#..", "###"],
    "R": ["##.", "#.#", "##.", "#.#", "#.#"],
}

FRAGETECKEN = [
    ".###.",
    "#...#",
    "....#",
    "...#.",
    "..#..",
    ".....",
    "..#..",
]


# ---------------- Lucky block, 16x16 ----------------
def rita_lucky_block():
    storlek = 16
    duk = tom_duk(storlek, storlek, BLAD)

    for y in range(storlek):
        for x in range(storlek):
            vid_kant = x == 0 or y == 0 or x == storlek - 1 or y == storlek - 1
            nast_kant = x == 1 or y == 1 or x == storlek - 2 or y == storlek - 2
            if vid_kant:
                duk[y][x] = BLAD_KANT
            elif nast_kant:
                duk[y][x] = BLAD_MORK if (x + y) % 3 else BLAD_LJUS

    # Lite liv i ytan så den inte blir platt.
    for x, y in [(4, 5), (11, 4), (6, 12), (12, 11), (9, 8), (3, 9)]:
        duk[y][x] = BLAD_MORK

    stampla(duk, FRAGETECKEN, 5, 4, SVART, skala=1)
    # Gör frågetecknet dubbelt så brett så det syns på håll.
    stampla(duk, FRAGETECKEN, 6, 4, SVART, skala=1)
    return duk


# ---------------- Spaden, 128x128 ----------------
# Formen ritas som en karta i 16x16 "minecraft-pixlar".
#   B = blad, L = blad ljust, b = blad mörkt
#   H = skaft, h = skaft mörkt, G = guldkrage
#   . = genomskinligt
SPADFORM = [
    "..........LLLL..",
    ".........BBBBBB.",
    ".........BBBBBB.",
    ".........BBBBBB.",
    ".........BBBBBb.",
    "........hGGGb...",
    ".......hHHH.....",
    "......hHHH......",
    ".....hHHH.......",
    "....hHHH........",
    "...hHHH.........",
    "..hHHH..........",
    "..hHH...........",
    ".hHH............",
    "hHH.............",
    "................",
]

FARGKARTA = {
    "B": BLAD,
    "L": BLAD_LJUS,
    "b": BLAD_MORK,
    "H": SKAFT,
    "h": SKAFT_MORK,
    "G": GULD,
}


def rita_spade():
    skala = 8  # varje ruta i kartan blir 8x8 riktiga pixlar
    storlek = 16 * skala
    duk = tom_duk(storlek, storlek)

    for rad, text in enumerate(SPADFORM):
        for kol, tecken in enumerate(text):
            farg = FARGKARTA.get(tecken)
            if farg is None:
                continue
            for dy in range(skala):
                for dx in range(skala):
                    satt(duk, kol * skala + dx, rad * skala + dy, farg)

    morka_kanterna(duk, tjocklek=2)

    # Frågetecken på bladet.
    stampla(duk, FRAGETECKEN, 80, 12, SVART, skala=4)

    # "OLIVER" längs skaftet, nerifrån och upp så det läses åt rätt håll.
    nedre = (1.5 * skala, 14.5 * skala)
    ovre = (9.6 * skala, 6.3 * skala)
    namn = "OLIVER"
    for index, bokstav in enumerate(namn):
        t = (index + 0.5) / len(namn)
        cx = round(nedre[0] + (ovre[0] - nedre[0]) * t)
        cy = round(nedre[1] + (ovre[1] - nedre[1]) * t)
        # Skugga först, sen bokstaven ovanpå - då syns den mot rött.
        stampla(duk, FONT[bokstav], cx - 4, cy - 6, SVART, skala=3)
        stampla(duk, FONT[bokstav], cx - 5, cy - 7, TEXT, skala=3)

    return duk


def morka_kanterna(duk, tjocklek=2):
    """Gör ytterkanten mörkare så formen får en tydlig kontur."""
    hojd, bredd = len(duk), len(duk[0])
    genomskinlig = [[pixel[3] == 0 for pixel in rad] for rad in duk]
    kant = []
    for y in range(hojd):
        for x in range(bredd):
            if genomskinlig[y][x]:
                continue
            for dy in range(-tjocklek, tjocklek + 1):
                for dx in range(-tjocklek, tjocklek + 1):
                    gy, gx = y + dy, x + dx
                    if not (0 <= gy < hojd and 0 <= gx < bredd) or genomskinlig[gy][gx]:
                        kant.append((x, y))
                        break
                else:
                    continue
                break
    for x, y in kant:
        r, g, b, a = duk[y][x]
        duk[y][x] = (int(r * 0.5), int(g * 0.5), int(b * 0.5), a)


def forstora(duk, faktor):
    return [
        [pixel for pixel in rad for _ in range(faktor)]
        for rad in duk
        for _ in range(faktor)
    ]


if __name__ == "__main__":
    print("Ritar texturer:")
    block = rita_lucky_block()
    skriv_png(RP / "textures/blocks/lucky_block.png", block)
    skriv_png(RP / "textures/items/lucky_spade.png", rita_spade())
    skriv_png(RP / "pack_icon.png", forstora(block, 8))
    skriv_png(ROT / "behavior_pack/pack_icon.png", forstora(block, 8))
    print("Klart.")
