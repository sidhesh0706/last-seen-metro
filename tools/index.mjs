import {
  env,
  CLIPVisionModelWithProjection,
  AutoProcessor,
  RawImage,
} from "@huggingface/transformers";
import { copyFile, readdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
env.allowRemoteModels = false;
for (const name of ["config.json", "preprocessor_config.json"])
  await copyFile("public/models/clip/" + name, "tools/vision/" + name);
const opts = { model_file_name: "vision_model", dtype: "q8", device: "cpu" };
const encoder = await CLIPVisionModelWithProjection.from_pretrained(
  "./tools/vision",
  opts,
);
const processor = await AutoProcessor.from_pretrained("./tools/vision");
const photos = [];
const start = performance.now();
for (const file of (await readdir("public/photos")).sort()) {
  const image = await RawImage.read("public/photos/" + file);
  const { image_embeds } = await encoder(await processor(image));
  const vector = Array.from(image_embeds.data);
  const norm = Math.hypot(...vector);
  photos.push({
    id: file.slice(0, 2),
    vector: vector.map((v) => Math.round((v / norm) * 1e6) / 1e6),
  });
}
await writeFile("public/archive.json", JSON.stringify(photos));
await writeFile(
  "public/lab.json",
  JSON.stringify({
    cpu: cpus()[0].model.trim(),
    count: photos.length,
    seconds: Number(((performance.now() - start) / 1000).toFixed(2)),
    backend: "ONNX Runtime CPU · CLIP ViT-B/32 q8",
  }),
);
console.log("Indexed", photos.length, "photos");
