import { DeviceType } from '../types/transfer';

// Mapping of known phone model codes to consumer marketing names
const KNOWN_DEVICE_MODELS: Record<string, string> = {
  // Realme Models (Requested specifically by user: Realme C35)
  'RMX3511': 'Realme C35',
  'RMX3512': 'Realme C35',
  'RMX3513': 'Realme C35',
  'RMX3261': 'Realme C21Y',
  'RMX3263': 'Realme C21Y',
  'RMX3201': 'Realme C25',
  'RMX3085': 'Realme 8',
  'RMX3360': 'Realme GT Master',
  'RMX3363': 'Realme GT Master',
  'RMX3370': 'Realme GT Neo2',
  'RMX3706': 'Realme GT Neo 5',
  'RMX3771': 'Realme 11 Pro',
  'RMX3840': 'Realme 12 Pro+',
  'RMX3710': 'Realme C55',
  'RMX3834': 'Realme C67',
  'RMX3630': 'Realme 10',

  // Samsung Galaxy S series
  'SM-S928B': 'Galaxy S24 Ultra',
  'SM-S928U': 'Galaxy S24 Ultra',
  'SM-S926B': 'Galaxy S24+',
  'SM-S921B': 'Galaxy S24',
  'SM-S918B': 'Galaxy S23 Ultra',
  'SM-S918U': 'Galaxy S23 Ultra',
  'SM-S916B': 'Galaxy S23+',
  'SM-S911B': 'Galaxy S23',
  'SM-S908B': 'Galaxy S22 Ultra',
  'SM-S906B': 'Galaxy S22+',
  'SM-S901B': 'Galaxy S22',
  'SM-G998B': 'Galaxy S21 Ultra',
  'SM-G996B': 'Galaxy S21+',
  'SM-G991B': 'Galaxy S21',
  'SM-G988B': 'Galaxy S20 Ultra',
  'SM-G981B': 'Galaxy S20',
  'SM-G973F': 'Galaxy S10',

  // Samsung Galaxy A & Z series
  'SM-A546B': 'Galaxy A54',
  'SM-A536B': 'Galaxy A53',
  'SM-A346B': 'Galaxy A34',
  'SM-A145F': 'Galaxy A14',
  'SM-F946B': 'Galaxy Z Fold 5',
  'SM-F731B': 'Galaxy Z Flip 5',
  'SM-F936B': 'Galaxy Z Fold 4',
  'SM-F721B': 'Galaxy Z Flip 4',

  // Xiaomi & POCO & Redmi
  'M2102J20SG': 'POCO X3 Pro',
  '2201123G': 'Xiaomi 12',
  '2210132G': 'Xiaomi 13',
  '23116PN5BC': 'Xiaomi 14',
  '2201116SG': 'Redmi Note 11 Pro',
  '23021RAAEG': 'Redmi Note 12',

  // OnePlus
  'CPH2449': 'OnePlus 11',
  'CPH2451': 'OnePlus 11',
  'NE2213': 'OnePlus 10 Pro',
  'IN2023': 'OnePlus 8 Pro',
};

function formatModelCode(rawCode: string): string {
  const clean = rawCode.trim();
  // Check exact lookup
  if (KNOWN_DEVICE_MODELS[clean]) {
    return KNOWN_DEVICE_MODELS[clean];
  }

  // Check prefix matches
  if (/^RMX\d+/i.test(clean)) {
    return `Realme ${clean}`;
  }
  if (/^SM-S\d+/i.test(clean)) {
    return `Samsung Galaxy ${clean}`;
  }
  if (/^SM-A\d+/i.test(clean)) {
    return `Samsung Galaxy ${clean}`;
  }
  if (/^SM-F\d+/i.test(clean)) {
    return `Samsung Galaxy ${clean}`;
  }
  if (/^SM-[A-Z0-9]+/i.test(clean)) {
    return `Samsung ${clean}`;
  }
  if (/^Pixel/i.test(clean)) {
    return `Google ${clean}`;
  }
  if (/^CPH\d+/i.test(clean)) {
    return `Oppo ${clean}`;
  }
  if (/^V\d{4}/i.test(clean)) {
    return `Vivo ${clean}`;
  }

  // Clean underscores/slashes
  return clean.replace(/_/g, ' ');
}

export function detectDevice(): {
  deviceType: DeviceType;
  os: string;
  browser: string;
  modelName: string;
} {
  if (typeof window === 'undefined') {
    return { deviceType: 'unknown', os: 'Unknown', browser: 'Unknown', modelName: 'Device' };
  }

  const ua = navigator.userAgent;
  let deviceType: DeviceType = 'desktop';
  let modelName = '';

  // 1. Android Device Model Extraction
  if (/Android/i.test(ua)) {
    deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet';

    // Android UA model pattern: "; <Model> Build/" or "; <Model>)" or "; wv; <Model> Build/"
    // e.g. "Mozilla/5.0 (Linux; Android 11; RMX3511 Build/RP1A.201005.001) ..."
    const androidMatch = ua.match(/;\s*(?:wv;\s*)?(?:[a-z]{2}-[a-z]{2};\s*)?([^;)]+)\s*(?:Build|\))/i);
    if (androidMatch && androidMatch[1]) {
      const candidate = androidMatch[1].trim();
      // Exclude generic strings
      if (!/^(Android|Linux|U|en-us|armv\w+|Release|Mobile|Tablet)$/i.test(candidate)) {
        modelName = formatModelCode(candidate);
      }
    }

    if (!modelName) {
      modelName = deviceType === 'tablet' ? 'Android Tablet' : 'Android Phone';
    }
  }

  // 2. Apple iOS (iPhone / iPad / iPod)
  else if (/iPhone|iPad|iPod/i.test(ua)) {
    const isIPad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    deviceType = isIPad ? 'tablet' : 'mobile';

    if (isIPad) {
      const w = window.screen.width;
      const h = window.screen.height;
      const maxDim = Math.max(w, h);
      if (maxDim >= 1366) modelName = 'iPad Pro 12.9"';
      else if (maxDim >= 1194) modelName = 'iPad Pro 11"';
      else if (maxDim >= 1180) modelName = 'iPad Air';
      else if (maxDim <= 1133) modelName = 'iPad mini';
      else modelName = 'Apple iPad';
    } else {
      // iPhone resolution mapping
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(window.screen.width * dpr);
      const h = Math.round(window.screen.height * dpr);
      const maxDim = Math.max(w, h);
      const minDim = Math.min(w, h);

      if (minDim === 1290 && maxDim === 2796) modelName = 'iPhone 15 Pro Max';
      else if (minDim === 1179 && maxDim === 2556) modelName = 'iPhone 15 Pro';
      else if (minDim === 1284 && maxDim === 2778) modelName = 'iPhone 14 Plus';
      else if (minDim === 1170 && maxDim === 2532) modelName = 'iPhone 14 / 13';
      else if (minDim === 1080 && maxDim === 2340) modelName = 'iPhone 13 mini';
      else if (minDim === 828 && maxDim === 1792) modelName = 'iPhone 11';
      else if (minDim === 1242 && maxDim === 2688) modelName = 'iPhone 11 Pro Max';
      else if (minDim === 1125 && maxDim === 2436) modelName = 'iPhone 11 Pro / X';
      else if (minDim === 750 && maxDim === 1334) modelName = 'iPhone SE';
      else modelName = 'Apple iPhone';
    }
  }

  // 3. Apple macOS
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    // If iPad pretending to be Mac (iPadOS desktop safari mode)
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) {
      deviceType = 'tablet';
      modelName = 'Apple iPad Pro';
    } else {
      // Detect laptop vs desktop
      const isRetina = window.devicePixelRatio >= 2;
      const screenH = window.screen.height;
      if (isRetina && screenH <= 1200) {
        deviceType = 'laptop';
        modelName = 'MacBook Pro';
      } else if (screenH > 1200) {
        deviceType = 'desktop';
        modelName = 'Apple iMac / Mac Studio';
      } else {
        deviceType = 'laptop';
        modelName = 'Apple MacBook';
      }
    }
  }

  // 4. Windows PC
  else if (/Windows/i.test(ua)) {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch && window.screen.width <= 1366) {
      deviceType = 'laptop';
      modelName = 'Surface / Windows Laptop';
    } else if (hasTouch) {
      deviceType = 'laptop';
      modelName = 'Windows Laptop';
    } else {
      deviceType = 'desktop';
      modelName = 'Windows PC';
    }
  }

  // 5. Linux
  else if (/Linux/i.test(ua)) {
    deviceType = 'desktop';
    modelName = 'Linux Workstation';
  }

  // 6. ChromeOS
  else if (/CrOS/i.test(ua)) {
    deviceType = 'laptop';
    modelName = 'Chromebook';
  } else {
    modelName = 'Personal Computer';
  }

  // Operating System
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 11/10';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) {
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else os = 'macOS';
  } else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  // Browser
  let browser = 'Unknown Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  return { deviceType, os, browser, modelName };
}

// Async high-entropy model lookup via User-Agent Client Hints (Chromium Android/Desktop)
export async function getAccurateDeviceModel(): Promise<string> {
  const fallback = detectDevice().modelName;

  try {
    const nav = navigator as any;
    if (nav.userAgentData && typeof nav.userAgentData.getHighEntropyValues === 'function') {
      const hints = await nav.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion']);
      if (hints.model && hints.model.trim()) {
        const mapped = formatModelCode(hints.model.trim());
        return mapped;
      }
    }
  } catch (e) {
    console.debug('UA client hints not supported or restricted:', e);
  }

  return fallback;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--';
  if (seconds < 1) return '< 1s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

// Fast CRC32 computation for chunk verification
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

export function computeCRC32(buffer: Uint8Array): string {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}
