import assert from "node:assert/strict";
import test from "node:test";
import { studioImageProviders, pollinationsRequest, readGeneratedImage } from "../supabase/functions/hey-studio/imageProvider.js";

test("image availability reflects server credentials instead of assuming anonymous generation", () => {
  assert.deepEqual(studioImageProviders(undefined, undefined), []);
  assert.deepEqual(studioImageProviders(undefined, "server-test-key"), ["pollinations"]);
  assert.throws(() => pollinationsRequest("cat", { width: 1024, height: 1024 }), /server-side provider key/);
});

test("Pollinations uses the current API and keeps its credential out of URLs", () => {
  const request = pollinationsRequest("a cat & sky", { width: 1024, height: 1024 }, "server-test-key");
  assert.equal(new URL(request.url).origin, "https://gen.pollinations.ai");
  assert.equal(request.url.includes("server-test-key"), false);
  assert.equal(request.init.headers.Authorization, "Bearer server-test-key");
});

test("generated image storage matches the file signature and rejects HTML or oversized output", async () => {
  const image = await readGeneratedImage(new Response(new Uint8Array([255, 216, 255, 224, 1, 2])));
  assert.equal(image.contentType, "image/jpeg");
  assert.equal(image.extension, "jpg");
  await assert.rejects(readGeneratedImage(new Response("<html>provider error</html>")), /not a supported image/);
  await assert.rejects(readGeneratedImage(new Response(new Uint8Array(9)), 8), /storage limit/);
});
