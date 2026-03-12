import type { AnalysisResult } from "@/store/useStore";

let faceapi: typeof import("@vladmandic/face-api") | null = null;
let modelsLoaded = false;

export async function loadModels(onProgress?: (step: string) => void): Promise<void> {
  if (modelsLoaded) return;

  onProgress?.("Loading AI engine...");
  // Dynamic import to avoid SSR issues
  faceapi = await import("@vladmandic/face-api");

  const MODEL_URL = "/models";

  onProgress?.("Loading face detection model...");
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

  onProgress?.("Loading landmark model...");
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

  onProgress?.("Loading expression model...");
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  onProgress?.("Loading age/gender model...");
  await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);

  modelsLoaded = true;
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function angleDeg(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
}

function classifyFaceShape(landmarks: { x: number; y: number }[]): string {
  const jawWidth = distance(landmarks[0], landmarks[16]);
  const cheekWidth = distance(landmarks[1], landmarks[15]);
  const foreheadWidth = distance(landmarks[17], landmarks[26]);
  const faceHeight = distance(landmarks[8], landmarks[27]);
  const ratio = faceHeight / jawWidth;

  if (ratio > 1.3 && foreheadWidth > jawWidth) return "Oval";
  if (ratio > 1.3 && cheekWidth > foreheadWidth && cheekWidth > jawWidth) return "Diamond";
  if (ratio < 1.1 && Math.abs(jawWidth - foreheadWidth) < jawWidth * 0.1) return "Square";
  if (ratio < 1.1) return "Round";
  if (foreheadWidth > jawWidth * 1.15) return "Heart";
  if (ratio > 1.4) return "Oblong";
  return "Oval";
}

function calculateSymmetry(landmarks: { x: number; y: number }[]): number {
  const centerX = landmarks[27].x; // nose bridge as center
  let totalDiff = 0;
  let count = 0;

  // Compare jaw contour left vs right
  const pairs = [[0, 16], [1, 15], [2, 14], [3, 13], [4, 12], [5, 11], [6, 10], [7, 9]];
  for (const [l, r] of pairs) {
    const leftDist = Math.abs(landmarks[l].x - centerX);
    const rightDist = Math.abs(landmarks[r].x - centerX);
    const leftY = landmarks[l].y;
    const rightY = landmarks[r].y;
    totalDiff += Math.abs(leftDist - rightDist) + Math.abs(leftY - rightY) * 0.5;
    count++;
  }

  // Compare eye positions
  const leftEyeCenter = {
    x: (landmarks[36].x + landmarks[39].x) / 2,
    y: (landmarks[36].y + landmarks[39].y) / 2,
  };
  const rightEyeCenter = {
    x: (landmarks[42].x + landmarks[45].x) / 2,
    y: (landmarks[42].y + landmarks[45].y) / 2,
  };
  totalDiff += Math.abs(Math.abs(leftEyeCenter.x - centerX) - Math.abs(rightEyeCenter.x - centerX));
  totalDiff += Math.abs(leftEyeCenter.y - rightEyeCenter.y);
  count += 2;

  const jawWidth = distance(landmarks[0], landmarks[16]);
  const avgDiff = totalDiff / count;
  const normalizedScore = Math.max(0, 100 - (avgDiff / jawWidth) * 400);
  return Math.min(100, Math.round(normalizedScore));
}

function calculateJawline(landmarks: { x: number; y: number }[]): number {
  // Measure jaw angle sharpness
  const leftJawAngle = angleDeg(landmarks[4], landmarks[8]) - angleDeg(landmarks[0], landmarks[4]);
  const rightJawAngle = angleDeg(landmarks[8], landmarks[12]) - angleDeg(landmarks[12], landmarks[16]);
  const avgAngle = (Math.abs(leftJawAngle) + Math.abs(rightJawAngle)) / 2;

  // Jaw width to face height ratio
  const jawWidth = distance(landmarks[4], landmarks[12]);
  const faceHeight = distance(landmarks[8], landmarks[27]);
  const widthRatio = jawWidth / faceHeight;

  // Sharper angles and wider jaw = higher score
  let score = 50;
  score += Math.min(25, avgAngle * 0.4);
  score += Math.min(25, widthRatio * 30);

  return Math.min(100, Math.max(0, Math.round(score)));
}

function calculateCanthalTilt(landmarks: { x: number; y: number }[]): number {
  // Left eye: inner corner (39) to outer corner (36)
  const leftTilt = angleDeg(landmarks[39], landmarks[36]);
  // Right eye: inner corner (42) to outer corner (45)
  const rightTilt = angleDeg(landmarks[42], landmarks[45]);
  // Average tilt - positive means outer corner is higher (positive canthal tilt)
  return Math.round(((leftTilt + rightTilt) / 2) * 10) / 10;
}

function calculateDimorphism(landmarks: { x: number; y: number }[]): number {
  const jawWidth = distance(landmarks[4], landmarks[12]);
  const cheekWidth = distance(landmarks[1], landmarks[15]);
  const foreheadWidth = distance(landmarks[17], landmarks[26]);
  const faceHeight = distance(landmarks[8], landmarks[27]);

  // Higher jaw-to-forehead ratio = more masculine
  const jawRatio = jawWidth / foreheadWidth;
  // Chin prominence
  const chinLength = distance(landmarks[8], landmarks[57]);
  const chinRatio = chinLength / faceHeight;
  // Brow ridge estimation (distance from eyebrow to eye)
  const browRidge = (distance(landmarks[19], landmarks[37]) + distance(landmarks[24], landmarks[44])) / 2;
  const browScore = Math.min(30, (browRidge / faceHeight) * 300);

  let score = 40;
  score += Math.min(30, jawRatio * 25);
  score += Math.min(20, chinRatio * 150);
  score += browScore;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function calculateSkinTexture(
  canvas: HTMLCanvasElement,
  landmarks: { x: number; y: number }[]
): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 70;

  // Sample the cheek region
  const leftCheek = landmarks[3];
  const rightCheek = landmarks[13];
  const regions = [leftCheek, rightCheek];
  let totalVariance = 0;

  for (const center of regions) {
    const size = 20;
    const x = Math.max(0, Math.round(center.x - size / 2));
    const y = Math.max(0, Math.round(center.y - size / 2));
    try {
      const imageData = ctx.getImageData(x, y, size, size);
      const pixels = imageData.data;
      let sum = 0;
      let sumSq = 0;
      const n = pixels.length / 4;
      for (let i = 0; i < pixels.length; i += 4) {
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        sum += brightness;
        sumSq += brightness * brightness;
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      totalVariance += variance;
    } catch {
      totalVariance += 300;
    }
  }

  const avgVariance = totalVariance / regions.length;
  // Lower variance = smoother skin = higher score
  const score = Math.max(30, 100 - avgVariance * 0.12);
  return Math.min(100, Math.round(score));
}

function getTier(score: number): string {
  if (score >= 9) return "Apex";
  if (score >= 8) return "Elite";
  if (score >= 7) return "Advanced";
  if (score >= 6) return "Rising Star";
  if (score >= 5) return "Foundation";
  return "Starting Out";
}

function getStatusLabel(score: number): "Excellent" | "Good" | "Improvable" {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  return "Improvable";
}

function getPotential(current: number): number {
  // Realistic potential: improvable traits get bigger boost
  const room = 100 - current;
  return Math.min(100, Math.round(current + room * 0.45));
}

export async function analyzeFace(
  imageSource: string,
  onProgress?: (step: string, pct: number) => void
): Promise<AnalysisResult | null> {
  if (!faceapi) throw new Error("Models not loaded. Call loadModels() first.");

  onProgress?.("Detecting face...", 20);

  // Create an image element
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageSource;
  });

  // Create canvas for pixel analysis
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(img, 0, 0);

  // Detect face with landmarks, expressions, and age/gender
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
    .withFaceLandmarks()
    .withFaceExpressions()
    .withAgeAndGender();

  if (!detection) return null;

  onProgress?.("Mapping 68 facial landmarks...", 40);

  const landmarks = detection.landmarks.positions.map((p) => ({ x: p.x, y: p.y }));

  onProgress?.("Calculating biometric metrics...", 60);

  const symmetry = calculateSymmetry(landmarks);
  const jawline = calculateJawline(landmarks);
  const canthalTiltDeg = calculateCanthalTilt(landmarks);
  const canthalTiltScore = Math.min(100, Math.max(0, 50 + canthalTiltDeg * 10));
  const skinTexture = calculateSkinTexture(canvas, landmarks);
  const dimorphism = calculateDimorphism(landmarks);
  const faceShape = classifyFaceShape(landmarks);

  onProgress?.("Generating your blueprint...", 80);

  // Calculate overall score (weighted average)
  const rawScore =
    symmetry * 0.25 +
    jawline * 0.2 +
    canthalTiltScore * 0.15 +
    skinTexture * 0.2 +
    dimorphism * 0.2;

  const overallScore = Math.round((rawScore / 10) * 10) / 10; // Scale to 1-10
  const potentialScore = Math.round(Math.min(10, overallScore + 1.2 + Math.random() * 0.6) * 10) / 10;

  const radarData = [
    { trait: "Symmetry", current: symmetry, potential: getPotential(symmetry) },
    { trait: "Jawline", current: jawline, potential: getPotential(jawline) },
    { trait: "Canthal Tilt", current: canthalTiltScore, potential: getPotential(canthalTiltScore) },
    { trait: "Skin", current: skinTexture, potential: getPotential(skinTexture) },
    { trait: "Dimorphism", current: dimorphism, potential: getPotential(dimorphism) },
  ];

  const canthalLabel =
    canthalTiltDeg > 2 ? "Positive" : canthalTiltDeg > 0 ? "Neutral-Positive" : canthalTiltDeg > -2 ? "Neutral" : "Negative";

  const detailedTraits: AnalysisResult["detailedTraits"] = [
    {
      name: "Facial Symmetry",
      value: `${symmetry}%`,
      status: getStatusLabel(symmetry),
      detail:
        symmetry >= 80
          ? "Excellent bilateral symmetry across facial features"
          : symmetry >= 60
          ? "Minor asymmetries detected — normal and generally unnoticeable"
          : "Noticeable asymmetry in orbital or jaw region. Posture and mewing may help",
      improvable: symmetry < 75,
    },
    {
      name: "Jawline Definition",
      value: jawline >= 70 ? "Strong" : jawline >= 50 ? "Moderate" : "Soft",
      status: getStatusLabel(jawline),
      detail:
        jawline >= 70
          ? "Well-defined mandibular angle with strong forward growth"
          : "Mewing + masseter training could add significant definition over time",
      improvable: jawline < 75,
    },
    {
      name: "Canthal Tilt",
      value: `${canthalLabel} ${canthalTiltDeg > 0 ? "+" : ""}${canthalTiltDeg}°`,
      status: canthalTiltDeg > 0 ? "Good" : canthalTiltDeg > -2 ? "Good" : "Improvable",
      detail:
        canthalTiltDeg > 1
          ? "Positive tilt — a highly attractive trait associated with youthful appearance"
          : "Neutral tilt — common and not a concern. Orbital posture may help subtly",
      improvable: canthalTiltDeg < 0,
    },
    {
      name: "Skin Texture",
      value: skinTexture >= 80 ? "Excellent" : skinTexture >= 60 ? "Good" : "Needs Work",
      status: getStatusLabel(skinTexture),
      detail:
        skinTexture >= 80
          ? "Smooth, even texture with minimal irregularities detected"
          : "Some texture irregularities detected. A consistent skincare routine is recommended",
      improvable: skinTexture < 75,
    },
    {
      name: "Facial Dimorphism",
      value: `${dimorphism}%`,
      status: getStatusLabel(dimorphism),
      detail:
        dimorphism >= 70
          ? "Strong masculine/feminine features with good bone structure proportions"
          : "Jaw and brow development can enhance perceived dimorphism over time",
      improvable: dimorphism < 70,
    },
    {
      name: "Face Shape",
      value: faceShape,
      status: "Excellent",
      detail: getFaceShapeDescription(faceShape),
      improvable: false,
    },
  ];

  onProgress?.("Analysis complete", 100);

  return {
    overallScore,
    potentialScore,
    traits: {
      symmetry,
      jawline,
      canthalTilt: canthalTiltDeg,
      skinTexture,
      dimorphism,
      faceShape,
    },
    radarData,
    detailedTraits,
    tier: getTier(overallScore),
    potentialTier: getTier(potentialScore),
    capturedImage: imageSource,
    timestamp: Date.now(),
    rawLandmarks: landmarks,
    imageWidth: img.width,
    imageHeight: img.height,
  };
}

function getFaceShapeDescription(shape: string): string {
  const descriptions: Record<string, string> = {
    Oval: "The most versatile face shape — suits nearly all hairstyles and frames",
    Diamond: "Angular and striking. Emphasize cheekbones with side-swept styles",
    Square: "Strong and commanding. A powerful jawline frames the face well",
    Round: "Soft and youthful. Add angles with structured hairstyles",
    Heart: "Balanced upper face with a refined chin. Universally attractive shape",
    Oblong: "Elegant proportions. Width-adding styles complement the vertical length",
  };
  return descriptions[shape] || "Well-proportioned facial structure";
}
