// MPEG audio frame headers, per ISO/IEC 11172-3. A file extension or
// declared MIME type of "mp3" is just a label the uploader's tool chose --
// this reads the actual bitstream to find out what's really encoded, since
// some encoders/exporters mislabel Layer I/II audio as ".mp3" and browsers
// can only decode Layer III.

export type MpegLayer = 1 | 2 | 3;

const VERSION_MPEG1 = 0b11;
const VERSION_MPEG2 = 0b10;
const VERSION_MPEG2_5 = 0b00;

const LAYER_BY_BITS: Record<number, MpegLayer> = { 0b11: 1, 0b10: 2, 0b01: 3 };

// Keyed "<1|2>-<layer>": 1 = MPEG1 table, 2 = shared MPEG2/2.5 table.
const BITRATES_KBPS: Record<string, number[]> = {
  "1-1": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  "1-2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  "1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2-1": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  "2-2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  "2-3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};

const SAMPLE_RATES_HZ: Record<number, number[]> = {
  [VERSION_MPEG1]: [44100, 48000, 32000],
  [VERSION_MPEG2]: [22050, 24000, 16000],
  [VERSION_MPEG2_5]: [11025, 12000, 8000],
};

type FrameHeader = {
  layer: MpegLayer;
  frameLengthBytes: number;
  versionBits: number;
  layerBits: number;
};

function parseFrameHeader(view: DataView, offset: number): FrameHeader | null {
  if (offset + 4 > view.byteLength) return null;

  const b1 = view.getUint8(offset);
  const b2 = view.getUint8(offset + 1);
  const b3 = view.getUint8(offset + 2);

  // 11-bit frame sync: all of b1, top 3 bits of b2.
  if (b1 !== 0xff || (b2 & 0xe0) !== 0xe0) return null;

  const versionBits = (b2 >> 3) & 0b11;
  const layerBits = (b2 >> 1) & 0b11;
  if (versionBits === 0b01 || layerBits === 0b00) return null; // reserved values

  const layer = LAYER_BY_BITS[layerBits];
  const bitrateIndex = (b3 >> 4) & 0b1111;
  const sampleRateIndex = (b3 >> 2) & 0b11;
  const padding = (b3 >> 1) & 0b1;
  if (bitrateIndex === 0 || bitrateIndex === 0xf) return null; // free/bad
  if (sampleRateIndex === 0b11) return null; // reserved

  const tableVersion = versionBits === VERSION_MPEG1 ? 1 : 2;
  const bitrateKbps = BITRATES_KBPS[`${tableVersion}-${layer}`]?.[bitrateIndex];
  const sampleRateHz = SAMPLE_RATES_HZ[versionBits]?.[sampleRateIndex];
  if (!bitrateKbps || !sampleRateHz) return null;

  const slotCoefficient = layer === 1 ? 12 : layer === 3 && tableVersion === 2 ? 72 : 144;
  const slotSizeBytes = layer === 1 ? 4 : 1;
  const frameLengthBytes =
    Math.floor((slotCoefficient * bitrateKbps * 1000) / sampleRateHz) * (layer === 1 ? 4 : 1) +
    (padding ? slotSizeBytes : 0);

  if (frameLengthBytes < 4) return null;

  return { layer, frameLengthBytes, versionBits, layerBits };
}

// Skips a leading ID3v2 tag, if present, to reach the raw frame stream.
function skipId3v2(view: DataView): number {
  if (view.byteLength < 10) return 0;
  const isId3 =
    view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33;
  if (!isId3) return 0;

  const size =
    (view.getUint8(6) << 21) |
    (view.getUint8(7) << 14) |
    (view.getUint8(8) << 7) |
    view.getUint8(9);
  return 10 + size;
}

// Scans for the file's MPEG audio layer by finding a valid frame header
// and cross-validating it against the header of the very next frame
// (same version/layer), which rules out a stray 0xFF byte in unrelated
// binary data being mistaken for a sync word. Returns null if no
// MPEG audio stream is found at all -- e.g. a genuinely different
// container (WAV/FLAC/OGG/M4A), which this check doesn't apply to.
export function detectMpegLayer(buffer: ArrayBuffer): MpegLayer | null {
  const view = new DataView(buffer);
  const start = skipId3v2(view);
  const searchLimit = Math.min(view.byteLength, start + 64 * 1024);

  for (let offset = start; offset < searchLimit; offset++) {
    const header = parseFrameHeader(view, offset);
    if (!header) continue;

    const nextHeader = parseFrameHeader(view, offset + header.frameLengthBytes);
    if (
      nextHeader &&
      nextHeader.versionBits === header.versionBits &&
      nextHeader.layerBits === header.layerBits
    ) {
      return header.layer;
    }
  }

  return null;
}
