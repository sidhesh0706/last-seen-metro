"""Time actual vision-encoder inference on a shared photo batch with OpenVINO."""
import json
import platform
import time
from pathlib import Path

import numpy as np
import openvino as ov
from PIL import Image

root = Path(__file__).resolve().parents[1]
config = json.loads((root / "public/models/clip/preprocessor_config.json").read_text())
mean = np.array(config["image_mean"], dtype=np.float32)
std = np.array(config["image_std"], dtype=np.float32)
batch = []
for path in sorted((root / "public/photos").glob("*.webp")):
    with Image.open(path) as image:
        pixels = np.asarray(image.convert("RGB").resize((224, 224), Image.Resampling.BICUBIC))
    batch.append(((pixels.astype(np.float32) / 255 - mean) / std).transpose(2, 0, 1)[None].copy())
core = ov.Core()
model = core.read_model(root / "tools/vision/onnx/vision_model_quantized.onnx")
model.reshape({model.input(0): [1, 3, 224, 224]})
report = {"host": platform.machine(), "openvino": ov.__version__, "photos": len(batch), "devices": {}}
for device in ("CPU", "NPU"):
    try:
        compiled = core.compile_model(model, device)
        compiled([batch[0]])
        runs = []
        for _ in range(3):
            start = time.perf_counter()
            for frame in batch:
                compiled([frame])
            runs.append(round(time.perf_counter() - start, 4))
        report["devices"][device] = {"name": core.get_property(device, "FULL_DEVICE_NAME"), "seconds_per_batch": runs}
    except Exception as error:
        report["devices"][device] = {"unavailable": str(error)}
print(json.dumps(report, indent=2))
(root / "public/openvino.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

