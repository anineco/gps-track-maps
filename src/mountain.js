import 'normalize.css';
import './mountain.css';
import 'ol/ol.css';
import './lib/Toolbar.css';
import './lib/Popup.css';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import BingMaps from 'ol/source/BingMaps';
import Icon from 'ol/style/Icon';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import View from 'ol/View';
import {fromLonLat, toLonLat} from 'ol/proj';
import Map from 'ol/Map';
import {defaults} from 'ol/control';
import OverviewMap from 'ol/control/OverviewMap';
import Control from 'ol/control/Control';
import {format} from 'ol/coordinate';
import Toolbar from './lib/Toolbar.js';
import Popup from './lib/Popup.js';
import firebase from 'firebase/app';
import 'firebase/auth';
// import 'firebaseui/dist/firebaseui.css';
// import {auth} from 'firebaseui';
import 'es6-promise/auto'; // IE11
import 'whatwg-fetch'; // IE11

const elem = document.getElementById('map');
const key = elem.getAttribute('data-bingmaps-key');
const dburl = elem.getAttribute('data-db-url');
const param = {
  lon: 138.727412, lat: 35.360601, zoom: 12
};
document.cookie.split(/;\s*/).forEach(function (ma) {
  const s = ma.split('=');
  if (s[0] in param) {
    param[s[0]] = Number(s[1]);
  }
});
location.search.slice(1).split('&').forEach(function (ma) {
  const s = ma.split('=');
  if (s[0] in param) {
    param[s[0]] = Number(s[1]);
  }
});

const firebaseConfig = {
  apiKey: "_YOUR_API_KEY_",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
firebase.initializeApp(firebaseConfig);

const sub = document.getElementById('sub');

let user_email;

firebase.auth().onAuthStateChanged(function(user) {
  if (user) { // User is sign in.
    user_email = user.email;
    const span = document.createElement('span');
    span.textContent = user.email;
    sub.appendChild(span);
    const a = document.createElement('a');
    a.style.float = 'right';
    a.textContent = 'ログアウト';
    a.addEventListener('click', function () {
      firebase.auth().signOut().then(() => location.reload(false));
    });
    sub.appendChild(a);
  } else {
    sub.style.textAlign = 'center';
    sub.innerHTML = '<a href="http://anineco.local/~tad/map/mountain/signin.html">新規登録／ログイン</a>';
  }
});

const std = new TileLayer({
  title: '標準',
  source: new XYZ({
    attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
  })
});
const pale = new TileLayer({
  visible: false,
  title: '淡色',
  source: new XYZ({
    attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'
  })
});
const ort = new TileLayer({
  visible: false,
  title: '写真',
  source: key ? new BingMaps({ key: key, imagerySet: 'Aerial' }) : new XYZ({
    attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg'
  })
});
const otm = new TileLayer({
  visible: false,
  title: 'OTM',
  source: new XYZ({
    attributions: [
      '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, ',
      '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> ',
      '(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    ],
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
  })
});

const image = new Icon({
  src: 'https://map.jpn.org/share/952015.png',
  crossOrigin: 'Anonymous'
});
const fill = new Fill({ color: 'blue' });
const stroke = new Stroke({ color: 'white', width: 2 });

function styleFunction(feature) {
  return new Style({
    image: image,
    text: new Text({
      text: feature.get('name'),
      font: '14px sans-serif',
      fill: fill,
      stroke: stroke,
      textAlign: 'left',
      offsetX: 10,
      offsetY: -10
    })
  });
};

const sanmei = new VectorLayer({
  title: '山名',
  source: new VectorSource({
    url: dburl + '?cat=0&v=0',
    format: new GeoJSON()
  }),
  style: styleFunction
});

const view = new View({
  center: fromLonLat([param.lon, param.lat]),
  maxZoom: 18,
  minZoom: 5,
  zoom: param.zoom
});

const map = new Map({
  target: 'map',
  view: view,
  controls: defaults({
    attributionOptions: { collapsible: true }
  }).extend([
    new OverviewMap({ layers: [std, pale, ort, otm] })
  ]),
  layers: [std, pale, ort, otm, sanmei]
});

const popup = new Popup('popup');
map.addOverlay(popup);

const toolbar = new Toolbar(map, {
  layers: [std, pale, ort, otm],
  track: sanmei,
  disableCrosshair: true,
  closeLabel: 'TOP',
  closeHref: 'https://anineco.nyanta.jp/doku.php?id=sanmei:start'
});
map.addControl(toolbar);

function todms(s) {
  const a = String(s).match(/(\d+)(\d\d)(\d\d)/);
  return a[1] + '°' + a[2] + '′' + a[3] + '″';
}

function getHtml(geo) {
  return '<h2>' + geo.name
    + '</h2><table><tbody><tr><td>よみ</td><td>' + geo.kana
    + (geo.alias.length > 0 ?
        '</td></tr><tr><td>別名</td><td>' + geo.alias.map(
          alias => '<ruby>' + alias.name + '<rt>' + alias.kana + '</rt></ruby>'
        ).join('<br>') : '')
    + '</td></tr><tr><td>標高</td><td>' + geo.alt
    + 'm</td></tr><tr><td>緯度</td><td>' + todms(geo.lat)
    + '</td></tr><tr><td>経度</td><td>' + todms(geo.lon)
    + (geo.address ? '</td></tr><tr><td>所在</td><td>' + geo.address : '')
    + '</td></tr><tr><td>ID</td><td class="auth-' + geo.auth + '">' + geo.id
    + '</td></tr></tbody></table>';
}

function getGeoId(id, lon_lat, func) {
  const lon = lon_lat[0].toFixed(6);
  const lat = lon_lat[1].toFixed(6);
  const geo = {
    id: id,
    address: '?'
  };
  const sources = [];
  sources.push(new Promise((resolve) =>
    fetch(dburl + '?id=' + id).then(
      response => response.json()
    ).then(function (json) {
      const g = json.geo[0];
      geo.name = g.name;
      geo.kana = g.kana;
      geo.alias = g.alias;
      geo.alt = g.alt;
      geo.lat = g.lat;
      geo.lon = g.lon;
      geo.auth = g.auth;
      resolve();
    })
  ));
  const rgeocode = 'https://www.finds.jp/ws/rgeocode.php?json&lon=';
  sources.push(new Promise((resolve) =>
    fetch(rgeocode + lon + '&lat=' + lat).then(
      response => response.json()
    ).then(function (json) {
      geo.address = json.result.prefecture.pname + json.result.municipality.mname;
      resolve();
    })
  ));
  Promise.all(sources).then(() => func(geo));
}

function dms(x) {
  const sec = parseInt(x * 3600 + 0.5);
  const d = parseInt(sec / 3600);
  const m = parseInt((sec % 3600) / 60);
  const s = sec % 60;
  return d * 10000 + m * 100 + s;
}

function getGeo(lon_lat, func) {
  const lon = lon_lat[0].toFixed(6);
  const lat = lon_lat[1].toFixed(6);
  const geo = {
    lon: dms(lon_lat[0]),
    lat: dms(lon_lat[1]),
    alt: -1,
    address: '?'
  };
  const sources = [];
  const getelevation = 'https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?outtype=JSON&lon=';
  sources.push(new Promise((resolve) =>
    fetch(getelevation + lon + '&lat=' + lat).then(
      response => response.json()
    ).then(function (json) {
      geo.alt = parseInt(json.elevation + 0.5);
      resolve();
    })
  ));
  const rgeocode = 'https://www.finds.jp/ws/rgeocode.php?json&lon=';
  sources.push(new Promise((resolve) =>
    fetch(rgeocode + lon + '&lat=' + lat).then(
      response => response.json()
    ).then(function (json) {
      geo.address = json.result.prefecture.pname + json.result.municipality.mname;
      resolve();
    })
  ));
  Promise.all(sources).then(() => func(geo));
}

map.on('click', function(evt) {
  const found = map.forEachFeatureAtPixel(
    evt.pixel,
    function(feature, layer) {
      const geometry = feature.getGeometry();
      if (geometry.getType() !== 'Point') {
        return false;
      }
      popup.setContent('<h2>読み込み中</h2>');
      getGeoId(feature.getId(), toLonLat(geometry.getCoordinates()), function (geo) {
        popup.setContent(getHtml(geo));
      });
      return true;
    }
  );
  popup.setPosition(found ? evt.coordinate : undefined);
});

map.on('pointermove', function(evt) {
  if (evt.dragging) { return; }
  const found = map.forEachFeatureAtPixel(
    map.getEventPixel(evt.originalEvent),
    function(feature, layer) {
      return feature.getGeometry().getType() === 'Point';
    }
  );
  map.getTargetElement().style.cursor = found ? 'pointer' : '';
});

function todeg(s) {
  const a = String(s).match(/(\d+)(\d\d)(\d\d)/);
  return Number(a[1]) + Number(a[2]) / 60 + Number(a[3]) / 3600;
}

function moveto(lon, lat, id) {
  const lon_lat = [todeg(lon), todeg(lat)];
  popup.setContent('<h2>読み込み中</h2>');
  getGeoId(id, lon_lat, function (geo) {
    popup.setContent(getHtml(geo));
  });
  const coordinate = fromLonLat(lon_lat);
  popup.setPosition(coordinate);
  view.setCenter(coordinate);
}

const search = document.getElementById('search');
const q = document.getElementById('q');
const menu = document.getElementById('menu');
const hit = document.getElementById('hit');
const result = document.getElementById('result');
menu.className = 'ol-menu';

menu.appendChild(Toolbar.createLayerSwitch(sanmei));
menu.appendChild(Toolbar.createCrosshair(map));
menu.appendChild(Toolbar.createCenter(map, '中心点', function () {
  const coordinate = map.getView().getCenter();
  const lon_lat = toLonLat(coordinate);
  popup.setContent('<h2>読み込み中</h2>');
  getGeo(toLonLat(coordinate), function (geo) {
    popup.setContent(
      '<h2>現在地</h2><table><tbody><tr><td>標高</td><td>' + geo.alt
      + 'm<tr><td>緯度</td><td>' + todms(geo.lat)
      + '</td></tr><tr><td>経度</td><td>' + todms(geo.lon)
      + (geo.address ? '</td></tr><tr><td>所在</td><td>' + geo.address : '')
      + '</td></tr></tbody></table>'
    );
  });
  popup.setPosition(coordinate);
}));
menu.appendChild(Toolbar.createTerms(
  'この地図の作成にあたっては、国土地理院長の承認を得て、'
  + '同院発行の数値地図25000（地名・公共施設）を使用した。（承認番号 平29情使、第1007号）\n'
  + 'その他、以下のウェブサービスを利用しています。\n'
  + '・農研機構（https://www.finds.jp/）簡易逆ジオコーディングサービス\n'
  + '・地理院標高API（https://maps.gsi.go.jp/development/api.html）'
));

/*****
const edit = document.createElement('input');
edit.type = 'button';
edit.value = '編集';
menu.appendChild(edit);

const sub_menu = document.createElement('span');
sub_menu.style.float = 'right';
sub_menu.style.marginRight = '.5rem';
sub_menu.style.marginTop = '3px';
sub_menu.textContent = '▼';
sub_menu.title = 'サブメニュー';
sub_menu.addEventListener('click', function (evt) {
  if (sub_menu.textContent === '▼') {
    sub_menu.textContent = '▲';
    sub.style.display = 'block';
  } else {
    sub_menu.textContent = '▼';
    sub.style.display = 'none';
  }
});
menu.appendChild(sub_menu);
*****/

map.addControl(new Control({ element: search }));

function removeResult() { // 前回の検索結果を削除
  while (result.firstChild) {
    result.removeChild(result.firstChild);
  }
}

document.getElementById('q-close').addEventListener('click', function () {
  q.style.display = 'none';
  removeResult();
});

function query(s) {
  removeResult();
  q.style.display = 'block';
  hit.textContent = '検索中';
  fetch(dburl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'q=' + encodeURIComponent(s)
  }).then(
    response => response.json()
  ).then(function (json) {
    hit.textContent = json.geo.length + '件';
    json.geo.forEach(function (geo) {
      const tr = document.createElement('tr'); // new row
      let td = document.createElement('td'); // 1st column
      const a = document.createElement('a');
      a.setAttribute('href', '#');
      a.addEventListener('click', () => moveto(geo.lon, geo.lat, geo.id));
      tr.appendChild(td).appendChild(a).textContent = geo.id;

      td = document.createElement('td'); // 2nd column
      const ruby = document.createElement('ruby');
      const rt = document.createElement('rt');
      ruby.textContent = geo.name;
      tr.appendChild(td).appendChild(ruby).appendChild(rt).textContent = geo.kana;

      td = document.createElement('td'); // 3rd column
      result.appendChild(tr).appendChild(td).textContent = geo.alt;
    });
  });
}

form3.addEventListener('submit', function (event) {
  const s = form3.elements['qname'].value;
  let r = s.match(/^(\d+)[,\t](\d+)$/);
  if (r) {
    view.setCenter(fromLonLat([todeg(r[2]), todeg(r[1])]));
  } else {
    r = s.match(/^(\d+\.\d+)[,\t](\d+\.\d+)$/);
    if (r) {
      view.setCenter(fromLonLat([Number(r[2]), Number(r[1])]));
    } else {
      query(s);
    }
  }
  event.preventDefault();
}, false);

window.addEventListener('beforeunload', function (event) {
  const center = toLonLat(view.getCenter());
  const zoom = view.getZoom();
  const opt = ';max-age=2592000';

  document.cookie = 'lon=' + center[0].toFixed(6) + opt;
  document.cookie = 'lat=' + center[1].toFixed(6) + opt;
  document.cookie = 'zoom=' + zoom + opt;
});
