const { describe, expect, it } = require("bun:test");
const { inspectImage } = require("./image-upload");

describe("inspectImage", () => {
  it("detects HEIC uploads from iPhone-compatible file signatures", () => {
    const buffer = Buffer.alloc(32);
    buffer.write("ftyp", 4, "ascii");
    buffer.write("heic", 8, "ascii");

    expect(inspectImage(buffer)).toMatchObject({
      extension: "heic",
      mimeType: "image/heic",
    });
  });

  it("detects HEIF uploads from compatible ISO media signatures", () => {
    const buffer = Buffer.alloc(32);
    buffer.write("ftyp", 4, "ascii");
    buffer.write("mif1", 8, "ascii");

    expect(inspectImage(buffer)).toMatchObject({
      extension: "heif",
      mimeType: "image/heif",
    });
  });
});
