# Lost & Found Live

A seven-chapter browser game for the CMRIT × Intel challenge. The player chooses a laptop and its field software, identifies the musician’s case, intercepts a moving handoff and recovers the encore set list.

## Play locally

With dependencies installed, run `npm run play` and open the printed local URL. A fresh checkout requires `npm ci` first. Production files live in `dist/`. Serve those files over localhost or HTTPS. In the footer, wait for **Offline pack ready** before disconnecting Wi-Fi. Browser storage limits or clearing site data can require a new download.

## Two-minute jury walkthrough

Choose the Acer with Frame Sync. Search for a black instrument case beside blue seats and use **Compare the two closest frames**. Find the stickered case. Synchronize camera B to the guard’s clock, select the gate named in their transmission and signal the runner inside the striped zone. Try the encore case offline, explore the processor replay, and compare your initial laptop with the budget-matched recommendation. Judge mode equips the event recorder and starts at the witness call. Step controls support an untimed presentation.

## Inference and assets

Player clue → CLIP text encoder (local WebAssembly worker) → cosine ranking against 42 normalized CLIP image embeddings → visual inspection and pinning.

The supplied station image is the opening backdrop. The 42 fictional evidence photos come from two original generated contact sheets. Slate Air is fictional. The Acer and ASUS configurations use indicative retail prices. Their field software and illustrated product art belong to the game. The closing ASUS listing is a real example checked 25 November 2026. Models are [Xenova's ONNX conversion](https://huggingface.co/Xenova/clip-vit-base-patch32) of [OpenAI CLIP ViT-B/32](https://github.com/openai/CLIP). Fonts are distributed locally through Fontsource.

To regenerate the index, place the checkpoint's quantized vision ONNX file in `tools/vision/onnx/vision_model_quantized.onnx`. Place the matching tokenizer, config, preprocessor config and quantized text ONNX under `public/models/clip`. Run `npm run index`, then rebuild. The public game ships only the text encoder and the prepared visual index.

## Evidence and hardware

`npm run verify` builds the production game and exercises the story, incorrect evidence, pinned comparison, low-budget outcome, offline query, offline reload and responsive widths in installed Chrome. It writes screenshots and four retrieval probes under `qa/`. These probes describe this gallery only.

The player’s score comes from actual time, attempts, hints and searches. The browser benchmark is text-query latency. The public game has no native Intel NPU bridge. For hardware testing, run the optional OpenVINO tool below on a compatible Core Ultra machine with its NPU driver. It attempts explicit CPU and NPU compilation and reports actual wall time or a device-specific error. Compare across laptops only after using identical inputs and software.

```
python -m pip install openvino pillow numpy
python tools/benchmark.py
```

The creativity demonstration is the witness-based evidence comparison. Purchase persuasion comes from revisiting the initial pick with a budget and a personal task. Real paired encoders and disconnected inference demonstrate technical accuracy. Competitive superiority requires further comparable hardware measurements.


## Verified run

Chrome completed all seven chapters on the production build, including wrong evidence, comparison, a fresh offline search and a second offline search after reload. The archive passed width checks at 390, 768, 1440 and 1920 pixels. Across four labelled queries, an expected image ranked first for three and in the first five for all four. The umbrella ranked second. For the black case and blue bench query, the plain case ranked first and the stickered case fourth, so visual inspection mattered.

On the AMD Ryzen 7 7840HS build machine, one CPU indexing pass processed 42 photos in 1.27 seconds after model loading. This includes decoding, preprocessing and inference. It is a single observation. The native OpenVINO comparison has not been run on Intel hardware. Its tool saves a report in public/openvino.json for the next build.

The recommendation catalogue also includes the Acer Swift Go 14 NX.KSMSI.002 at an indicative ₹75,990 from Vijay Sales. Both retailer links are available on the relevant recommendation card.
