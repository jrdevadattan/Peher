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
];

function inspectImage(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  return IMAGE_SIGNATURES.find((signature) => signature.matches(buffer)) || null;
}

module.exports = { inspectImage };
