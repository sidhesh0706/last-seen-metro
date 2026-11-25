import {
  env,
  AutoTokenizer,
  CLIPTextModelWithProjection,
} from "@huggingface/transformers";
const base = new URL("../", self.location.href);
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL("models/", base).href;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.wasmPaths = new URL("runtime/", base).href;
let loading;
async function prepare() {
  const [model, tokenizer, archive] = await Promise.all([
    CLIPTextModelWithProjection.from_pretrained("clip", {
      model_file_name: "text_model",
      device: "wasm",
      dtype: "q8",
    }),
    AutoTokenizer.from_pretrained("clip"),
    fetch(new URL("archive.json", base)).then((r) => r.json()),
  ]);
  return { model, tokenizer, archive };
}
self.onmessage = async ({ data }) => {
  try {
    loading ??= prepare().catch((e) => {
      loading = undefined;
      throw e;
    });
    const { model, tokenizer, archive } = await loading;
    const start = performance.now();
    const { text_embeds } = await model(
      tokenizer(data, { truncation: true, max_length: 77 }),
    );
    const vector = text_embeds.data,
      norm = Math.hypot(...vector);
    const ranked = archive
      .map(({ id, vector: photo }) => ({
        id,
        score: photo.reduce((s, v, i) => s + v * vector[i], 0) / norm,
      }))
      .sort((a, b) => b.score - a.score);
    self.postMessage({ ranked, ms: Math.round(performance.now() - start) });
  } catch (e) {
    self.postMessage({ error: String(e) });
  }
};
