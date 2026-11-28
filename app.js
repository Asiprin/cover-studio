const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const RATIOS = {
  "portrait-3-4": {
    label: "3:4",
    width: 1080,
    height: 1440,
    layout: { titleY: 0.125, mediaY: 0.35, mediaHeight: 0.58, mediaInset: 0.075, titleWidth: 0.86, personWidth: 0.58 }
  },
  "landscape-4-3": {
    label: "4:3",
    width: 1440,
    height: 1080,
    layout: { titleY: 0.105, mediaY: 0.34, mediaHeight: 0.59, mediaInset: 0.075, titleWidth: 0.86, personWidth: 0.30 }
  },
  "portrait-9-16": {
    label: "9:16",
    width: 1080,
    height: 1920,
    layout: { titleY: 0.125, mediaY: 0.35, mediaHeight: 0.58, mediaInset: 0.075, titleWidth: 0.86, personWidth: 0.55 }
  },
  "landscape-3-2": {
    label: "3:2",
    width: 1620,
    height: 1080,
    layout: { titleY: 0.105, mediaY: 0.35, mediaHeight: 0.58, mediaInset: 0.045, titleWidth: 0.9, personWidth: 0.30 }
  },
  "landscape-16-9": {
    label: "16:9",
    width: 1920,
    height: 1080,
    layout: { titleY: 0.105, mediaY: 0.35, mediaHeight: 0.58, mediaInset: 0.055, titleWidth: 0.9, personWidth: 0.28 }
  },
  "square-1-1": {
    label: "1:1",
    width: 1080,
    height: 1080,
    layout: { titleY: 0.12, mediaY: 0.35, mediaHeight: 0.57, mediaInset: 0.07, titleWidth: 0.78, titleAlign: "center", personWidth: 0.50 }
  },
  "wechat-21-9": {
    label: "21:9",
    width: 2100,
    height: 900,
    layout: { titleY: 0.105, mediaY: 0.35, mediaHeight: 0.58, mediaInset: 0.035, titleWidth: 0.92, personWidth: 0.26 }
  }
};

const state = {
  activeRatio: "portrait-3-4",
  sceneImage: null,
  personImage: null,
  personCutout: null,
  personOriginalCutout: null,
  personAdjustedCutout: null,
  personMatteMask: null,
  personFiltered: null,
  personBounds: null,
  personDrawTransform: null,
  matteTool: "none",
  matteStroke: null,
  personFilterDirty: true,
  personFilterTimer: null,
  cutoutMode: "等待上传",
  template: "classic",
  layoutLocked: true,
  sceneDrag: null,
  titleHitAreas: [],
  pendingTextClick: null,
  textEditorOriginal: "",
  zoom: 1,
  renderQueued: false
};

const defaults = {
  line1Input: "年底团建火锅",
  line2Input: "我第一筷子不夹肉",
  fontFamily: "Source Han Serif CN",
  fontWeight: "900",
  backgroundColor: "#eef0ec",
  outlineColor: "#ffffff",
  outlineStyle: "fold",
  outlineWidth: "28",
  edgePrecision: "82",
  personScale: "100",
  personX: "78",
  personY: "95",
  textColor: "#101110",
  markerColor: "#ffc94d",
  markerStyle: "marker",
  titleScale: "100",
  titleY: "14",
  markerHeight: "70",
  brushX: "0",
  brushY: "25",
  mediaHeight: "58",
  mediaY: "35",
  brightness: "100",
  backgroundContrast: "100",
  saturation: "100",
  backgroundHighlight: "0",
  backgroundShadow: "0",
  backgroundTemperature: "0",
  backgroundBlur: "0",
  vignette: "18",
  backgroundFilterPreset: "clean",
  sceneScale: "110",
  sceneX: "0",
  sceneY: "0",
  personFilterPreset: "clean",
  skinSmooth: "22",
  skinWhite: "10",
  personHighlight: "0",
  personShadow: "0",
  personBrightness: "2",
  personContrast: "5",
  personSaturation: "4",
  personTemperature: "2",
  personSharpen: "18",
  matteBrushSize: "48"
};

const formIds = Object.keys(defaults);
const PERSON_FILTER_IDS = new Set([
  "skinSmooth",
  "skinWhite",
  "personHighlight",
  "personShadow",
  "personBrightness",
  "personContrast",
  "personSaturation",
  "personTemperature",
  "personSharpen"
]);
const BACKGROUND_FILTER_IDS = new Set([
  "brightness",
  "backgroundContrast",
  "saturation",
  "backgroundHighlight",
  "backgroundShadow",
  "backgroundTemperature",
  "backgroundBlur",
  "vignette"
]);

const PERSON_FILTER_PRESETS = {
  clean: {
    skinSmooth: 22,
    skinWhite: 10,
    personBrightness: 2,
    personContrast: 5,
    personSaturation: 4,
    personTemperature: 2,
    personSharpen: 18
  },
  cream: {
    skinSmooth: 56,
    skinWhite: 18,
    personBrightness: 5,
    personContrast: -3,
    personSaturation: -5,
    personTemperature: 7,
    personSharpen: 8
  },
  film: {
    skinSmooth: 12,
    skinWhite: 0,
    personBrightness: -2,
    personContrast: 15,
    personSaturation: -8,
    personTemperature: -3,
    personSharpen: 36
  },
  cool: {
    skinSmooth: 30,
    skinWhite: 24,
    personBrightness: 3,
    personContrast: 7,
    personSaturation: -4,
    personTemperature: -12,
    personSharpen: 22
  },
  warm: {
    skinSmooth: 34,
    skinWhite: 12,
    personBrightness: 7,
    personContrast: 8,
    personSaturation: 16,
    personTemperature: 28,
    personSharpen: 24
  },
  vintage: {
    skinSmooth: 18,
    skinWhite: 0,
    personBrightness: -4,
    personContrast: 22,
    personSaturation: -22,
    personTemperature: 18,
    personSharpen: 48
  },
  punch: {
    skinSmooth: 8,
    skinWhite: 6,
    personBrightness: -2,
    personContrast: 38,
    personSaturation: 28,
    personTemperature: -5,
    personSharpen: 72
  },
  soft: {
    skinSmooth: 92,
    skinWhite: 34,
    personBrightness: 12,
    personContrast: -12,
    personSaturation: -8,
    personTemperature: 10,
    personSharpen: 0
  },
  none: {
    skinSmooth: 0,
    skinWhite: 0,
    personBrightness: 0,
    personContrast: 0,
    personSaturation: 0,
    personTemperature: 0,
    personSharpen: 0
  }
};

const BACKGROUND_FILTER_PRESETS = {
  clean: {
    brightness: 104,
    backgroundContrast: 104,
    saturation: 106,
    backgroundTemperature: 0,
    backgroundBlur: 0,
    vignette: 12
  },
  warmCinema: {
    brightness: 98,
    backgroundContrast: 112,
    saturation: 95,
    backgroundTemperature: 18,
    backgroundBlur: 0,
    vignette: 28
  },
  cool: {
    brightness: 102,
    backgroundContrast: 108,
    saturation: 92,
    backgroundTemperature: -18,
    backgroundBlur: 0,
    vignette: 20
  },
  vintage: {
    brightness: 96,
    backgroundContrast: 108,
    saturation: 78,
    backgroundTemperature: 12,
    backgroundBlur: 2,
    vignette: 35
  },
  vivid: {
    brightness: 103,
    backgroundContrast: 112,
    saturation: 135,
    backgroundTemperature: 3,
    backgroundBlur: 0,
    vignette: 16
  },
  soft: {
    brightness: 106,
    backgroundContrast: 92,
    saturation: 88,
    backgroundTemperature: 5,
    backgroundBlur: 12,
    vignette: 10
  },
  none: {
    brightness: 100,
    backgroundContrast: 100,
    saturation: 100,
    backgroundTemperature: 0,
    backgroundBlur: 0,
    vignette: 0
  }
};
const canvas = $("#coverCanvas");
const context = canvas.getContext("2d");
let toastTimer;
let segmentationModel;
let rmbgSession;
let modelLoadPromise;
let segmentationBusy = false;
let templatePage = 0;
const templatePageSize = 2;
let historyStack = [];
let historyIndex = -1;
let historyTimer = null;
let restoringHistory = false;
const assetIds = new WeakMap();
let nextAssetId = 1;

const RMBG_MODEL_URL = "./models/model_quantized.onnx";
const ORT_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js";
const ORT_WASM_PATH = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/";
const MEDIAPIPE_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
const LUCIDE_SCRIPT_URL = "https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js";

const TEMPLATE_STYLES = {
  classic: {
    family: "classic",
    fontFamily: "Source Han Serif CN",
    fontWeight: "900",
    backgroundColor: "#eef0ec",
    textColor: "#101110",
    markerColor: "#ffc94d",
    markerTextColor: "#101110",
    markerStyle: "marker",
    markerHeight: "70",
    brushY: "25",
    titleScale: "100",
    titleY: "14",
    mediaY: "35",
    mediaHeight: "58",
    outlineColor: "#ffffff"
  },
  "ink-classic": {
    family: "editorial",
    fontFamily: "Source Han Serif CN",
    fontWeight: "500",
    backgroundColor: "#f1efea",
    textColor: "#0a0a0b",
    markerColor: "#111111",
    markerStyle: "underline",
    markerHeight: "72",
    titleScale: "94",
    titleY: "11",
    mediaY: "36",
    mediaHeight: "56",
    outlineColor: "#f1efea"
  },
  "indigo-porcelain": {
    family: "editorial",
    fontFamily: "Source Han Serif CN",
    fontWeight: "500",
    backgroundColor: "#f1f3f5",
    textColor: "#0a1f3d",
    markerColor: "#315d93",
    markerStyle: "underline",
    markerHeight: "68",
    titleScale: "92",
    titleY: "10",
    mediaY: "37",
    mediaHeight: "55",
    outlineColor: "#f1f3f5"
  },
  "forest-ink": {
    family: "editorial",
    fontFamily: "Source Han Serif CN",
    fontWeight: "500",
    backgroundColor: "#f5f1e8",
    textColor: "#1a2e1f",
    markerColor: "#2e6b4f",
    markerStyle: "underline",
    markerHeight: "70",
    titleScale: "93",
    titleY: "11",
    mediaY: "36",
    mediaHeight: "56",
    outlineColor: "#f5f1e8"
  },
  "kraft-paper": {
    family: "editorial",
    fontFamily: "Source Han Serif CN",
    fontWeight: "500",
    backgroundColor: "#eedfc7",
    textColor: "#2a1e13",
    markerColor: "#9b5a2e",
    markerStyle: "marker",
    markerHeight: "66",
    titleScale: "92",
    titleY: "10",
    mediaY: "37",
    mediaHeight: "55",
    outlineColor: "#eedfc7"
  },
  "dune": {
    family: "editorial",
    fontFamily: "Source Han Serif CN",
    fontWeight: "500",
    backgroundColor: "#f0e6d2",
    textColor: "#1f1a14",
    markerColor: "#8f7650",
    markerStyle: "underline",
    markerHeight: "68",
    titleScale: "94",
    titleY: "11",
    mediaY: "36",
    mediaHeight: "56",
    outlineColor: "#f0e6d2"
  },
  "midnight-ink": {
    family: "midnight",
    fontFamily: "Source Han Serif CN",
    fontWeight: "500",
    backgroundColor: "#0e0d0c",
    textColor: "#ece2cf",
    markerColor: "#d4a04a",
    markerStyle: "underline",
    markerHeight: "70",
    titleScale: "94",
    titleY: "11",
    mediaY: "37",
    mediaHeight: "56",
    outlineColor: "#ece2cf"
  },
  "ikb": {
    family: "swiss",
    fontFamily: "PingFang SC",
    fontWeight: "300",
    backgroundColor: "#fafaf8",
    textColor: "#0a0a0a",
    markerColor: "#002fa7",
    markerTextColor: "#ffffff",
    markerStyle: "highlight",
    markerHeight: "54",
    titleScale: "98",
    titleY: "11",
    mediaY: "37",
    mediaHeight: "56",
    outlineColor: "#fafaf8"
  },
  "lemon": {
    family: "swiss",
    fontFamily: "PingFang SC",
    fontWeight: "300",
    backgroundColor: "#fafaf8",
    textColor: "#0a0a0a",
    markerColor: "#ffd500",
    markerTextColor: "#0a0a0a",
    markerStyle: "highlight",
    markerHeight: "56",
    titleScale: "98",
    titleY: "10",
    mediaY: "38",
    mediaHeight: "55",
    outlineColor: "#fafaf8"
  },
  "safety-orange": {
    family: "swiss",
    fontFamily: "PingFang SC",
    fontWeight: "300",
    backgroundColor: "#fafaf8",
    textColor: "#0a0a0a",
    markerColor: "#ff6b35",
    markerTextColor: "#ffffff",
    markerStyle: "highlight",
    markerHeight: "54",
    titleScale: "97",
    titleY: "11",
    mediaY: "37",
    mediaHeight: "56",
    outlineColor: "#fafaf8"
  }
};

function init() {
  loadLucideIcons().catch((error) => console.warn("Icons could not be loaded.", error));
  bindTheme();
  bindUploads();
  bindControls();
  bindTemplatePresets();
  bindTemplatePager();
  bindRightTabs();
  bindCanvasTools();
  bindPhotoGestures();
  bindCanvasTextEditor();
  bindMatteTools();
  bindHistoryControls();
  loadSettings();
  applyLayoutLock();
  syncAllOutputs();
  render();
  scheduleHistoryCommit(0);
}

async function loadLucideIcons() {
  if (!window.lucide) await loadScript(LUCIDE_SCRIPT_URL);
  if (window.lucide) window.lucide.createIcons();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find((script) => script.src === src);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Script failed to load: ${src}`)), { once: true });
    document.head.append(script);
  });
}

function bindTheme() {
  const savedTheme = localStorage.getItem("cover-studio-theme");
  const theme = savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  setTheme(theme);

  $$(".theme-button").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.theme));
  });
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cover-studio-theme", theme);
  $$(".theme-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === theme);
  });
}

function bindUploads() {
  bindDropZone($("#sceneDrop"), $("#sceneInput"), handleSceneFile);
  bindDropZone($("#personDrop"), $("#personInput"), handlePersonFile);
}

function bindDropZone(zone, input, handler) {
  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove("is-dragging");
    });
  });

  zone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    if (file) handler(file);
  });

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) handler(file);
  });
}

async function handleSceneFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("请选择图片文件");
    return;
  }

  const image = await loadImageFromFile(file);
  state.sceneImage = image;
  $("#sceneFileName").textContent = file.name;
  queueRender();
  scheduleHistoryCommit(80);
  showToast("场景图片已载入");
}

async function handlePersonFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("请选择图片文件");
    return;
  }

  setPersonStatus("working", "AI 正在识别人物...");
  $("#personFileName").textContent = file.name;

  try {
    const image = await loadImageFromFile(file);
    state.personImage = image;
    await recutPerson();
    scheduleHistoryCommit(120);
    showToast("人物调节完成");
  } catch (error) {
    console.error(error);
    setPersonStatus("idle", "处理失败，请换一张图片");
    showToast("人物处理失败");
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败"));
    };
    image.src = url;
  });
}

async function recutPerson() {
  if (!state.personImage) {
    showToast("请先上传人物图片");
    return;
  }
  if (segmentationBusy) return;
  segmentationBusy = true;
  const button = $("#recutButton");
  button.disabled = true;
  let completed = false;
  setPersonStatus("working", "正在加载 RMBG-1.4 模型...");
  showToast("正在重新抠图，请稍候");
  await document.fonts.ready.catch(() => {});

  try {
    const result = await segmentWithRMBG(state.personImage);
    state.personCutout = result.canvas;
    state.personBounds = result.bounds;
    state.cutoutMode = "RMBG-1.4";
    setPersonStatus("ready", "RMBG-1.4 抠图完成");
    completed = true;
  } catch (error) {
    console.warn("RMBG-1.4 is unavailable, trying the fallback model.", error);
    setPersonStatus("working", "RMBG 不可用，正在使用备用模型...");
    try {
      const result = await segmentWithMediaPipe(state.personImage);
      state.personCutout = result.canvas;
      state.personBounds = result.bounds;
      state.cutoutMode = "MediaPipe";
      setPersonStatus("ready", "已使用备用人物模型");
      completed = true;
    } catch (fallbackError) {
      console.warn("Fallback segmentation unavailable, using local edge fallback.", fallbackError);
      const result = segmentWithLocalEdge(state.personImage);
      state.personCutout = result.canvas;
      state.personBounds = result.bounds;
      state.cutoutMode = "本地边缘";
      setPersonStatus("ready", "已使用本地边缘抠图");
      completed = true;
    }
  } finally {
    segmentationBusy = false;
    button.disabled = false;
    if (completed && state.personCutout) {
      state.personOriginalCutout = cloneCanvas(state.personCutout);
      state.personMatteMask = createWhiteMask(state.personCutout.width, state.personCutout.height);
      state.personAdjustedCutout = cloneCanvas(state.personCutout);
      flashCanvasUpdate();
      showToast("人物调节已更新");
      scheduleHistoryCommit(120);
    }
    state.personFiltered = null;
    state.personFilterDirty = true;
    schedulePersonFilter(0);
    queueRender();
  }
}

function createWhiteMask(width, height) {
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const context = mask.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  return mask;
}

function cloneCanvas(sourceCanvas) {
  const clone = document.createElement("canvas");
  clone.width = sourceCanvas.width;
  clone.height = sourceCanvas.height;
  clone.getContext("2d").drawImage(sourceCanvas, 0, 0);
  return clone;
}

function flashCanvasUpdate() {
  const shell = $("#canvasShell");
  shell.classList.remove("canvas-updated");
  void shell.offsetWidth;
  shell.classList.add("canvas-updated");
  setTimeout(() => shell.classList.remove("canvas-updated"), 700);
}

function setPersonStatus(type, text) {
  const dot = $("#personStatusDot");
  dot.className = "status-dot";
  if (type === "working") dot.classList.add("is-working");
  if (type === "ready") dot.classList.add("is-ready");

  $("#aiStatus").innerHTML = `<i data-lucide="${type === "ready" ? "badge-check" : type === "working" ? "loader-circle" : "sparkles"}"></i><span>${text}</span>`;
  if (window.lucide) window.lucide.createIcons();
}

async function segmentWithRMBG(image) {
  if (!rmbgSession) {
    rmbgSession = await loadRMBGSession();
  }

  const maxDimension = 1400;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  source.getContext("2d").drawImage(image, 0, 0, width, height);

  const inputSize = 1024;
  const inputCanvas = document.createElement("canvas");
  inputCanvas.width = inputSize;
  inputCanvas.height = inputSize;
  const inputContext = inputCanvas.getContext("2d", { willReadFrequently: true });
  inputContext.drawImage(source, 0, 0, inputSize, inputSize);
  const pixels = inputContext.getImageData(0, 0, inputSize, inputSize).data;
  const input = new Float32Array(3 * inputSize * inputSize);
  const planeSize = inputSize * inputSize;

  for (let pixelIndex = 0; pixelIndex < planeSize; pixelIndex += 1) {
    const rgbaIndex = pixelIndex * 4;
    input[pixelIndex] = pixels[rgbaIndex] / 255 - 0.5;
    input[planeSize + pixelIndex] = pixels[rgbaIndex + 1] / 255 - 0.5;
    input[planeSize * 2 + pixelIndex] = pixels[rgbaIndex + 2] / 255 - 0.5;
  }

  const inputTensor = new window.ort.Tensor("float32", input, [1, 3, inputSize, inputSize]);
  const feeds = {};
  feeds[rmbgSession.inputNames[0]] = inputTensor;
  const results = await rmbgSession.run(feeds);
  const outputTensor = results[rmbgSession.outputNames[0]];
  const output = outputTensor.data;
  const outputPlaneSize = output.length >= planeSize ? planeSize : output.length;
  let minimum = Infinity;
  let maximum = -Infinity;

  for (let index = 0; index < outputPlaneSize; index += 1) {
    const value = Number(output[index]);
    if (value < minimum) minimum = value;
    if (value > maximum) maximum = value;
  }

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = inputSize;
  maskCanvas.height = inputSize;
  const maskContext = maskCanvas.getContext("2d");
  const maskImage = maskContext.createImageData(inputSize, inputSize);
  const range = maximum - minimum;

  for (let index = 0; index < planeSize; index += 1) {
    const value = range > 0.00001 ? (Number(output[index]) - minimum) / range : 0;
    const alpha = Math.max(0, Math.min(255, Math.round(value * 255)));
    const rgbaIndex = index * 4;
    maskImage.data[rgbaIndex] = 255;
    maskImage.data[rgbaIndex + 1] = 255;
    maskImage.data[rgbaIndex + 2] = 255;
    maskImage.data[rgbaIndex + 3] = alpha;
  }

  maskContext.putImageData(maskImage, 0, 0);
  return composeCutout(source, maskCanvas, width, height);
}

async function loadRMBGSession() {
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    if (!window.ort) {
      updateModelProgress(0, "正在加载推理引擎");
      await loadScript(ORT_SCRIPT_URL);
    }

    window.ort.env.wasm.wasmPaths = ORT_WASM_PATH;
    window.ort.env.wasm.numThreads = 1;
    updateModelProgress(0, "正在读取本地模型");

    const response = await fetch(RMBG_MODEL_URL);
    if (!response.ok) {
      throw new Error(`Model download failed: ${response.status}`);
    }

    const expectedSize = 44403226;
    const total = Number(response.headers.get("content-length")) || expectedSize;
    const chunks = [];
    let received = 0;

    if (response.body && response.body.getReader) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        updateModelProgress(received / total * 88, `正在下载 ${formatBytes(received)} / ${formatBytes(total)}`);
      }
    } else {
      const buffer = await response.arrayBuffer();
      chunks.push(new Uint8Array(buffer));
      received = buffer.byteLength;
    }

    const modelBuffer = concatBytes(chunks);
    updateModelProgress(92, "正在初始化推理引擎");
    const sessionOptions = {
      executionProviders: navigator.gpu ? ["webgpu", "wasm"] : ["wasm"],
      graphOptimizationLevel: "all"
    };

    let session;
    try {
      session = await window.ort.InferenceSession.create(modelBuffer, sessionOptions);
    } catch (error) {
      console.warn("RMBG WebGPU session failed, retrying with WASM.", error);
      session = await window.ort.InferenceSession.create(modelBuffer, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all"
      });
    }

    updateModelProgress(100, "本地模型就绪");
    return session;
  })();

  try {
    return await modelLoadPromise;
  } catch (error) {
    modelLoadPromise = null;
    updateModelProgress(0, "模型加载失败，已切换备用方案");
    throw error;
  }
}

function updateModelProgress(percent, label) {
  const progress = $("#modelProgress");
  const safePercent = Math.max(0, Math.min(100, percent));
  progress.hidden = false;
  $("#modelProgressBar").style.width = `${safePercent}%`;
  $("#modelProgressValue").textContent = `${Math.round(safePercent)}%`;
  progress.querySelector("span").textContent = label;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

async function segmentWithMediaPipe(image) {
  if (!window.SelfieSegmentation) {
    await loadScript(MEDIAPIPE_SCRIPT_URL);
  }
  if (!window.SelfieSegmentation) {
    throw new Error("SelfieSegmentation is not available");
  }

  if (!segmentationModel) {
    segmentationModel = new window.SelfieSegmentation({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });
    segmentationModel.setOptions({ modelSelection: 1 });
  }

  const maxDimension = 1400;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  source.getContext("2d").drawImage(image, 0, 0, width, height);

  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Segmentation timeout")), 12000);
    segmentationModel.onResults((results) => {
      clearTimeout(timeout);
      const maskContext = mask.getContext("2d");
      maskContext.drawImage(results.segmentationMask, 0, 0, width, height);
      resolve();
    });
    segmentationModel.send({ image: source }).catch(reject);
  });

  return composeCutout(source, convertMaskToAlpha(mask), width, height);
}

function convertMaskToAlpha(maskCanvas) {
  const width = maskCanvas.width;
  const height = maskCanvas.height;
  const maskContext = maskCanvas.getContext("2d");
  const pixels = maskContext.getImageData(0, 0, width, height);
  const data = pixels.data;

  for (let index = 0; index < data.length; index += 4) {
    const value = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = Math.max(0, Math.min(255, value * 1.18 - 14));
  }

  maskContext.putImageData(pixels, 0, 0);
  return maskCanvas;
}

function segmentWithLocalEdge(image) {
  const maxDimension = 1200;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext("2d");
  sourceContext.drawImage(image, 0, 0, width, height);

  const imageData = sourceContext.getImageData(0, 0, width, height);
  const data = imageData.data;
  const borderSamples = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 80));

  for (let x = 0; x < width; x += step) {
    borderSamples.push(pixelAt(data, width, x, 0));
    borderSamples.push(pixelAt(data, width, x, height - 1));
  }
  for (let y = 0; y < height; y += step) {
    borderSamples.push(pixelAt(data, width, 0, y));
    borderSamples.push(pixelAt(data, width, width - 1, y));
  }

  const average = borderSamples.reduce((sum, color) => {
    sum[0] += color[0];
    sum[1] += color[1];
    sum[2] += color[2];
    return sum;
  }, [0, 0, 0]).map((value) => value / borderSamples.length);

  const precision = Number($("#edgePrecision").value);
  const threshold = 84 - precision * 0.58;
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const maskContext = mask.getContext("2d");
  const maskData = maskContext.createImageData(width, height);

  for (let index = 0; index < data.length; index += 4) {
    const distance = Math.sqrt(
      (data[index] - average[0]) ** 2 +
      (data[index + 1] - average[1]) ** 2 +
      (data[index + 2] - average[2]) ** 2
    );
    const alpha = smoothstep(threshold - 14, threshold + 30, distance) * 255;
    maskData.data[index] = 255;
    maskData.data[index + 1] = 255;
    maskData.data[index + 2] = 255;
    maskData.data[index + 3] = alpha;
  }

  maskContext.putImageData(maskData, 0, 0);
  return composeCutout(source, mask, width, height);
}

function pixelAt(data, width, x, y) {
  const index = (y * width + x) * 4;
  return [data[index], data[index + 1], data[index + 2]];
}

function smoothstep(edge0, edge1, value) {
  const normalized = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return normalized * normalized * (3 - 2 * normalized);
}

function composeCutout(source, alphaMask, width, height) {
  const cutout = document.createElement("canvas");
  cutout.width = width;
  cutout.height = height;
  const cutoutContext = cutout.getContext("2d");
  cutoutContext.drawImage(source, 0, 0);
  const cleanMask = cleanMaskCanvas(alphaMask);
  cutoutContext.globalCompositeOperation = "destination-in";
  cutoutContext.drawImage(cleanMask, 0, 0, width, height);
  cutoutContext.filter = "none";
  cutoutContext.globalCompositeOperation = "source-over";

  return {
    canvas: cutout,
    bounds: findAlphaBounds(cutout)
  };
}

function cleanMaskCanvas(maskCanvas) {
  const width = maskCanvas.width;
  const height = maskCanvas.height;
  const context = maskCanvas.getContext("2d", { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, width, height);
  const alpha = new Uint8Array(width * height);
  for (let index = 0; index < alpha.length; index += 1) {
    const value = pixels.data[index * 4 + 3] / 255;
    alpha[index] = Math.max(0, Math.min(255, Math.round(smoothstep(0.08, 0.58, value) * 255)));
    pixels.data[index * 4 + 3] = alpha[index];
  }

  const cleaned = document.createElement("canvas");
  cleaned.width = width;
  cleaned.height = height;
  cleaned.getContext("2d").putImageData(pixels, 0, 0);
  return cleaned;
}

function findAlphaBounds(sourceCanvas) {
  const context = sourceCanvas.getContext("2d");
  const { width, height } = sourceCanvas;
  const data = context.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function bindControls() {
  formIds.forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener("input", () => {
      if (id === "personFilterPreset") {
        applyPersonFilterPreset(input.value);
        return;
      }
      if (id === "backgroundFilterPreset") {
        applyBackgroundFilterPreset(input.value);
        return;
      }
      syncOutput(id);
      if (PERSON_FILTER_IDS.has(id)) {
        $("#personFilterPreset").value = "custom";
        state.personFilterDirty = true;
        schedulePersonFilter();
      } else if (BACKGROUND_FILTER_IDS.has(id)) {
        $("#backgroundFilterPreset").value = "custom";
        queueRender();
      } else {
        queueRender();
      }
      saveSettings();
    });
    input.addEventListener("change", queueRender);
  });

  $("#recutButton").addEventListener("click", recutPerson);
  $("#resetButton").addEventListener("click", resetSettings);
  $("#resetPersonFilter").addEventListener("click", () => applyPersonFilterPreset("clean"));
  $("#resetBackgroundFilter").addEventListener("click", () => applyBackgroundFilterPreset("clean"));
  $("#resetPhotoCrop").addEventListener("click", resetPhotoCrop);
  $("#toggleLayoutLock").addEventListener("click", toggleLayoutLock);

  $("#scanFontsButton").addEventListener("click", scanSystemFonts);

  $$("#personPresets button").forEach((button) => {
    button.addEventListener("click", () => {
      $$("#personPresets button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const preset = button.dataset.personPreset;
      const xValue = preset === "left" ? "24" : preset === "center" ? "50" : "78";
      $("#personX").value = xValue;
      syncOutput("personX");
      queueRender();
      saveSettings();
    });
  });

  $$(".ratio-tab").forEach((button) => {
    button.addEventListener("click", () => selectRatio(button.dataset.ratio));
  });
}

function applyPersonFilterPreset(presetName) {
  if (presetName === "custom") {
    state.personFilterDirty = true;
    schedulePersonFilter();
    saveSettings();
    return;
  }

  const preset = {
    personHighlight: 0,
    personShadow: 0,
    ...(PERSON_FILTER_PRESETS[presetName] || PERSON_FILTER_PRESETS.clean)
  };
  $("#personFilterPreset").value = presetName;
  Object.entries(preset).forEach(([id, value]) => {
    document.getElementById(id).value = String(value);
    syncOutput(id);
  });
  state.personFilterDirty = true;
  schedulePersonFilter(20);
  saveSettings();
  showToast(presetName === "none" ? "人像滤镜已关闭" : "人像滤镜预设已应用");
}

function bindTemplatePresets() {
  $$(".template-card").forEach((button) => {
    button.addEventListener("click", () => applyTemplate(button.dataset.template));
  });
}

function bindTemplatePager() {
  $("#templatePrev").addEventListener("click", () => setTemplatePage(templatePage - 1));
  $("#templateNext").addEventListener("click", () => setTemplatePage(templatePage + 1));
}

function setTemplatePage(page) {
  const cards = $$(".template-card");
  const pageCount = Math.max(1, Math.ceil(cards.length / templatePageSize));
  templatePage = Math.max(0, Math.min(pageCount - 1, page));
  cards.forEach((card, index) => {
    card.hidden = Math.floor(index / templatePageSize) !== templatePage;
  });
  $("#templatePageLabel").textContent = `${templatePage + 1} / ${pageCount}`;
  $("#templatePrev").disabled = templatePage === 0;
  $("#templateNext").disabled = templatePage === pageCount - 1;
}

function showTemplatePageForSelection() {
  const cards = $$(".template-card");
  const index = cards.findIndex((card) => card.dataset.template === state.template);
  setTemplatePage(Math.floor(Math.max(0, index) / templatePageSize));
}

function bindRightTabs() {
  $$(".right-tab").forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.rightTab;
      $$(".right-tab").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      $$(".right-tab-panel").forEach((panel) => {
        panel.hidden = panel.dataset.rightPanel !== tabName;
      });
    });
  });
}

function applyBackgroundFilterPreset(presetName) {
  if (presetName === "custom") {
    saveSettings();
    return;
  }

  const preset = {
    backgroundHighlight: 0,
    backgroundShadow: 0,
    ...(BACKGROUND_FILTER_PRESETS[presetName] || BACKGROUND_FILTER_PRESETS.clean)
  };
  $("#backgroundFilterPreset").value = presetName;
  Object.entries(preset).forEach(([id, value]) => {
    document.getElementById(id).value = String(value);
    syncOutput(id);
  });
  saveSettings();
  queueRender();
  showToast(presetName === "none" ? "背景滤镜已关闭" : "背景滤镜预设已应用");
}

function resetPhotoCrop() {
  $("#sceneScale").value = "110";
  $("#sceneX").value = "0";
  $("#sceneY").value = "0";
  ["sceneScale", "sceneX", "sceneY"].forEach(syncOutput);
  saveSettings();
  queueRender();
  showToast("照片裁切已重置");
}

function toggleLayoutLock() {
  state.layoutLocked = !state.layoutLocked;
  applyLayoutLock();
  saveSettings();
}

function applyLayoutLock() {
  const button = $("#toggleLayoutLock");
  $("#mediaHeight").disabled = state.layoutLocked;
  $("#mediaY").disabled = state.layoutLocked;
  button.classList.toggle("is-locked", state.layoutLocked);
  button.setAttribute("aria-pressed", String(state.layoutLocked));
  button.title = state.layoutLocked ? "解锁图片高度与位置" : "锁定图片高度与位置";
  button.innerHTML = `<i data-lucide="${state.layoutLocked ? "lock" : "unlock"}"></i><span>${state.layoutLocked ? "已锁定" : "未锁定"}</span>`;
  if (window.lucide) window.lucide.createIcons();
}

function bindPhotoGestures() {
  const rectForEvent = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height,
      cssWidth: rect.width,
      cssHeight: rect.height
    };
  };

  canvas.addEventListener("pointerdown", (event) => {
    const point = rectForEvent(event);
    if (state.matteTool !== "none" && state.personCutout && state.personDrawTransform) {
      const transform = state.personDrawTransform;
      const insidePerson = point.x >= transform.left && point.x <= transform.left + transform.width &&
        point.y >= transform.top && point.y <= transform.top + transform.height;
      if (insidePerson) {
        canvas.setPointerCapture(event.pointerId);
        state.matteStroke = {
          pointerId: event.pointerId,
          tool: state.matteTool,
          transform,
          bounds: transform.bounds,
          radius: Number($("#matteBrushSize").value) / 2 * transform.bounds.width / transform.width,
          last: mapPointToPersonSource(point, transform, transform.bounds)
        };
        applyMattePoint(state.matteStroke, state.matteStroke.last);
        return;
      }
    }
    const textHit = findTitleHit(point);
    if (textHit && state.matteTool === "none") {
      state.pendingTextClick = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        hit: textHit
      };
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (!state.sceneImage) return;
    const media = getMediaRect(RATIOS[state.activeRatio]);
    const inside = point.x >= media.x && point.x <= media.x + media.width && point.y >= media.y && point.y <= media.y + media.height;
    if (!inside) return;
    canvas.setPointerCapture(event.pointerId);
    state.sceneDrag = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      sceneX: Number($("#sceneX").value),
      sceneY: Number($("#sceneY").value)
    };
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (event) => {
    if (state.matteStroke && state.matteStroke.pointerId === event.pointerId) {
      const point = rectForEvent(event);
      continueMatteStroke(state.matteStroke, point);
      return;
    }
    if (!state.sceneDrag || state.sceneDrag.pointerId !== event.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    const deltaX = (event.clientX - state.sceneDrag.clientX) / rect.width * 200;
    const deltaY = (event.clientY - state.sceneDrag.clientY) / rect.height * 200;
    $("#sceneX").value = String(clamp(state.sceneDrag.sceneX + deltaX, -100, 100));
    $("#sceneY").value = String(clamp(state.sceneDrag.sceneY + deltaY, -100, 100));
    syncOutput("sceneX");
    syncOutput("sceneY");
    queueRender();
  });

  const endDrag = (event) => {
    if (state.matteStroke && state.matteStroke.pointerId === event.pointerId) {
      state.matteStroke = null;
      state.personBounds = findAlphaBounds(state.personAdjustedCutout || state.personCutout);
      state.personFiltered = null;
      state.personFilterDirty = true;
      schedulePersonFilter(60);
      queueRender();
      scheduleHistoryCommit(100);
      return;
    }
    if (state.pendingTextClick && state.pendingTextClick.pointerId === event.pointerId) {
      const moved = Math.hypot(event.clientX - state.pendingTextClick.clientX, event.clientY - state.pendingTextClick.clientY);
      const hit = state.pendingTextClick.hit;
      state.pendingTextClick = null;
      if (moved < 8) openCanvasTextEditor(hit);
      return;
    }
    if (!state.sceneDrag || state.sceneDrag.pointerId !== event.pointerId) return;
    state.sceneDrag = null;
    canvas.style.cursor = "grab";
    saveSettings();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("wheel", (event) => {
    if (!state.sceneImage) return;
    const point = rectForEvent(event);
    const media = getMediaRect(RATIOS[state.activeRatio]);
    const inside = point.x >= media.x && point.x <= media.x + media.width && point.y >= media.y && point.y <= media.y + media.height;
    if (!inside) return;
    event.preventDefault();
    const nextScale = clamp(Number($("#sceneScale").value) - event.deltaY * 0.06, 100, 220);
    $("#sceneScale").value = String(Math.round(nextScale));
    syncOutput("sceneScale");
    queueRender();
    saveSettings();
  }, { passive: false });
}

function mapPointToPersonSource(point, transform, bounds) {
  return {
    x: bounds.x + (point.x - transform.left) / transform.width * bounds.width,
    y: bounds.y + (point.y - transform.top) / transform.height * bounds.height
  };
}

function continueMatteStroke(stroke, point) {
  const sourcePoint = mapPointToPersonSource(point, stroke.transform, stroke.bounds);
  const distance = Math.hypot(sourcePoint.x - stroke.last.x, sourcePoint.y - stroke.last.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(2, stroke.radius * 0.38)));
  for (let index = 1; index <= steps; index += 1) {
    const x = stroke.last.x + (sourcePoint.x - stroke.last.x) * index / steps;
    const y = stroke.last.y + (sourcePoint.y - stroke.last.y) * index / steps;
    applyMattePoint(stroke, { x, y });
  }
  stroke.last = sourcePoint;
  state.personFiltered = null;
  queueRender();
}

function applyMattePoint(stroke, point) {
  const maskContext = state.personMatteMask.getContext("2d");
  const adjustedContext = state.personAdjustedCutout.getContext("2d");
  const radius = Math.max(2, stroke.radius);
  if (stroke.tool === "brush") {
    maskContext.save();
    maskContext.fillStyle = "#ffffff";
    maskContext.beginPath();
    maskContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
    maskContext.fill();
    maskContext.restore();

    adjustedContext.save();
    adjustedContext.beginPath();
    adjustedContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
    adjustedContext.clip();
    adjustedContext.drawImage(state.personOriginalCutout, 0, 0);
    adjustedContext.restore();
  } else {
    maskContext.save();
    maskContext.globalCompositeOperation = "destination-out";
    maskContext.beginPath();
    maskContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
    maskContext.fill();
    maskContext.restore();

    adjustedContext.save();
    adjustedContext.globalCompositeOperation = "destination-out";
    adjustedContext.beginPath();
    adjustedContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
    adjustedContext.fill();
    adjustedContext.restore();
  }
}

function findTitleHit(point) {
  return state.titleHitAreas.find((area) => (
    point.x >= area.x - 8 &&
    point.x <= area.x + area.width + 8 &&
    point.y >= area.y - 8 &&
    point.y <= area.y + area.height + 8
  ));
}

function bindCanvasTextEditor() {
  const editor = $("#canvasTextEditor");
  editor.addEventListener("input", () => {
    const inputId = editor.dataset.inputId;
    const input = document.getElementById(inputId);
    if (!input) return;
    input.value = editor.value;
    syncOutput(inputId);
    queueRender();
    saveSettings();
  });
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      editor.value = state.textEditorOriginal;
      const input = document.getElementById(editor.dataset.inputId);
      if (input) input.value = state.textEditorOriginal;
      editor.blur();
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      editor.blur();
    }
  });
  editor.addEventListener("blur", () => {
    editor.hidden = true;
    queueRender();
    scheduleHistoryCommit(80);
  });
}

function openCanvasTextEditor(hit) {
  const editor = $("#canvasTextEditor");
  const input = document.getElementById(hit.inputId);
  const canvasRect = canvas.getBoundingClientRect();
  const shellRect = $("#canvasShell").getBoundingClientRect();
  const scaleX = canvasRect.width / canvas.width;
  const scaleY = canvasRect.height / canvas.height;
  editor.dataset.inputId = hit.inputId;
  editor.value = input.value;
  state.textEditorOriginal = input.value;
  editor.hidden = false;
  editor.style.left = `${canvasRect.left - shellRect.left + hit.x * scaleX - 4}px`;
  editor.style.top = `${canvasRect.top - shellRect.top + hit.y * scaleY - 5}px`;
  editor.style.width = `${Math.max(140, hit.width * scaleX + 12)}px`;
  editor.style.height = `${Math.max(48, hit.height * scaleY + 10)}px`;
  editor.style.fontFamily = `"${$("#fontFamily").value}", serif`;
  editor.style.fontWeight = $("#fontWeight").value;
  editor.style.fontSize = `${Math.max(16, hit.height * scaleY * 0.72)}px`;
  editor.style.color = hit.inputId === "line2Input"
    ? (TEMPLATE_STYLES[state.template]?.markerTextColor || $("#textColor").value)
    : $("#textColor").value;
  editor.focus();
  editor.select();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyTemplate(templateName) {
  const template = TEMPLATE_STYLES[templateName];
  if (!template) return;
  state.template = templateName;

  Object.entries(template).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });

  $$(".template-card").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.template === templateName);
  });
  syncAllOutputs();
  saveSettings();
  queueRender();
  const templateLabel = $(`[data-template="${templateName}"] strong`)?.textContent || "新模板";
  showToast(`已切换到${templateLabel}`);
}

function bindCanvasTools() {
  $("#zoomOutButton").addEventListener("click", () => setZoom(state.zoom - 0.1));
  $("#zoomInButton").addEventListener("click", () => setZoom(state.zoom + 0.1));
  $("#fitButton").addEventListener("click", () => setZoom(1));
  $("#downloadCurrentButton").addEventListener("click", exportCurrent);
  $("#exportAllButton").addEventListener("click", exportAll);
}

function bindHistoryControls() {
  $("#undoButton").addEventListener("click", undoHistory);
  $("#redoButton").addEventListener("click", redoHistory);
}

function bindMatteTools() {
  $$("#matteTools button").forEach((button) => {
    button.addEventListener("click", () => setMatteTool(button.dataset.matteTool));
  });
  $("#resetMatteButton").addEventListener("click", resetMatte);
  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key.toLowerCase() === "b") setMatteTool("brush");
    if (event.key.toLowerCase() === "e") setMatteTool("erase");
    if (event.key.toLowerCase() === "v") setMatteTool("none");
  });
}

function setMatteTool(tool) {
  state.matteTool = tool;
  $$("#matteTools button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.matteTool === tool);
  });
  canvas.style.cursor = tool === "none" ? "grab" : "crosshair";
}

function resetMatte() {
  if (!state.personOriginalCutout) {
    showToast("请先上传并抠出人物");
    return;
  }
  state.personAdjustedCutout = cloneCanvas(state.personOriginalCutout);
  state.personMatteMask = createWhiteMask(state.personAdjustedCutout.width, state.personAdjustedCutout.height);
  state.personBounds = findAlphaBounds(state.personAdjustedCutout);
  state.personFiltered = null;
  state.personFilterDirty = true;
  schedulePersonFilter(0);
  queueRender();
  scheduleHistoryCommit(80);
  showToast("已恢复原始人物抠图");
}

function scheduleHistoryCommit(delay = 120) {
  if (restoringHistory) return;
  clearTimeout(historyTimer);
  historyTimer = setTimeout(commitHistory, delay);
}

function getAssetId(asset) {
  if (!asset) return 0;
  if (!assetIds.has(asset)) assetIds.set(asset, nextAssetId++);
  return assetIds.get(asset);
}

function createHistorySnapshot() {
  const controls = {};
  formIds.forEach((id) => {
    controls[id] = document.getElementById(id).value;
  });
  return {
    controls,
    activeRatio: state.activeRatio,
    template: state.template,
    layoutLocked: state.layoutLocked,
    zoom: state.zoom,
    sceneImage: state.sceneImage,
    personImage: state.personImage,
    personCutout: state.personCutout,
    personOriginalCutout: state.personOriginalCutout,
    personAdjustedCutout: state.personAdjustedCutout,
    personMatteMask: state.personMatteMask,
    personFiltered: state.personFiltered,
    personBounds: state.personBounds,
    cutoutMode: state.cutoutMode
  };
}

function snapshotSignature(snapshot) {
  return JSON.stringify({
    controls: snapshot.controls,
    activeRatio: snapshot.activeRatio,
    template: snapshot.template,
    layoutLocked: snapshot.layoutLocked,
    zoom: snapshot.zoom,
    sceneImage: getAssetId(snapshot.sceneImage),
    personImage: getAssetId(snapshot.personImage),
    personCutout: getAssetId(snapshot.personCutout),
    personOriginalCutout: getAssetId(snapshot.personOriginalCutout),
    personAdjustedCutout: getAssetId(snapshot.personAdjustedCutout),
    personMatteMask: getAssetId(snapshot.personMatteMask),
    personFiltered: getAssetId(snapshot.personFiltered)
  });
}

function commitHistory() {
  if (restoringHistory) return;
  const snapshot = createHistorySnapshot();
  const signature = snapshotSignature(snapshot);
  if (historyIndex >= 0 && snapshotSignature(historyStack[historyIndex]) === signature) {
    updateHistoryButtons();
    return;
  }
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(snapshot);
  if (historyStack.length > 50) historyStack.shift();
  historyIndex = historyStack.length - 1;
  updateHistoryButtons();
}

function restoreHistorySnapshot(snapshot) {
  if (!snapshot) return;
  restoringHistory = true;
  state.template = snapshot.template;
  state.layoutLocked = snapshot.layoutLocked;
  state.sceneImage = snapshot.sceneImage;
  state.personImage = snapshot.personImage;
  state.personCutout = snapshot.personCutout;
  state.personOriginalCutout = snapshot.personOriginalCutout;
  state.personAdjustedCutout = snapshot.personAdjustedCutout;
  state.personMatteMask = snapshot.personMatteMask;
  state.personFiltered = snapshot.personFiltered;
  state.personBounds = snapshot.personBounds;
  state.cutoutMode = snapshot.cutoutMode;
  Object.entries(snapshot.controls).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });
  selectRatio(snapshot.activeRatio);
  setZoom(snapshot.zoom);
  $$(".template-card").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.template === snapshot.template);
  });
  showTemplatePageForSelection();
  applyLayoutLock();
  syncAllOutputs();
  if (state.personCutout) schedulePersonFilter(0);
  queueRender();
  restoringHistory = false;
  updateHistoryButtons();
}

function undoHistory() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restoreHistorySnapshot(historyStack[historyIndex]);
}

function redoHistory() {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex += 1;
  restoreHistorySnapshot(historyStack[historyIndex]);
}

function updateHistoryButtons() {
  $("#undoButton").disabled = historyIndex <= 0;
  $("#redoButton").disabled = historyIndex < 0 || historyIndex >= historyStack.length - 1;
}

function setZoom(value) {
  state.zoom = Math.max(0.7, Math.min(1.35, Number(value.toFixed(2))));
  $("#canvasShell").style.transform = `scale(${state.zoom})`;
  $("#zoomLabel").textContent = state.zoom === 1 ? "适应" : `${Math.round(state.zoom * 100)}%`;
  scheduleHistoryCommit(180);
}

function selectRatio(id) {
  if (!RATIOS[id]) return;
  state.activeRatio = id;
  $$(".ratio-tab").forEach((button) => {
    const active = button.dataset.ratio === id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  const ratio = RATIOS[id];
  canvas.width = ratio.width;
  canvas.height = ratio.height;
  $("#canvasBadge").textContent = `${ratio.label} · ${ratio.width} × ${ratio.height}`;
  setZoom(1);
  queueRender();
}

function queueRender() {
  if (state.renderQueued) return;
  state.renderQueued = true;
  requestAnimationFrame(() => {
    state.renderQueued = false;
    render();
  });
}

function render(targetCanvas = canvas, ratioId = state.activeRatio) {
  const ratio = RATIOS[ratioId];
  const ctx = targetCanvas.getContext("2d");
  targetCanvas.width = ratio.width;
  targetCanvas.height = ratio.height;
  ctx.clearRect(0, 0, ratio.width, ratio.height);

  const backgroundColor = $("#backgroundColor").value;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, ratio.width, ratio.height);

  drawPaperTexture(ctx, ratio.width, ratio.height);
  drawMedia(ctx, ratio);
  drawPerson(ctx, ratio);
  drawTitle(ctx, ratio);
}

function drawPaperTexture(ctx, width, height) {
  const family = TEMPLATE_STYLES[state.template]?.family || "classic";
  ctx.save();
  if (family === "editorial" || family === "midnight") {
    const ink = family === "midnight" ? "#d4a04a" : "#5c4b3b";
    ctx.globalAlpha = family === "midnight" ? 0.07 : 0.055;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, width * 0.0012);
    for (let index = 0; index < 9; index += 1) {
      ctx.beginPath();
      const y = height * (0.08 + index * 0.11);
      ctx.moveTo(-width * 0.08, y);
      ctx.bezierCurveTo(width * 0.22, y - height * 0.06, width * 0.72, y + height * 0.07, width * 1.08, y - height * 0.01);
      ctx.stroke();
    }
  } else if (family === "swiss") {
    ctx.globalAlpha = 0.055;
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 1;
    const columns = 12;
    for (let index = 1; index < columns; index += 1) {
      const x = width * index / columns;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let index = 1; index < 12; index += 1) {
      const y = height * index / 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else {
    ctx.globalAlpha = 0.035;
    ctx.strokeStyle = "#15201c";
    ctx.lineWidth = 1;
    const step = Math.max(28, Math.round(width / 36));
    for (let x = -height; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
  }
  ctx.restore();
  drawTemplateMetadata(ctx, width, height);
}

function drawTemplateMetadata(ctx, width, height) {
  const templateStyle = TEMPLATE_STYLES[state.template] || TEMPLATE_STYLES.classic;
  const family = templateStyle.family || "classic";
  if (family === "classic") return;

  const accent = templateStyle.markerColor;
  const margin = width * 0.055;

  ctx.save();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.92;
  if (family === "swiss") {
    ctx.fillRect(margin, height * 0.078, width * 0.065, Math.max(4, width * 0.004));
    ctx.fillRect(width * 0.82, height * 0.042, width * 0.125, Math.max(2, width * 0.0016));
  } else {
    ctx.fillRect(margin, height * 0.078, Math.max(3, width * 0.003), height * 0.105);
    ctx.fillRect(margin, height * 0.915, width * 0.89, Math.max(1, width * 0.0014));
  }
  ctx.restore();
}

function drawMedia(ctx, ratio) {
  const { x, y, width, height } = getMediaRect(ratio);

  ctx.save();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.filter = [
    `brightness(${Number($("#brightness").value)}%)`,
    `contrast(${Number($("#backgroundContrast").value)}%)`,
    `saturate(${Number($("#saturation").value)}%)`,
    `blur(${Number($("#backgroundBlur").value) * 0.045}px)`
  ].join(" ");

  if (state.sceneImage) {
    drawImageCover(ctx, state.sceneImage, x, y, width, height);
  } else {
    const fallback = ctx.createLinearGradient(x, y, x + width, y + height);
    fallback.addColorStop(0, "#9eb6ac");
    fallback.addColorStop(0.55, "#53786e");
    fallback.addColorStop(1, "#1f3c35");
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, width, height);

    ctx.globalAlpha = 0.17;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, ratio.width * 0.002);
    for (let index = -4; index < 12; index += 1) {
      ctx.beginPath();
      ctx.moveTo(x + index * width / 8, y);
      ctx.lineTo(x + (index + 5) * width / 8, y + height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.max(18, ratio.width * 0.022)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText("上传场景图片", x + width / 2, y + height / 2);
  }

  ctx.filter = "none";
  drawTemperature(ctx, x, y, width, height);
  drawHighlightShadow(ctx, x, y, width, height);
  drawVignette(ctx, x, y, width, height);
  ctx.restore();
}

function drawHighlightShadow(ctx, x, y, width, height) {
  const highlight = Number($("#backgroundHighlight").value);
  const shadow = Number($("#backgroundShadow").value);

  ctx.save();
  if (highlight !== 0) {
    ctx.globalCompositeOperation = highlight > 0 ? "soft-light" : "multiply";
    ctx.globalAlpha = Math.abs(highlight) / 50 * 0.22;
    ctx.fillStyle = highlight > 0 ? "#ffffff" : "#242424";
    ctx.fillRect(x, y, width, height);
  }
  if (shadow !== 0) {
    ctx.globalCompositeOperation = shadow > 0 ? "screen" : "multiply";
    ctx.globalAlpha = Math.abs(shadow) / 50 * 0.12;
    ctx.fillStyle = shadow > 0 ? "#ffffff" : "#111111";
    ctx.fillRect(x, y, width, height);
  }
  ctx.restore();
}

function drawTemperature(ctx, x, y, width, height) {
  const temperature = Number($("#backgroundTemperature").value);
  if (temperature === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = Math.abs(temperature) / 30 * 0.32;
  ctx.fillStyle = temperature > 0 ? "#ff8a3d" : "#4b8dff";
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

function drawVignette(ctx, x, y, width, height) {
  const strength = Number($("#vignette").value) / 100;
  if (strength <= 0) return;

  const gradient = ctx.createRadialGradient(
    x + width / 2,
    y + height / 2,
    Math.min(width, height) * 0.18,
    x + width / 2,
    y + height / 2,
    Math.max(width, height) * 0.72
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.62, `rgba(0,0,0,${strength * 0.08})`);
  gradient.addColorStop(1, `rgba(0,0,0,${strength * 0.62})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
}

function getMediaRect(ratio) {
  const { width, height, layout } = ratio;
  const inset = width * layout.mediaInset;
  return {
    x: inset,
    y: height * (Number($("#mediaY").value) / 100),
    width: width - inset * 2,
    height: height * (Number($("#mediaHeight").value) / 100)
  };
}

function drawImageCover(ctx, image, x, y, width, height) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (imageRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  const scale = Number($("#sceneScale").value) / 100;
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const maxOffsetX = Math.max(0, (drawWidth - width) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - height) / 2);
  const offsetX = Number($("#sceneX").value) / 100 * maxOffsetX;
  const offsetY = Number($("#sceneY").value) / 100 * maxOffsetY;
  const drawX = x + (width - drawWidth) / 2 + offsetX;
  const drawY = y + (height - drawHeight) / 2 + offsetY;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
}

function drawTitle(ctx, ratio) {
  const { width, height, layout } = ratio;
  const line1 = $("#line1Input").value.trim() || "输入第一行文案";
  const line2 = $("#line2Input").value.trim();
  const fontFamily = $("#fontFamily").value;
  const fontWeight = $("#fontWeight").value;
  const titleScale = Number($("#titleScale").value) / 100;
  const titleYRatio = Number($("#titleY").value) / 100;
  let titleY = height * titleYRatio;
  const maxWidth = width * layout.titleWidth;
  const baseSize = Math.min(width * 0.125, height * 0.12) * titleScale;

  ctx.save();
  const centered = layout.titleAlign === "center";
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = "top";
  let firstSize = fitFont(ctx, line1, fontFamily, fontWeight, baseSize, maxWidth);
  let secondSize = line2 ? fitFont(ctx, line2, fontFamily, fontWeight, baseSize, maxWidth) : firstSize;
  let gap = Math.max(firstSize * 0.16, width * 0.014);
  const mediaTop = getMediaRect(ratio).y;
  const mediaGap = Math.max(height * 0.018, 18);
  const availableHeight = Math.max(firstSize * 0.75, mediaTop - titleY - mediaGap);
  const naturalHeight = firstSize + gap + (line2 ? secondSize : 0);
  if (naturalHeight > availableHeight) {
    const fitScale = Math.max(0.52, availableHeight / naturalHeight);
    firstSize *= fitScale;
    secondSize *= fitScale;
    gap *= fitScale;
  }
  const totalHeight = firstSize + gap + (line2 ? secondSize : 0);
  titleY = Math.max(height * 0.035, Math.min(titleY, mediaTop - totalHeight - mediaGap));
  const firstX = centered ? width / 2 : width * (1 - layout.titleWidth) / 2;
  const secondX = centered ? width / 2 : firstX;
  const firstWidth = measureTextWidth(ctx, line1, fontFamily, fontWeight, firstSize);
  const secondWidth = line2 ? measureTextWidth(ctx, line2, fontFamily, fontWeight, secondSize) : 0;
  state.titleHitAreas = [{
    inputId: "line1Input",
    x: centered ? firstX - firstWidth / 2 : firstX,
    y: titleY,
    width: firstWidth,
    height: firstSize * 1.08
  }];
  if (line2) {
    state.titleHitAreas.push({
      inputId: "line2Input",
      x: centered ? secondX - secondWidth / 2 : secondX,
      y: titleY + firstSize + gap,
      width: secondWidth,
      height: secondSize * 1.08
    });
  }

  if (line2) {
    drawMarker(
      ctx,
      centered ? secondX - measureTextWidth(ctx, line2, fontFamily, fontWeight, secondSize) / 2 : secondX,
      titleY + firstSize + gap,
      measureTextWidth(ctx, line2, fontFamily, fontWeight, secondSize),
      secondSize,
      width
    );
  }

  ctx.fillStyle = $("#textColor").value;
  ctx.font = `${fontWeight} ${firstSize}px "${fontFamily}", serif`;
  ctx.fillText(line1, firstX, titleY);

  if (line2) {
    ctx.fillStyle = TEMPLATE_STYLES[state.template]?.markerTextColor || $("#textColor").value;
    ctx.font = `${fontWeight} ${secondSize}px "${fontFamily}", serif`;
    ctx.fillText(line2, secondX, titleY + firstSize + gap);
  }
  ctx.restore();
}

function fitFont(ctx, text, family, weight, initialSize, maxWidth) {
  let size = initialSize;
  for (let index = 0; index < 14; index += 1) {
    const measured = measureTextWidth(ctx, text, family, weight, size);
    if (measured <= maxWidth) return size;
    size *= maxWidth / measured * 0.985;
  }
  return size;
}

function measureTextWidth(ctx, text, family, weight, size) {
  ctx.font = `${weight} ${size}px "${family}", serif`;
  return ctx.measureText(text).width;
}

function drawMarker(ctx, x, y, textWidth, fontSize, canvasWidth) {
  const style = $("#markerStyle").value;
  const color = $("#markerColor").value;
  const heightFactor = Number($("#markerHeight").value) / 100;
  const offsetX = Number($("#brushX").value) * canvasWidth / 1080;
  const offsetY = Number($("#brushY").value) * canvasWidth / 1080;
  const left = x - fontSize * 0.06 + offsetX;
  const width = textWidth + fontSize * 0.12;
  let top = y + fontSize * 0.06 + offsetY;
  let height = fontSize * heightFactor;

  if (style === "highlight") {
    top = y + fontSize * 0.13 + offsetY;
    height *= 0.68;
  }

  if (style === "underline") {
    top = y + fontSize * 0.82 + offsetY;
    height = fontSize * 0.12 * heightFactor;
  }

  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = style === "highlight" ? 0.72 : 0.95;
  drawRoughBand(ctx, left, top, width, height, canvasWidth, style);

  if (style === "marker") {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(left + width * 0.08, top + height * 0.22, width * 0.84, height * 0.08);
    ctx.fillRect(left + width * 0.17, top + height * 0.69, width * 0.62, height * 0.05);
  }
  ctx.restore();
}

function drawRoughBand(ctx, x, y, width, height, canvasWidth, style) {
  const segments = style === "underline" ? 18 : 28;
  const jitter = style === "highlight" ? canvasWidth * 0.0018 : canvasWidth * 0.0028;
  ctx.beginPath();
  ctx.moveTo(x, y + randomJitter(1, jitter));

  for (let index = 1; index <= segments; index += 1) {
    const px = x + width * index / segments;
    const py = y + randomJitter(index + 2, jitter);
    ctx.lineTo(px, py);
  }

  for (let index = segments; index >= 0; index -= 1) {
    const px = x + width * index / segments;
    const py = y + height + randomJitter(index + 71, jitter);
    ctx.lineTo(px, py);
  }

  ctx.closePath();
  ctx.fill();
}

function randomJitter(seed, amount) {
  const value = Math.sin(seed * 9283.21) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * amount;
}

function buildHardOutline(source, bounds, targetWidth, targetHeight, radius, color, style) {
  const pad = Math.max(3, Math.ceil(radius * (style === "hand" ? 1.8 : 1.45)));
  const width = Math.ceil(targetWidth) + pad * 2;
  const height = Math.ceil(targetHeight) + pad * 2;
  const silhouette = document.createElement("canvas");
  silhouette.width = width;
  silhouette.height = height;
  const silhouetteContext = silhouette.getContext("2d");
  silhouetteContext.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, pad, pad, targetWidth, targetHeight);
  silhouetteContext.globalCompositeOperation = "source-in";
  silhouetteContext.fillStyle = color;
  silhouetteContext.fillRect(0, 0, width, height);
  silhouetteContext.globalCompositeOperation = "source-over";

  const silhouettePixels = silhouetteContext.getImageData(0, 0, width, height);
  const sourceAlpha = new Uint8Array(width * height);
  for (let index = 0; index < sourceAlpha.length; index += 1) {
    sourceAlpha[index] = silhouettePixels.data[index * 4 + 3];
  }
  const [red, green, blue] = hexToRgb(color);
  const outline = document.createElement("canvas");
  outline.width = width;
  outline.height = height;
  const outlineContext = outline.getContext("2d");

  if (style === "fold") {
    const contour = extractOuterPolygon(sourceAlpha, width, height, radius * 0.55);
    if (contour.length >= 3) {
      const offsetPolygon = offsetPolygonWithJitter(contour, radius);
      outlineContext.fillStyle = color;
      outlineContext.beginPath();
      outlineContext.moveTo(offsetPolygon[0].x, offsetPolygon[0].y);
      for (let index = 1; index < offsetPolygon.length; index += 1) {
        outlineContext.lineTo(offsetPolygon[index].x, offsetPolygon[index].y);
      }
      outlineContext.closePath();
      outlineContext.fill();
      return { canvas: outline, pad };
    }
  }

  const dilatedAlpha = dilateAlphaWithJitter(sourceAlpha, width, height, radius, style);
  const outlinePixels = outlineContext.createImageData(width, height);
  for (let index = 0; index < dilatedAlpha.length; index += 1) {
    const rgbaIndex = index * 4;
    outlinePixels.data[rgbaIndex] = red;
    outlinePixels.data[rgbaIndex + 1] = green;
    outlinePixels.data[rgbaIndex + 2] = blue;
    outlinePixels.data[rgbaIndex + 3] = dilatedAlpha[index];
  }
  outlineContext.putImageData(outlinePixels, 0, 0);
  return { canvas: outline, pad };
}

function extractOuterPolygon(alpha, width, height, tolerance) {
  const edges = [];
  const outgoing = new Map();
  const key = (x, y) => y * (width + 1) + x;

  const addEdge = (x1, y1, x2, y2) => {
    const edge = { x1, y1, x2, y2, used: false };
    edges.push(edge);
    const startKey = key(x1, y1);
    if (!outgoing.has(startKey)) outgoing.set(startKey, []);
    outgoing.get(startKey).push(edge);
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alpha[y * width + x] < 8) continue;
      if (y === 0 || alpha[(y - 1) * width + x] < 8) addEdge(x, y, x + 1, y);
      if (x === width - 1 || alpha[y * width + x + 1] < 8) addEdge(x + 1, y, x + 1, y + 1);
      if (y === height - 1 || alpha[(y + 1) * width + x] < 8) addEdge(x + 1, y + 1, x, y + 1);
      if (x === 0 || alpha[y * width + x - 1] < 8) addEdge(x, y + 1, x, y);
    }
  }

  let largest = [];
  let largestArea = 0;
  edges.forEach((startEdge) => {
    if (startEdge.used) return;
    const contour = [{ x: startEdge.x1, y: startEdge.y1 }];
    let edge = startEdge;
    let guard = 0;
    while (edge && guard < edges.length + 8) {
      edge.used = true;
      contour.push({ x: edge.x2, y: edge.y2 });
      const nextEdges = outgoing.get(key(edge.x2, edge.y2)) || [];
      edge = nextEdges.find((candidate) => !candidate.used);
      guard += 1;
      if (edge === startEdge) break;
    }
    if (contour.length > 1 && contour[0].x === contour[contour.length - 1].x && contour[0].y === contour[contour.length - 1].y) {
      contour.pop();
    }
    const area = Math.abs(polygonArea(contour));
    if (area > largestArea) {
      largestArea = area;
      largest = contour;
    }
  });

  if (largest.length < 4) return largest;
  return simplifyClosedPolygon(largest, Math.max(4, tolerance));
}

function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    area += points[index].x * next.y - next.x * points[index].y;
  }
  return area / 2;
}

function simplifyClosedPolygon(points, tolerance) {
  const open = [...points, points[0]];
  const keep = new Uint8Array(open.length);
  keep[0] = 1;
  keep[open.length - 1] = 1;
  const stack = [[0, open.length - 1]];

  while (stack.length) {
    const [start, end] = stack.pop();
    let maxDistance = 0;
    let index = -1;
    for (let pointIndex = start + 1; pointIndex < end; pointIndex += 1) {
      const distance = perpendicularDistance(open[pointIndex], open[start], open[end]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = pointIndex;
      }
    }
    if (index > -1 && maxDistance > tolerance) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }

  return open.filter((_, index) => keep[index]).slice(0, -1);
}

function perpendicularDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / Math.hypot(dx, dy);
}

function offsetPolygonWithJitter(points, radius) {
  const count = points.length;
  const edgeRadius = points.map((_, index) => radius * (0.9 + (deterministicNoise(index * 17 + 3) - 0.5) * 0.22));
  return points.map((point, index) => {
    const previous = points[(index - 1 + count) % count];
    const next = points[(index + 1) % count];
    const previousEdge = normalize({ x: point.x - previous.x, y: point.y - previous.y });
    const nextEdge = normalize({ x: next.x - point.x, y: next.y - point.y });
    const previousNormal = { x: previousEdge.y, y: -previousEdge.x };
    const nextNormal = { x: nextEdge.y, y: -nextEdge.x };
    const previousRadius = edgeRadius[(index - 1 + count) % count];
    const nextRadius = edgeRadius[index];
    const line1 = {
      point: { x: previous.x + previousNormal.x * previousRadius, y: previous.y + previousNormal.y * previousRadius },
      direction: previousEdge
    };
    const line2 = {
      point: { x: point.x + nextNormal.x * nextRadius, y: point.y + nextNormal.y * nextRadius },
      direction: nextEdge
    };
    const intersection = intersectLines(line1, line2);
    const fallbackNormal = normalize({ x: previousNormal.x + nextNormal.x, y: previousNormal.y + nextNormal.y });
    const fallback = {
      x: point.x + fallbackNormal.x * (previousRadius + nextRadius) / 2,
      y: point.y + fallbackNormal.y * (previousRadius + nextRadius) / 2
    };
    const candidate = intersection || fallback;
    const offsetX = candidate.x - point.x;
    const offsetY = candidate.y - point.y;
    const distance = Math.hypot(offsetX, offsetY);
    const maximum = radius * 1.35;
    if (distance > maximum) {
      return {
        x: point.x + offsetX / distance * maximum,
        y: point.y + offsetY / distance * maximum
      };
    }
    return candidate;
  });
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function intersectLines(first, second) {
  const denominator = first.direction.x * second.direction.y - first.direction.y * second.direction.x;
  if (Math.abs(denominator) < 0.0001) return null;
  const delta = {
    x: second.point.x - first.point.x,
    y: second.point.y - first.point.y
  };
  const t = (delta.x * second.direction.y - delta.y * second.direction.x) / denominator;
  return {
    x: first.point.x + first.direction.x * t,
    y: first.point.y + first.direction.y * t
  };
}

function dilateAlphaWithJitter(sourceAlpha, width, height, radius, style) {
  const horizontal = new Uint8Array(width * height);
  const output = new Uint8Array(width * height);
  const jitterScale = style === "hand" ? 0.72 : style === "fold" ? 0.16 : 0.04;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    let x = 0;
    while (x < width) {
      while (x < width && sourceAlpha[rowOffset + x] < 8) x += 1;
      if (x >= width) break;
      const start = x;
      while (x < width && sourceAlpha[rowOffset + x] >= 8) x += 1;
      const end = x - 1;
      const leftRadius = Math.max(1, Math.round(radius * (1 + randomJitter(y + 17, jitterScale))));
      const rightRadius = Math.max(1, Math.round(radius * (1 + randomJitter(y + 71, jitterScale))));
      const from = Math.max(0, start - leftRadius);
      const to = Math.min(width - 1, end + rightRadius);
      horizontal.fill(255, rowOffset + from, rowOffset + to + 1);
    }
  }

  for (let x = 0; x < width; x += 1) {
    let y = 0;
    while (y < height) {
      while (y < height && horizontal[y * width + x] < 8) y += 1;
      if (y >= height) break;
      const start = y;
      while (y < height && horizontal[y * width + x] >= 8) y += 1;
      const end = y - 1;
      const topRadius = Math.max(1, Math.round(radius * (1 + randomJitter(x + 29, jitterScale))));
      const bottomRadius = Math.max(1, Math.round(radius * (1 + randomJitter(x + 97, jitterScale))));
      const from = Math.max(0, start - topRadius);
      const to = Math.min(height - 1, end + bottomRadius);
      for (let fillY = from; fillY <= to; fillY += 1) {
        output[fillY * width + x] = 255;
      }
    }
  }

  if (style === "hand") {
    for (let index = 0; index < output.length; index += 1) {
      if (output[index] > 0 && sourceAlpha[index] < 8) {
        const noise = deterministicNoise(index);
        if (noise < 0.11) output[index] = 0;
        else if (noise > 0.94) output[index] = 205;
      }
    }
  }

  return output;
}

function deterministicNoise(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split("").map((part) => part + part).join("")
    : normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function schedulePersonFilter(delay = 110) {
  clearTimeout(state.personFilterTimer);
  state.personFilterTimer = setTimeout(() => {
    const adjustedSource = state.personAdjustedCutout || state.personCutout;
    if (!adjustedSource) return;
    state.personFiltered = applyGPUPixelPersonFilter(adjustedSource);
    state.personFilterDirty = false;
    queueRender();
  }, delay);
}

function applyGPUPixelPersonFilter(sourceCanvas) {
  const settings = {
    smooth: Number($("#skinSmooth").value),
    white: Number($("#skinWhite").value),
    highlight: Number($("#personHighlight").value),
    shadow: Number($("#personShadow").value),
    brightness: Number($("#personBrightness").value),
    contrast: Number($("#personContrast").value),
    saturation: Number($("#personSaturation").value),
    temperature: Number($("#personTemperature").value),
    sharpen: Number($("#personSharpen").value)
  };
  const unchanged = ["smooth", "white", "highlight", "shadow", "brightness", "contrast", "saturation", "temperature", "sharpen"]
    .every((key) => settings[key] === 0);
  if (unchanged) return sourceCanvas;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const sourcePixels = sourceContext.getImageData(0, 0, width, height);
  const smoothCanvas = document.createElement("canvas");
  smoothCanvas.width = width;
  smoothCanvas.height = height;
  const smoothContext = smoothCanvas.getContext("2d", { willReadFrequently: true });
  smoothContext.filter = `blur(${0.7 + settings.smooth * 0.022}px)`;
  smoothContext.drawImage(sourceCanvas, 0, 0);
  smoothContext.filter = "none";
  const smoothPixels = smoothContext.getImageData(0, 0, width, height);
  const adjustedPixels = new ImageData(new Uint8ClampedArray(sourcePixels.data), width, height);
  const smoothAmount = settings.smooth / 100;
  const whiteAmount = settings.white / 100;
  const contrastFactor = 1 + settings.contrast / 100;
  const saturationFactor = 1 + settings.saturation / 100;

  for (let index = 0; index < sourcePixels.data.length; index += 4) {
    const alpha = sourcePixels.data[index + 3];
    if (alpha === 0) {
      adjustedPixels.data[index + 3] = 0;
      continue;
    }

    let red = sourcePixels.data[index];
    let green = sourcePixels.data[index + 1];
    let blue = sourcePixels.data[index + 2];
    const skin = skinLikelihood(red, green, blue);
    const smoothing = smoothAmount * (0.22 + skin * 0.78);
    red += (smoothPixels.data[index] - red) * smoothing;
    green += (smoothPixels.data[index + 1] - green) * smoothing;
    blue += (smoothPixels.data[index + 2] - blue) * smoothing;

    const luminance = red * 0.3 + green * 0.59 + blue * 0.11;
    red = luminance + (red - luminance) * saturationFactor;
    green = luminance + (green - luminance) * saturationFactor;
    blue = luminance + (blue - luminance) * saturationFactor;

    const whiteness = whiteAmount * skin;
    const lift = whiteness * 34 + settings.brightness * 1.45;
    red += lift + settings.temperature * 0.34;
    green += lift + settings.temperature * 0.08;
    blue += lift - settings.temperature * 0.34;

    const currentLuminance = red * 0.3 + green * 0.59 + blue * 0.11;
    const highlightMask = smoothstep(145, 255, currentLuminance);
    const shadowMask = 1 - smoothstep(20, 115, currentLuminance);
    const toneLift = settings.highlight * 1.15 * highlightMask + settings.shadow * 1.15 * shadowMask;
    red += toneLift;
    green += toneLift;
    blue += toneLift;

    red = (red - 128) * contrastFactor + 128;
    green = (green - 128) * contrastFactor + 128;
    blue = (blue - 128) * contrastFactor + 128;

    adjustedPixels.data[index] = red;
    adjustedPixels.data[index + 1] = green;
    adjustedPixels.data[index + 2] = blue;
    adjustedPixels.data[index + 3] = alpha;
  }

  const adjustedCanvas = document.createElement("canvas");
  adjustedCanvas.width = width;
  adjustedCanvas.height = height;
  const adjustedContext = adjustedCanvas.getContext("2d", { willReadFrequently: true });
  adjustedContext.putImageData(adjustedPixels, 0, 0);

  if (settings.sharpen > 0) {
    const sharpenCanvas = document.createElement("canvas");
    sharpenCanvas.width = width;
    sharpenCanvas.height = height;
    const sharpenContext = sharpenCanvas.getContext("2d", { willReadFrequently: true });
    sharpenContext.filter = `blur(${0.55 + settings.sharpen * 0.008}px)`;
    sharpenContext.drawImage(adjustedCanvas, 0, 0);
    sharpenContext.filter = "none";
    const sharpenBlur = sharpenContext.getImageData(0, 0, width, height);
    const sharpened = adjustedContext.getImageData(0, 0, width, height);
    const strength = settings.sharpen / 100 * 0.92;

    for (let index = 0; index < sharpened.data.length; index += 4) {
      if (sharpened.data[index + 3] === 0) continue;
      sharpened.data[index] += (sharpened.data[index] - sharpenBlur.data[index]) * strength;
      sharpened.data[index + 1] += (sharpened.data[index + 1] - sharpenBlur.data[index + 1]) * strength;
      sharpened.data[index + 2] += (sharpened.data[index + 2] - sharpenBlur.data[index + 2]) * strength;
    }
    adjustedContext.putImageData(sharpened, 0, 0);
  }

  return adjustedCanvas;
}

function skinLikelihood(red, green, blue) {
  if (red < 42) return 0;
  const warmth = smoothstep(0, 24, red - green);
  const balance = 1 - smoothstep(22, 82, Math.abs(green - blue));
  const exposure = smoothstep(42, 132, red);
  return Math.max(0, Math.min(1, warmth * balance * exposure));
}

function drawPerson(ctx, ratio) {
  const media = getMediaRect(ratio);
  ctx.save();
  ctx.rect(media.x, 0, media.width, Math.min(ratio.height, media.y + media.height));
  ctx.clip();

  if (!state.personCutout || !state.personBounds) {
    drawPersonPlaceholder(ctx, ratio);
    ctx.restore();
    return;
  }

  const { width, height } = ratio;
  const bounds = state.personBounds;
  const scale = Number($("#personScale").value) / 100;
  const targetWidth = media.width * ratio.layout.personWidth * scale;
  const targetHeight = targetWidth * bounds.height / bounds.width;
  const x = width * Number($("#personX").value) / 100;
  const y = height * Number($("#personY").value) / 100;
  const outlineWidth = Number($("#outlineWidth").value) * Math.min(1.25, Math.max(0.85, width / 1080));
  const outlineColor = $("#outlineColor").value;
  const outlineStyle = $("#outlineStyle").value;
  const source = state.personAdjustedCutout || state.personCutout;
  const filteredSource = state.personFiltered || source;
  const drawX = -targetWidth / 2;
  const drawY = -targetHeight;
  state.personDrawTransform = {
    left: x + drawX,
    top: y + drawY,
    width: targetWidth,
    height: targetHeight,
    bounds
  };

  ctx.save();
  ctx.translate(x, y);

  if (outlineWidth > 0) {
    const outline = buildHardOutline(source, bounds, targetWidth, targetHeight, outlineWidth, outlineColor, outlineStyle);
    ctx.drawImage(outline.canvas, drawX - outline.pad, drawY - outline.pad);
  }

  ctx.drawImage(filteredSource, bounds.x, bounds.y, bounds.width, bounds.height, drawX, drawY, targetWidth, targetHeight);
  ctx.restore();
  ctx.restore();
}

function drawPersonPlaceholder(ctx, ratio) {
  const { width, height } = ratio;
  const x = width * Number($("#personX").value) / 100;
  const y = height * Number($("#personY").value) / 100;
  const radius = width * 0.075;
  ctx.save();
  ctx.translate(x, y - radius * 2.25);
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = $("#outlineColor").value;
  roundedRect(ctx, -radius, 0, radius * 2, radius * 2.25, radius * 0.22);
  ctx.fill();
  ctx.fillStyle = "#c8d3ce";
  ctx.beginPath();
  ctx.arc(0, radius * 0.52, radius * 0.37, 0, Math.PI * 2);
  ctx.fill();
  roundedRect(ctx, -radius * 0.72, radius * 1.02, radius * 1.44, radius * 0.75, radius * 0.22);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function syncOutput(id) {
  const input = document.getElementById(id);
  const valueMap = {
    outlineWidth: `${input.value} px`,
    edgePrecision: Number(input.value) > 74 ? "精确" : Number(input.value) > 42 ? "均衡" : "宽松",
    personScale: `${input.value}%`,
    personX: `${input.value}%`,
    personY: `${input.value}%`,
    titleScale: `${input.value}%`,
    titleY: `${input.value}%`,
    markerHeight: `${input.value}%`,
    brushX: `${input.value} px`,
    brushY: `${input.value} px`,
    mediaHeight: `${input.value}%`,
    mediaY: `${input.value}%`,
    brightness: `${cappedPercent(input.value)}%`,
    backgroundContrast: `${cappedPercent(input.value)}%`,
    saturation: `${cappedPercent(input.value)}%`,
    backgroundHighlight: formatSigned(input.value),
    backgroundShadow: formatSigned(input.value),
    backgroundTemperature: formatSigned(input.value),
    backgroundBlur: `${cappedPercent(input.value)}%`,
    vignette: `${cappedPercent(input.value)}%`,
    sceneScale: `${input.value}%`,
    sceneX: formatSigned(input.value),
    sceneY: formatSigned(input.value),
    skinSmooth: `${input.value}%`,
    skinWhite: `${input.value}%`,
    personHighlight: formatSigned(input.value),
    personShadow: formatSigned(input.value),
    personBrightness: formatSigned(input.value),
    personContrast: formatSigned(input.value),
    personSaturation: formatSigned(input.value),
    personTemperature: formatSigned(input.value),
    personSharpen: `${input.value}%`,
    matteBrushSize: `${input.value} px`
  };

  const outputIds = {
    outlineWidth: "outlineWidthValue",
    edgePrecision: "edgeValue",
    personScale: "personScaleValue",
    personX: "personXValue",
    personY: "personYValue",
    titleScale: "titleScaleValue",
    titleY: "titleYValue",
    markerHeight: "markerHeightValue",
    brushX: "brushXValue",
    brushY: "brushYValue",
    mediaHeight: "mediaHeightValue",
    mediaY: "mediaYValue",
    brightness: "brightnessValue",
    backgroundContrast: "backgroundContrastValue",
    saturation: "saturationValue",
    backgroundHighlight: "backgroundHighlightValue",
    backgroundShadow: "backgroundShadowValue",
    backgroundTemperature: "backgroundTemperatureValue",
    backgroundBlur: "backgroundBlurValue",
    vignette: "vignetteValue",
    sceneScale: "sceneScaleValue",
    sceneX: "sceneXValue",
    sceneY: "sceneYValue",
    skinSmooth: "skinSmoothValue",
    skinWhite: "skinWhiteValue",
    personHighlight: "personHighlightValue",
    personShadow: "personShadowValue",
    personBrightness: "personBrightnessValue",
    personContrast: "personContrastValue",
    personSaturation: "personSaturationValue",
    personTemperature: "personTemperatureValue",
    personSharpen: "personSharpenValue",
    matteBrushSize: "matteBrushSizeValue"
  };

  if (outputIds[id]) document.getElementById(outputIds[id]).textContent = valueMap[id];

  const hexOutputs = {
    backgroundColor: "backgroundHex",
    outlineColor: "outlineHex",
    textColor: "textHex",
    markerColor: "markerHex"
  };
  if (hexOutputs[id]) document.getElementById(hexOutputs[id]).textContent = input.value.toUpperCase();

  if (input.type === "range") {
    const progress = (input.value - input.min) / (input.max - input.min) * 100;
    input.style.background = `linear-gradient(to right, var(--teal) 0 ${progress}%, var(--line) ${progress}% 100%)`;
  }
}

function formatSigned(value) {
  const number = Number(value);
  return number > 0 ? `+${number}` : String(number);
}

function cappedPercent(value) {
  return Math.min(100, Number(value));
}

function syncAllOutputs() {
  formIds.forEach(syncOutput);
}

function saveSettings() {
  const data = {
    __template: state.template,
    __layoutLocked: state.layoutLocked
  };
  formIds.forEach((id) => {
    data[id] = document.getElementById(id).value;
  });
  localStorage.setItem("cover-studio-settings-v2", JSON.stringify(data));
  $("#saveState span").textContent = "已自动保存";
  scheduleHistoryCommit();
  clearTimeout(toastTimer);
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("cover-studio-settings-v2") || "{}");
    state.template = TEMPLATE_STYLES[saved.__template] ? saved.__template : "classic";
    state.layoutLocked = saved.__layoutLocked !== false;
    if (saved.markerHeight === "82" && saved.brushY === "0") {
      saved.markerHeight = "70";
      saved.brushY = "25";
    }
    if (saved.fontFamily === "Songti SC") saved.fontFamily = "Source Han Serif CN";
    formIds.forEach((id) => {
      if (saved[id] !== undefined) document.getElementById(id).value = saved[id];
    });
    $$(".template-card").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.template === state.template);
    });
    showTemplatePageForSelection();
  } catch (error) {
    console.warn("Settings could not be restored.", error);
  }
}

function resetSettings() {
  state.template = "classic";
  state.layoutLocked = true;
  templatePage = 0;
  formIds.forEach((id) => {
    document.getElementById(id).value = defaults[id];
  });
  state.sceneImage = null;
  state.personImage = null;
  state.personCutout = null;
  state.personOriginalCutout = null;
  state.personAdjustedCutout = null;
  state.personMatteMask = null;
  state.personFiltered = null;
  state.personBounds = null;
  setMatteTool("none");
  $("#sceneFileName").textContent = "点击或拖入图片";
  $("#personFileName").textContent = "自动识别并抠出人物";
  setPersonStatus("idle", "上传人物后自动抠图");
  $$(".template-card").forEach((button) => button.classList.toggle("is-active", button.dataset.template === "classic"));
  setTemplatePage(0);
  applyLayoutLock();
  $$("#personPresets button").forEach((button, index) => button.classList.toggle("is-active", index === 0));
  syncAllOutputs();
  saveSettings();
  queueRender();
  showToast("设置已重置");
}

async function scanSystemFonts() {
  if (!("queryLocalFonts" in window)) {
    showToast("当前浏览器不支持扫描，已保留系统字体列表");
    return;
  }

  try {
    const fonts = await window.queryLocalFonts();
    const familyMap = new Map();
    fonts.forEach((font) => {
      if (font.family && !familyMap.has(font.family)) familyMap.set(font.family, font);
    });
    const families = [...familyMap.keys()]
      .sort((a, b) => getChineseFontLabel(a, familyMap.get(a)).localeCompare(getChineseFontLabel(b, familyMap.get(b)), "zh-CN"));
    const select = $("#fontFamily");
    const current = select.value;
    select.innerHTML = "";
    families.forEach((family) => {
      const option = document.createElement("option");
      option.value = family;
      option.textContent = getChineseFontLabel(family, familyMap.get(family));
      select.append(option);
    });
    if (families.includes(current)) select.value = current;
    showToast(`已载入 ${families.length} 个系统字体`);
    queueRender();
  } catch (error) {
    console.warn(error);
    showToast("未获得字体扫描权限");
  }
}

function getChineseFontLabel(family, fontData = null) {
  const localizedName = [fontData?.fullName, fontData?.family, fontData?.postscriptName]
    .find((name) => name && /[\u3400-\u9fff]/.test(name));
  if (localizedName) {
    return localizedName.replace(/\s+(常规|标准|粗体|细体|中粗|特粗|Regular|Bold|Light|Medium|Semibold|Heavy)$/i, "").trim();
  }

  const labels = {
    "Songti SC": "宋体",
    "STSong": "华文宋体",
    "PingFang SC": "苹方",
    "PingFang HK": "苹方-香港",
    "PingFang TC": "苹方-台湾",
    "Hiragino Sans GB": "冬青黑体",
    "Kaiti SC": "楷体",
    "STKaiti": "华文楷体",
    "Heiti SC": "黑体",
    "STHeiti": "华文黑体",
    "Yuanti SC": "圆体",
    "Weibei SC": "魏碑",
    "Baoli SC": "隶变",
    "Libian SC": "隶书",
    "Xingkai SC": "行楷",
    "Lantinghei SC": "兰亭黑",
    "Hannotate SC": "手刻体",
    "HanziPen SC": "手札体",
    "Wawati SC": "娃娃体",
    "Yuppy SC": "雅痞体",
    "LingWai SC": "凌慧体",
    "Kaiti TC": "楷体-繁",
    "Kaiti HK": "楷体-香港",
    "Songti TC": "宋体-繁",
    "Songti HK": "宋体-香港",
    "PingFang TC": "苹方-繁",
    "PingFang HK": "苹方-香港",
    "STFangsong": "华文仿宋",
    "STXihei": "华文细黑",
    "STHupo": "华文琥珀",
    "STLiti": "华文隶书",
    "STXingkai": "华文行楷",
    "STZhongsong": "华文中宋",
    "STCaiyun": "华文彩云",
    "STHuanwei": "华文新魏",
    "Microsoft YaHei": "微软雅黑",
    "Microsoft YaHei UI": "微软雅黑界面",
    "SimSun": "宋体",
    "NSimSun": "新宋体",
    "SimHei": "黑体",
    "KaiTi": "楷体",
    "FangSong": "仿宋",
    "YouYuan": "幼圆",
    "DengXian": "等线",
    "FZShuTi": "方正舒体",
    "FZKaiTi-Z03S": "方正楷体",
    "FZShuSong-Z01S": "方正书宋",
    "FZHei-B01S": "方正黑体",
    "Noto Sans CJK SC": "思源黑体",
    "Noto Serif CJK SC": "思源宋体",
    "Source Han Sans SC": "思源黑体",
    "Source Han Serif SC": "思源宋体",
    "Source Han Serif CN": "思源宋体",
    "Source Han Serif CN Regular": "思源宋体",
    "Alibaba PuHuiTi": "阿里巴巴普惠体",
    "HarmonyOS Sans SC": "鸿蒙黑体",
    "MiSans": "小米 Sans",
    "Droid Sans Fallback": "安卓黑体",
    "Arial Black": "超粗黑体",
    "Impact": "紧凑黑体"
  };
  return labels[family] || labels[family.replace(/\s+/g, " ").trim()] || family;
}

async function exportCurrent() {
  const ratio = RATIOS[state.activeRatio];
  render();
  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, `cover-${ratio.label.replace(":", "x")}-${ratio.width}x${ratio.height}.png`);
  showToast("当前封面已导出");
}

async function exportAll() {
  const overlay = $("#exportOverlay");
  const button = $("#exportAllButton");
  overlay.classList.add("is-visible");
  overlay.setAttribute("aria-hidden", "false");
  button.disabled = true;

  try {
    const entries = [];
    const ratios = Object.entries(RATIOS);

    for (let index = 0; index < ratios.length; index += 1) {
      const [id, ratio] = ratios[index];
      $("#exportProgressText").textContent = `正在生成 ${ratio.label} · ${index + 1} / ${ratios.length}`;
      $("#exportProgressBar").style.width = `${index / ratios.length * 100}%`;
      await nextFrame();

      const exportCanvas = document.createElement("canvas");
      render(exportCanvas, id);
      const blob = await canvasToBlob(exportCanvas);
      entries.push({
        name: `cover-${ratio.label.replace(":", "x")}-${ratio.width}x${ratio.height}.png`,
        data: new Uint8Array(await blob.arrayBuffer())
      });
    }

    $("#exportProgressText").textContent = "正在打包 ZIP...";
    $("#exportProgressBar").style.width = "94%";
    await nextFrame();
    const zip = createZip(entries);
    $("#exportProgressBar").style.width = "100%";
    const packageName = sanitizeFilename($("#line1Input").value.trim() || "未命名");
    downloadBlob(new Blob([zip], { type: "application/zip" }), `${packageName}-封面.zip`);
    showToast("全部封面已打包导出");
  } catch (error) {
    console.error(error);
    showToast("导出失败，请重试");
  } finally {
    setTimeout(() => {
      overlay.classList.remove("is-visible");
      overlay.setAttribute("aria-hidden", "true");
      $("#exportProgressBar").style.width = "0";
      button.disabled = false;
    }, 320);
  }
}

function sanitizeFilename(value) {
  return value
    .replace(/[\\/:*?"<>|\n\r\t]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48) || "未命名";
}

function canvasToBlob(sourceCanvas) {
  return new Promise((resolve, reject) => {
    sourceCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed")), "image/png");
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function createZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, entry.data.length, true);
    localView.setUint32(22, entry.data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    localParts.push(local, entry.data);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length + entry.data.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return concatBytes([...localParts, ...centralParts, end]);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function showToast(message) {
  const toast = $("#toast");
  toast.querySelector("span").textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

document.addEventListener("DOMContentLoaded", init);
