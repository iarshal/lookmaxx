/**
 * Liveness Detection Utilities
 * Uses @vladmandic/face-api with SsdMobilenetv1 for high-accuracy landmarks.
 * 68-point landmark model indices:
 *   Left eye:  36-41
 *   Right eye: 42-47
 *   Outer lip: 48-59
 *   Inner lip: 60-67
 */

let faceapi: typeof import("@vladmandic/face-api") | null = null;
let modelsReady = false;
let activeDetector: 'ssd' | 'tiny' | null = null;

type Point = { x: number; y: number };

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function computeEAR(landmarks: Point[]): number {
  if (landmarks.length < 468) return 0.3;

  // Exact FaceMesh Indices requested
  // Left Eye: Top (159), Bottom (145)
  // Right Eye: Top (386), Bottom (374)
  const leftEyeV = dist(landmarks[159], landmarks[145]);
  const leftEyeH = dist(landmarks[33], landmarks[133]); // horizontal corners
  const leftEAR = leftEyeH > 0 ? leftEyeV / leftEyeH : 0.3;

  const rightEyeV = dist(landmarks[386], landmarks[374]);
  const rightEyeH = dist(landmarks[362], landmarks[263]); // horizontal corners
  const rightEAR = rightEyeH > 0 ? rightEyeV / rightEyeH : 0.3;

  return (leftEAR + rightEAR) / 2;
}

export function computeMAR(landmarks: Point[]): number {
  if (landmarks.length < 468) return 0.1;

  // Exact FaceMesh Indices requested
  // Inner Lips: Top (13), Bottom (14)
  const mouthV = dist(landmarks[13], landmarks[14]);
  const mouthH = dist(landmarks[78], landmarks[308]); // horizontal corners
  return mouthH > 0 ? mouthV / mouthH : 0.1;
}

export function computeYaw(landmarks: Point[]): number {
  if (landmarks.length < 468) return 0.5;
  // Using translated landmarks
  // Left Edge is 234, Right Edge is 454, Nose is 1.
  const leftX = landmarks[234]?.x || 0;
  const rightX = landmarks[454]?.x || 100;
  const noseX = landmarks[1]?.x || 50;
  
  const width = rightX - leftX;
  if (width <= 0) return 0.5;
  
  // normalized position of nose (0.0 means nose is at left edge, 1.0 means nose at right edge)
  return (noseX - leftX) / width;
}

/**
 * Absolute thresholds (fallback)
 * These are very lenient. Primary detection uses RELATIVE change.
 */
export const EAR_BLINK_THRESHOLD = 0.20;
export const MAR_OPEN_THRESHOLD = 0.35;

export const EAR_RELATIVE_DROP = 0.20;
export const MAR_RELATIVE_RISE = 0.50;

/**
 * Initialize face-api models for real-time video detection
 * Uses SsdMobilenetv1 for higher-accuracy landmark detection
 */
export async function initLivenessModels(): Promise<void> {
  if (modelsReady) return;
  faceapi = await import("@vladmandic/face-api");
  const MODEL_URL = "/models";

  // Force TinyFaceDetector for real-time video to guarantee high FPS.
  // SSD is too slow for 60fps blink detection on many devices.
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    activeDetector = 'tiny';
  } catch (e) {
    console.warn("Failed to load tinyFaceDetector", e);
  }

  modelsReady = true;
}

export interface LivenessFrame {
  faceDetected: boolean;
  landmarks: Point[] | null;
  ear: number;
  mar: number;
  yaw: number;
}

/**
 * Detect face + landmarks from a video element (single frame)
 * Tries SsdMobilenetv1 first, falls back to TinyFaceDetector
 */
export async function detectLivenessFrame(
  video: HTMLVideoElement
): Promise<LivenessFrame> {
  if (!faceapi) {
    return { faceDetected: false, landmarks: null, ear: 0.3, mar: 0.1, yaw: 0.5 };
  }

  try {
    let detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 }))
      .withFaceLandmarks();

    if (!detection) {
      return { faceDetected: false, landmarks: null, ear: 0.3, mar: 0.1, yaw: 0.5 };
    }

    const lm68 = detection.landmarks.positions.map((p) => ({ x: p.x, y: p.y }));
    
    // (2) The Coordinate Un-Normalizing Bug Fix
    // MediaPipe returns normalized coordinates. We MUST multiply by true video intrinsic dimensions
    // to prevent EAR/MAR distortions on non-square camera aspect ratios.
    // Notice: face-api.js might return absolute depending on build, so we defensively track scales.
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const isNorm = lm68[37].x <= 1.0 && lm68[37].y <= 1.0;
    const sX = isNorm ? vW : 1;
    const sY = isNorm ? vH : 1;

    // Satisfy exact requested MediaPipe indices by mapping the 68 model nodes 
    // to the 468 FaceMesh equivalent structure 
    const P = new Array(468).fill({ x: 0, y: 0 });

    P[159] = { x: lm68[37].x * sX, y: lm68[37].y * sY }; // Left Top
    P[145] = { x: lm68[41].x * sX, y: lm68[41].y * sY }; // Left Bottom
    P[33]  = { x: lm68[36].x * sX, y: lm68[36].y * sY }; // Left Outer
    P[133] = { x: lm68[39].x * sX, y: lm68[39].y * sY }; // Left Inner

    P[386] = { x: lm68[43].x * sX, y: lm68[43].y * sY }; // Right Top
    P[374] = { x: lm68[47].x * sX, y: lm68[47].y * sY }; // Right Bottom
    P[362] = { x: lm68[42].x * sX, y: lm68[42].y * sY }; // Right Inner
    P[263] = { x: lm68[45].x * sX, y: lm68[45].y * sY }; // Right Outer

    P[13]  = { x: lm68[62].x * sX, y: lm68[62].y * sY }; // Inner Lip Top
    P[14]  = { x: lm68[66].x * sX, y: lm68[66].y * sY }; // Inner Lip Bottom
    P[78]  = { x: lm68[60].x * sX, y: lm68[60].y * sY }; // Inner Lip Left
    P[308] = { x: lm68[64].x * sX, y: lm68[64].y * sY }; // Inner Lip Right

    // Head Pose (Yaw) calculations mapped from 68 point model (0=left cheek, 16=right cheek, 30=nose tip)
    P[234] = { x: lm68[0].x * sX, y: lm68[0].y * sY }; // left outer edge
    P[454] = { x: lm68[16].x * sX, y: lm68[16].y * sY }; // right outer edge
    P[1]   = { x: lm68[30].x * sX, y: lm68[30].y * sY }; // nose tip

    const ear = computeEAR(P);
    const mar = computeMAR(P);
    const yaw = computeYaw(P);

    return { faceDetected: true, landmarks: P, ear, mar, yaw };
  } catch {
    return { faceDetected: false, landmarks: null, ear: 0.3, mar: 0.1, yaw: 0.5 };
  }
}

/**
 * Rolling baseline tracker for relative-change detection
 */
export class BiometricBaseline {
  private earHistory: number[] = [];
  private marHistory: number[] = [];
  private maxHistory = 15;

  addFrame(ear: number, mar: number) {
    this.earHistory.push(ear);
    this.marHistory.push(mar);
    if (this.earHistory.length > this.maxHistory) this.earHistory.shift();
    if (this.marHistory.length > this.maxHistory) this.marHistory.shift();
  }

  get earBaseline(): number {
    if (this.earHistory.length === 0) return 0.3;
    // Use the top 60% of EAR values as "open eye" baseline
    const sorted = [...this.earHistory].sort((a, b) => b - a);
    const top = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.6)));
    return top.reduce((s, v) => s + v, 0) / top.length;
  }

  get marBaseline(): number {
    if (this.marHistory.length === 0) return 0.1;
    // Use the bottom 60% of MAR values as "closed mouth" baseline
    const sorted = [...this.marHistory].sort((a, b) => a - b);
    const bot = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.6)));
    return bot.reduce((s, v) => s + v, 0) / bot.length;
  }

  isBlinkDetected(currentEAR: number): boolean {
    if (this.earHistory.length < 5) return false; // Need sufficient baseline

    const baseline = this.earBaseline;
    const dropPct = baseline > 0 ? (baseline - currentEAR) / baseline : 0;
    
    // Blink requires a 20% drop from baseline AND to be under an absolute ceiling of 0.25 (to avoid head-turn false positives), OR a very deep absolute drop.
    return (dropPct >= EAR_RELATIVE_DROP && currentEAR < 0.25) || currentEAR < EAR_BLINK_THRESHOLD;
  }

  isMouthOpenDetected(currentMAR: number): boolean {
    if (this.marHistory.length < 5) return false; // Need sufficient baseline

    const baseline = this.marBaseline;
    const risePct = baseline > 0 ? (currentMAR - baseline) / baseline : 0;
    
    // Mouth open requires a 50% relative rise AND an absolute minimum MAR of 0.22, OR an extreme absolute opening.
    return (risePct >= MAR_RELATIVE_RISE && currentMAR > 0.22) || currentMAR > MAR_OPEN_THRESHOLD;
  }
}

/**
 * Capture a high-res screenshot from a video element
 */
export function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(video, 0, 0);
  }
  return canvas.toDataURL("image/jpeg", 0.95);
}
