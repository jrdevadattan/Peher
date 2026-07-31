const sharp = require("sharp");

const IMAGE_SIGNATURES = [
  {
    extension: "jpg",
    mimeType: "image/jpeg",
    matches: (buffer) =>
      buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    extension: "png",
    mimeType: "image/png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    extension: "webp",
    mimeType: "image/webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    extension: "avif",
    mimeType: "image/avif",
    matches: (buffer) => {
      if (buffer.length < 16 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") return false;
      const brand = buffer.subarray(8, 12).toString("ascii");
      const compatibleBrands = buffer.subarray(8, Math.min(buffer.length, 32)).toString("ascii");
      return brand === "avif" || brand === "avis" || compatibleBrands.includes("avif");
    },
  },
  {
    extension: "heic",
    mimeType: "image/heic",
    matches: (buffer) => {
      if (buffer.length < 16 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") return false;
      const brands = buffer.subarray(8, Math.min(buffer.length, 32)).toString("ascii");
      return ["heic", "heix", "hevc", "hevx"].some((brand) => brands.includes(brand));
    },
  },
  {
    extension: "heif",
    mimeType: "image/heif",
    matches: (buffer) => {
      if (buffer.length < 16 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") return false;
      const brands = buffer.subarray(8, Math.min(buffer.length, 32)).toString("ascii");
      return ["mif1", "msf1"].some((brand) => brands.includes(brand));
    },
  },
];

function inspectImage(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  return IMAGE_SIGNATURES.find((signature) => signature.matches(buffer)) || null;
}

async function normalizeUploadedImage(file) {
  const detected = inspectImage(file?.buffer);
  if (!detected) return null;
  if (detected.extension !== "heic" && detected.extension !== "heif") {
    return {
      buffer: file.buffer,
      extension: detected.extension,
      mimeType: detected.mimeType,
    };
  }

  try {
    const convertedBuffer = await sharp(file.buffer, { limitInputPixels: false })
      .rotate()
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
    return {
      buffer: convertedBuffer,
      extension: "jpg",
      mimeType: "image/jpeg",
    };
  } catch {
    throw new Error("HEIC/HEIF images could not be converted. Please try a JPG, PNG, WebP, or AVIF image.");
  }
}

module.exports = { inspectImage, normalizeUploadedImage };
