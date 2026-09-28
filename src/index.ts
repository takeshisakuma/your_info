const axios = require('axios');

//型
import { userInfosType } from "./ts/userInfosType";
import { ipType } from "./ts/ipType";
import { positionInfosType } from "./ts/positionInfosType";
import { accelerationInfosType } from "./ts/accelerationInfosType";

declare const Intl: {
  DateTimeFormat: new () => {
    resolvedOptions: () => { timeZone?: string };
  };
};

const unavailable = "取得できませんでした";

type UaBrand = {
  brand: string;
  version: string;
};

type UaHighEntropy = {
  architecture?: string;
  bitness?: string;
  model?: string;
  platform?: string;
  platformVersion?: string;
  fullVersionList?: UaBrand[];
};

type UaClientHints = {
  brands: UaBrand[];
  mobile: boolean;
  platform: string;
  getHighEntropyValues?: (hints: string[]) => {
    then: (onFulfilled: (value: UaHighEntropy) => void) => {
      catch: (onRejected: () => void) => {
        then: (onFinally: () => void) => void;
      };
    };
  };
};

type NetworkInfo = {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

const userInfos: userInfosType = {};

const findBrand = (brands: UaBrand[] | undefined, brandName: string): UaBrand | undefined => {
  if (!brands) {
    return undefined;
  }
  for (let i = 0; i < brands.length; i++) {
    if (brands[i].brand === brandName) {
      return brands[i];
    }
  }
  return undefined;
};

const meaningfulBrand = (brands: UaBrand[] | undefined): UaBrand | undefined => {
  if (!brands) {
    return undefined;
  }
  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i].brand;
    if (brand !== "Chromium" && brand.indexOf("Not") !== 0) {
      return brands[i];
    }
  }
  return findBrand(brands, "Chromium");
};

const parseBrowser = (ua: string): { name: string; version: string } => {
  const matchers: { name: string; pattern: RegExp }[] = [
    { name: "Microsoft Edge", pattern: /Edg(?:e|A|iOS)?\/(\d+(?:\.\d+)*)/ },
    { name: "Opera", pattern: /OPR\/(\d+(?:\.\d+)*)/ },
    { name: "Samsung Internet", pattern: /SamsungBrowser\/(\d+(?:\.\d+)*)/ },
    { name: "Firefox", pattern: /(?:Firefox|FxiOS)\/(\d+(?:\.\d+)*)/ },
    { name: "Chrome", pattern: /(?:Chrome|CriOS)\/(\d+(?:\.\d+)*)/ },
    { name: "Safari", pattern: /Version\/(\d+(?:\.\d+)*)/ },
  ];
  for (let i = 0; i < matchers.length; i++) {
    const matched = ua.match(matchers[i].pattern);
    if (matched && matched[1]) {
      return { name: matchers[i].name, version: matched[1] };
    }
  }
  return { name: unavailable, version: unavailable };
};

const parseOs = (ua: string): string => {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return unavailable;
};

// Windows 11 以降の platformVersion はメジャー 13 以上
const formatOsVersion = (platform: string, platformVersion: string | undefined): string => {
  if (!platformVersion) {
    return unavailable;
  }
  if (platform === "Windows") {
    const major = parseInt(platformVersion.split(".")[0], 10);
    if (major >= 13) {
      return "11（" + platformVersion + "）";
    }
    if (major >= 1) {
      return "10（" + platformVersion + "）";
    }
  }
  return platformVersion;
};

const formatUtcOffset = (date: Date): string => {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  if (minutes === 0) {
    return "UTC" + sign + hours;
  }
  const minuteText = minutes < 10 ? "0" + minutes : String(minutes);
  return "UTC" + sign + hours + ":" + minuteText;
};

const timeZoneName = (): string => {
  try {
    const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone || unavailable;
  } catch (e) {
    return unavailable;
  }
};

const formatOrientation = (): string => {
  const orientation = screen.orientation;
  if (!orientation || !orientation.type) {
    return unavailable;
  }
  const orientationType: string = orientation.type;
  let label = orientationType;
  if (orientationType === "portrait-primary") label = "縦";
  if (orientationType === "portrait-secondary") label = "縦（逆さ）";
  if (orientationType === "landscape-primary") label = "横";
  if (orientationType === "landscape-secondary") label = "横（逆さ）";
  if (typeof orientation.angle === "number") {
    return label + "（" + orientation.angle + "度）";
  }
  return label;
};

const readConnection = (): NetworkInfo | undefined => {
  const nav = navigator as Navigator & {
    connection?: NetworkInfo;
    mozConnection?: NetworkInfo;
    webkitConnection?: NetworkInfo;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection;
};

const formatConnectionType = (connection: NetworkInfo | undefined): string => {
  if (!connection || !connection.type) {
    return unavailable;
  }
  if (connection.type === "wifi") return "Wi-Fi";
  if (connection.type === "cellular") return "モバイル通信";
  if (connection.type === "ethernet") return "有線";
  if (connection.type === "bluetooth") return "Bluetooth";
  if (connection.type === "wimax") return "WiMAX";
  if (connection.type === "none") return "なし";
  if (connection.type === "other") return "その他";
  if (connection.type === "unknown") return "不明";
  return connection.type;
};

const formatEffectiveType = (connection: NetworkInfo | undefined): string => {
  if (!connection || !connection.effectiveType) {
    return unavailable;
  }
  if (connection.effectiveType === "slow-2g") return "低速";
  if (connection.effectiveType === "2g") return "2G";
  if (connection.effectiveType === "3g") return "3G";
  if (connection.effectiveType === "4g") return "4G以上";
  return connection.effectiveType;
};

const formatDownlink = (connection: NetworkInfo | undefined): string => {
  if (!connection || typeof connection.downlink !== "number") {
    return unavailable;
  }
  return connection.downlink + " Mbps";
};

const formatRtt = (connection: NetworkInfo | undefined): string => {
  if (!connection || typeof connection.rtt !== "number") {
    return unavailable;
  }
  return connection.rtt + " ms";
};

const formatSaveData = (connection: NetworkInfo | undefined): string => {
  if (!connection || typeof connection.saveData !== "boolean") {
    return unavailable;
  }
  return connection.saveData ? "オン" : "オフ";
};

const fillUserInfos = (
  ipAddress: string,
  uaData: UaClientHints | undefined,
  highEntropy: UaHighEntropy | undefined,
  hasHighEntropy: boolean
): void => {
  const ua = navigator.userAgent;
  const picked = meaningfulBrand(uaData ? uaData.brands : undefined);
  const connection = readConnection();

  let browserName = unavailable;
  let browserVersion = unavailable;
  let os = unavailable;
  let osVersion = unavailable;
  let architecture = unavailable;
  let bitness = unavailable;
  let model = unavailable;
  let mobile = /iPhone|iPad|iPod|Android|Mobi/.test(ua) ? "はい" : "いいえ";

  if (uaData && picked) {
    const fullVersion = findBrand(highEntropy ? highEntropy.fullVersionList : undefined, picked.brand);
    browserName = picked.brand;
    browserVersion = (fullVersion && fullVersion.version) || picked.version || unavailable;
    os = (highEntropy && highEntropy.platform) || uaData.platform || unavailable;
    osVersion = formatOsVersion(os, highEntropy ? highEntropy.platformVersion : undefined);
    mobile = uaData.mobile ? "はい" : "いいえ";
    if (hasHighEntropy && highEntropy) {
      architecture = highEntropy.architecture || unavailable;
      bitness = highEntropy.bitness ? highEntropy.bitness + "bit" : unavailable;
      model = highEntropy.model || "なし";
    }
  } else {
    const parsed = parseBrowser(ua);
    browserName = parsed.name;
    browserVersion = parsed.version;
    os = parseOs(ua);
  }

  userInfos.IPアドレス = ipAddress;
  userInfos.ブラウザ名 = browserName;
  userInfos.ブラウザバージョン = browserVersion;
  userInfos.ブラウザの使用言語 = navigator.language;
  userInfos.優先言語 = (navigator.languages && navigator.languages.length > 0)
    ? navigator.languages.join("、")
    : navigator.language;
  userInfos.OS = os;
  userInfos.OSバージョン = osVersion;
  userInfos.CPUアーキテクチャ = architecture;
  userInfos.ビット数 = bitness;
  userInfos.端末モデル = model;
  userInfos.モバイル = mobile;
  userInfos.ブラウザのユーザーエージェント = ua;
  userInfos.タイムゾーン = timeZoneName();
  userInfos.UTCとの時差 = formatUtcOffset(new Date());
  userInfos.CPUの論理コア数 = navigator.hardwareConcurrency || unavailable;
  userInfos.スクリーンの幅 = screen.width;
  userInfos.スクリーンの高さ = screen.height;
  userInfos.画面の作業領域の幅 = screen.availWidth;
  userInfos.画面の作業領域の高さ = screen.availHeight;
  userInfos.画面の向き = formatOrientation();
  userInfos.スクリーンの色深度bit = screen.colorDepth;
  userInfos.ブラウザのビューポートの幅 = window.innerWidth;
  userInfos.ブラウザのビューポートの高さ = window.innerHeight;
  userInfos.デバイスピクセル比 = window.devicePixelRatio;
  userInfos.カラーモード = window.matchMedia("(prefers-color-scheme: dark)").matches ? "ダーク" : "ライト";
  userInfos.タッチ操作 = (navigator.maxTouchPoints === 0) ? "不可" : "可";
  userInfos.最大同時タッチ数 = navigator.maxTouchPoints;
  userInfos.通信の種類 = formatConnectionType(connection);
  userInfos.通信の実効タイプ = formatEffectiveType(connection);
  userInfos.下り速度の目安 = formatDownlink(connection);
  userInfos.通信の遅延 = formatRtt(connection);
  userInfos.データセーバー = formatSaveData(connection);
};

const renderInfoTable = (container: HTMLElement, rows: object): void => {
  const table = document.createElement("table");

  for (const [key, value] of Object.entries(rows)) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const valueCell = document.createElement("td");
    nameCell.textContent = key;
    valueCell.textContent = String(value);
    row.append(nameCell, valueCell);
    table.append(row);
  }

  container.innerHTML = "";
  container.append(table);
};

const renderUserInfos = (): void => {
  const userInfosDiv = document.getElementById("userInfos")!;
  renderInfoTable(userInfosDiv, userInfos);
};

let ipAddress = unavailable;
let highEntropy: UaHighEntropy | undefined;
let hasHighEntropy = false;
const uaData = (navigator as Navigator & { userAgentData?: UaClientHints }).userAgentData;

let remaining = 2;
const finishUserInfos = (): void => {
  remaining -= 1;
  if (remaining > 0) {
    return;
  }
  fillUserInfos(ipAddress, uaData, highEntropy, hasHighEntropy);
  renderUserInfos();
};

axios.get("https://ipinfo.io/ip").then((res: ipType) => {
  ipAddress = (typeof res.data === "string") ? res.data.trim() : unavailable;
}).catch(() => {
  ipAddress = unavailable;
}).then(finishUserInfos);

if (uaData && uaData.getHighEntropyValues) {
  uaData.getHighEntropyValues([
    "architecture",
    "bitness",
    "model",
    "platformVersion",
    "fullVersionList",
  ]).then((values) => {
    highEntropy = values;
    hasHighEntropy = true;
  }).catch(() => {
    hasHighEntropy = false;
  }).then(finishUserInfos);
} else {
  finishUserInfos();
}



//位置情報
const userPositionDiv = document.getElementById("userPosition")!;

const successCallback = (position: GeolocationPosition): void => {
  const positionInfos: positionInfosType = {};
  positionInfos.緯度 = (position.coords.latitude !== null) ? position.coords.latitude : unavailable;
  positionInfos.経度 = (position.coords.longitude !== null) ? position.coords.longitude : unavailable;
  positionInfos.高度 = (position.coords.altitude !== null) ? position.coords.altitude : unavailable;
  positionInfos.緯度と経度の誤差 = (position.coords.accuracy !== null) ? position.coords.accuracy : unavailable;
  positionInfos.高度の誤差 = (position.coords.altitudeAccuracy !== null) ? position.coords.altitudeAccuracy : unavailable;
  positionInfos.方角 = (position.coords.heading !== null) ? position.coords.heading : unavailable;
  positionInfos.速度 = (position.coords.speed !== null) ? position.coords.speed : unavailable;
  renderInfoTable(userPositionDiv, positionInfos);
};

const failureCallback = (error: GeolocationPositionError): void => {
  if (error.code === error.PERMISSION_DENIED) {
    userPositionDiv.textContent = "位置情報へのアクセスが許可されませんでした。";
    return;
  }
  if (error.code === error.TIMEOUT) {
    userPositionDiv.textContent = "位置情報の取得がタイムアウトしました。";
    return;
  }
  userPositionDiv.textContent = "位置情報を取得できませんでした。";
};

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(successCallback, failureCallback);
} else {
  userPositionDiv.textContent = "この端末では位置情報を取得できませんでした。";
}


//センサー
const userSensorDiv = document.getElementById("userSensor")!;

const sensorValue = (value: number | null | undefined): number | string => {
  return (value !== null && value !== undefined) ? value : unavailable;
};

const readSensor = (event: DeviceMotionEvent): accelerationInfosType => {
  const accelerationInfos: accelerationInfosType = {};
  accelerationInfos.加速度_X軸 = sensorValue(event.acceleration && event.acceleration.x);
  accelerationInfos.加速度_Y軸 = sensorValue(event.acceleration && event.acceleration.y);
  accelerationInfos.加速度_Z軸 = sensorValue(event.acceleration && event.acceleration.z);
  accelerationInfos.加速度プラス重力加速度_X軸 = sensorValue(event.accelerationIncludingGravity && event.accelerationIncludingGravity.x);
  accelerationInfos.加速度プラス重力加速度_Y軸 = sensorValue(event.accelerationIncludingGravity && event.accelerationIncludingGravity.y);
  accelerationInfos.加速度プラス重力加速度_Z軸 = sensorValue(event.accelerationIncludingGravity && event.accelerationIncludingGravity.z);
  accelerationInfos.回転加速度_X軸 = sensorValue(event.rotationRate && event.rotationRate.beta);
  accelerationInfos.回転加速度_Y軸 = sensorValue(event.rotationRate && event.rotationRate.gamma);
  accelerationInfos.回転加速度_Z軸 = sensorValue(event.rotationRate && event.rotationRate.alpha);
  return accelerationInfos;
};

if (typeof DeviceMotionEvent === "undefined") {
  userSensorDiv.textContent = "この端末ではセンサー情報を取得できませんでした。";
} else {
  let sensorReceived = false;
  let sensorPending = false;
  let latestSensor: accelerationInfosType = {};

  window.addEventListener("devicemotion", (event: DeviceMotionEvent) => {
    sensorReceived = true;
    latestSensor = readSensor(event);
    if (sensorPending) {
      return;
    }
    sensorPending = true;
    window.requestAnimationFrame(() => {
      sensorPending = false;
      renderInfoTable(userSensorDiv, latestSensor);
    });
  });

  window.setTimeout(() => {
    if (!sensorReceived) {
      userSensorDiv.textContent = "この端末ではセンサー情報を取得できませんでした。";
    }
  }, 1500);
}


//通信状況
const userOnline = document.getElementById("userOnline")!;

const renderOnline = (): void => {
  userOnline.textContent = navigator.onLine ? "現在オンラインです。" : "現在オフラインです。";
};

renderOnline();
window.addEventListener("online", renderOnline);
window.addEventListener("offline", renderOnline);
