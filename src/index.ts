const axios = require('axios');

//型
import { userInfosType } from "./ts/userInfosType";
import { ipType } from "./ts/ipType";
import { positionInfosType } from "./ts/positionInfosType";
import { accelerationInfosType } from "./ts/accelerationInfosType";

const userInfos: userInfosType = {};



axios.get("https://ipinfo.io/ip").then((res: ipType) => {
  userInfos.IPアドレス = res.data;
  userInfos.ブラウザのコード名 = navigator.appCodeName;
  userInfos.ブラウザ名 = navigator.appName;
  userInfos.ブラウザバージョン = navigator.appVersion;
  userInfos.ブラウザの使用言語 = navigator.language;
  userInfos.ブラウザのプラットフォーム = navigator.platform;
  userInfos.ブラウザのユーザーエージェント = navigator.userAgent;
  userInfos.スクリーンの幅 = screen.width;
  userInfos.スクリーンの高さ = screen.height;
  userInfos.スクリーンの色深度bit = screen.colorDepth;
  userInfos.ブラウザのビューポートの幅 = window.innerWidth;
  userInfos.ブラウザのビューポートの高さ = window.innerHeight;
  userInfos.デバイスピクセル比 = window.devicePixelRatio;
  userInfos.タッチ操作 =
    (navigator.maxTouchPoints === 0) ? "不可" : "可";
  userInfos.最大同時タッチ数 = navigator.maxTouchPoints;


  const table1 = document.createElement("table");

  for (const [key, value] of Object.entries(userInfos)) {
    table1.innerHTML += "<tr>" + "<td>" + key + "</td>" + "<td>" + value + "</td>" + "</tr>"
  }
  const userInfosDiv = document.getElementById("userInfos")!;
  userInfosDiv.append(table1);


})





//位置情報
const successCallback = (position: GeolocationPosition) => {
  const positionInfos: positionInfosType = {}
  positionInfos.緯度 = (position.coords.latitude !== null) ? position.coords.latitude : "取得できませんでした";
  positionInfos.経度 = (position.coords.longitude !== null) ? position.coords.longitude : "取得できませんでした";
  positionInfos.高度 = (position.coords.altitude !== null) ? position.coords.altitude : "取得できませんでした";
  positionInfos.緯度と経度の誤差 = (position.coords.accuracy !== null) ? position.coords.accuracy : "取得できませんでした";
  positionInfos.高度の誤差 = (position.coords.altitudeAccuracy !== null) ? position.coords.altitudeAccuracy : "取得できませんでした";
  positionInfos.方角 = (position.coords.heading !== null) ? position.coords.heading : "取得できませんでした";
  positionInfos.速度 = (position.coords.speed !== null) ? position.coords.speed : "取得できませんでした";

  const table2 = document.createElement("table");

  for (const [key, value] of Object.entries(positionInfos)) {
    table2.innerHTML += "<tr>" + "<td>" + key + "</td>" + "<td>" + value + "</td>" + "</tr>"

    const userPositionDiv = document.getElementById("userPosition")!;
    userPositionDiv.innerHTML = "";
    userPositionDiv.append(table2);
  }
}

const failureCallback = (error: GeolocationPositionError) => {
  console.log(error);
}

navigator.geolocation.watchPosition(successCallback, failureCallback);
//navigator.geolocation.getCurrentPosition(successCallback, failureCallback);






const deviceOrientationTest = () => {







  window.addEventListener("devicemotion", (event: DeviceMotionEvent) => {
    const accelerationInfos: accelerationInfosType = {};

    if (event.acceleration) {
      accelerationInfos.加速度_X軸 = (event.acceleration.x !== null) ? event.acceleration.x : "取得できませんでした。";
      accelerationInfos.加速度_Y軸 = (event.acceleration.y !== null) ? event.acceleration.y : "取得できませんでした。";
      accelerationInfos.加速度_Z軸 = (event.acceleration.z !== null) ? event.acceleration.z : "取得できませんでした。";
    }
    if (event.accelerationIncludingGravity) {
      accelerationInfos.加速度プラス重力加速度_X軸 = (event.accelerationIncludingGravity.x !== null) ? event.accelerationIncludingGravity.x : "取得できませんでした。";
      accelerationInfos.加速度プラス重力加速度_Y軸 = (event.accelerationIncludingGravity.y !== null) ? event.accelerationIncludingGravity.y : "取得できませんでした。";
      accelerationInfos.加速度プラス重力加速度_Z軸 = (event.accelerationIncludingGravity.z !== null) ? event.accelerationIncludingGravity.z : "取得できませんでした。";
    }
    if (event.rotationRate) {
      accelerationInfos.回転加速度_X軸 = (event.rotationRate.beta !== null) ? event.rotationRate.beta : "取得できませんでした。";
      accelerationInfos.回転加速度_Y軸 = (event.rotationRate.gamma !== null) ? event.rotationRate.gamma : "取得できませんでした。";
      accelerationInfos.回転加速度_Z軸 = (event.rotationRate.alpha !== null) ? event.rotationRate.alpha : "取得できませんでした。";

      const table3 = document.createElement("table");


      for (const [key, value] of Object.entries(accelerationInfos)) {
        table3.innerHTML += "<tr>" + "<td>" + key + "</td>" + "<td>" + value + "</td>" + "</tr>"

        const userSensorDiv = document.getElementById("userSensor")!;
        userSensorDiv.innerHTML = "";
        userSensorDiv.append(table3);

      }
    }
  })
}
  ;




//センサーから加速度を取得して書き出す処理をループ実行

const deviceOrientationLoop = () => {

  deviceOrientationTest();
  window.requestAnimationFrame(deviceOrientationLoop);
};

deviceOrientationLoop();


//通信状況
const userOnline = document.getElementById("userOnline")!;

const getNetworkCondition = () => {
  userOnline.innerHTML = (navigator.onLine) ? "現在オンラインです。" : "現在オフラインです。";
  window.requestAnimationFrame(getNetworkCondition);
}

getNetworkCondition();
