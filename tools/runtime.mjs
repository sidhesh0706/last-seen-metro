import { mkdir, copyFile } from "node:fs/promises";
await mkdir("public/runtime", { recursive: true });
for (const type of ["wasm", "mjs"]) {
  const file = "ort-wasm-simd-threaded.jsep." + type;
  await copyFile(
    "node_modules/@huggingface/transformers/dist/" + file,
    "public/runtime/" + file,
  );
}
