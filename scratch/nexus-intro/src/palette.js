/**
 * Chamber + lens palette.
 *
 * Room language stays on the site accents (#646cff / #747bff). Per-character lens colors follow
 * WorldBible/07_VisualDesign/ColorPalettes.md ("Ability Effect Colors" + character palettes), and the
 * Time Nexus zone palette (crystalline white/silver, deep anchor blue, prismatic refraction).
 */
export const ROOM = {
  primary: 0x646cff,
  secondary: 0x747bff,
  accent: 0x9aa8ff,
  void: 0x05070f,
  fog: 0x070a16,
  floor: 0x1c2540,
  wall: 0x141b33,
  frame: 0x232c4f,
  crystal: 0xcfd9ff,
  silver: 0xc4cadb,
  temporalWhite: 0xeef1ff,
  anchorBlue: 0x2b3dff,
  warning: 0xff5a36, // Nexus emergency red-gold (TimeNexus.md · Lighting)
};

/** Activation / sustained colors per lens (ColorPalettes.md · Ability Effect Colors). */
export const CHARACTER = {
  anne: {
    label: 'Anne',
    flash: 0xff2a3a, // red highlights (activation)
    main: 0x4682b4, // steel blue
    rim: 0xd6e2ff, // silver rim
    warn: 0xcc0000, // foresight warning
  },
  maya: {
    label: 'Maya',
    flash: 0x00f0ff, // cyan sequence
    main: 0x00ffff,
    deep: 0x4b0082,
    teal: 0x00a0a0,
  },
  eli: {
    label: 'Eli',
    flash: 0xff6a00, // orange burst
    main: 0xff6600,
    hot: 0xffd700,
    blur: 0xfff3e0,
  },
  vibrion: {
    label: 'Vibrion',
    flash: 0x1a7dff, // blue flash
    main: 0x0080ff,
    shimmer: 0xf2f7ff,
    deep: 0x003366,
  },
};

/** Beat-5 order (Ink): Anne tick → Maya lock → Eli window → Vibrion seal. Clock i belongs to step i. */
export const STEP_ORDER = ['anne', 'maya', 'eli', 'vibrion'];

export function characterColor(id, key = 'flash') {
  return CHARACTER[id]?.[key] ?? ROOM.primary;
}
