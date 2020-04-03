import 'normalize.css';
import './map.css';
import 'ol/ol.css';
import './lib/Toolbar.css';
import './lib/Popup.css';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import BingMaps from 'ol/source/BingMaps';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import Style from 'ol/style/Style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import View from 'ol/View';
import {fromLonLat, toLonLat} from 'ol/proj';
import Map from 'ol/Map';
import {defaults} from 'ol/control';
import OverviewMap from 'ol/control/OverviewMap';
import {format} from 'ol/coordinate';
import Toolbar from './lib/Toolbar.js';
import Popup from './lib/Popup.js';
import "es6-promise/auto"; // IE11
import "fetch-polyfill"; // IE11

const elem = document.getElementById('map');
const key = elem.getAttribute('data-bingmaps-key');
const dburl = elem.getAttribute('data-db-url');
const init = [
  { lat: 36.4967, lon: 139.3318, zoom: 12, title: '全山行記録' },
  { lat: 36.5439, lon: 138.9261, zoom: 9, title: '日本三百名山' },
  { lat: 36.5493, lon: 138.9261, zoom: 10, title: 'ぐんま百名山' },
  { lat: 36.7332, lon: 139.7925, zoom: 10, title: '栃木百名山' },
  { lat: 36.4967, lon: 139.3318, zoom: 12, title: '桐生地域百山' },
  { lat: 36.1019, lon: 138.0629, zoom: 9, title: '信州百名山' },
  { lat: 35.5747, lon: 138.6364, zoom: 10, title: '山梨百名山' },
  { lat: 37.4422, lon: 140.1566, zoom: 9, title: 'うつくしま百名山' },
  { lat: 36.0110, lon: 139.0491, zoom: 11, title: '埼玉百山' }
];
let param = { cat: 1 };
location.search.substr(1).split('&').forEach(function (ma) {
  const s = ma.split('=');
  if (s[0] === 'cat') {
    param[s[0]] = Number(s[1]);
  }
});
let cat = param.cat;
if (cat < 0 || cat > 8) {
  cat = 0;
}
param = init[cat];
param.cat = cat;
param.v = cat > 0 ? 2 : 1;
param.map = 'pale';
document.getElementById('panel').textContent = '地図から選択 - ' + param.title;

const std = new TileLayer({
  visible: false,
  title: '標準',
  source: new XYZ({
    attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
  })
});
const pale = new TileLayer({
  visible: true,
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
  src: 'share/952015.png'
});
const fill = [
  new Fill({ color: 'yellow' }),
  new Fill({ color: 'blue'   })
];
const stroke = [
  new Stroke({ width: 2, color: 'gray'  }),
  new Stroke({ width: 2, color: 'white' })
];

function styleFunction(feature) {
  const i = feature.get('c') > 0 ? 1 : 0;
  return new Style({
    image: image,
    text: new Text({
      text: feature.get('name'),
      font: '14px sans-serif',
      fill: fill[i],
      stroke: stroke[i],
      textAlign: 'left',
      offsetX: 10,
      offsetY: -10
    })
  });
};

const sanmei = new VectorLayer({
  title: '山名',
  source: new VectorSource({
    url: dburl + '?cat=' + param.cat + '&v=' + param.v,
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
  controls: defaults().extend([
    new OverviewMap({ layers: [std, pale, ort, otm] })
  ]),
  layers: [std, pale, ort, otm, sanmei]
});

const popup = new Popup('popup');
map.addOverlay(popup);

const toolbar = new Toolbar(map, {
  layers: [std, pale, ort, otm],
  track: sanmei,
  center: function () {
    const coordinate = map.getView().getCenter();
    const lon_lat = toLonLat(coordinate);
    popup.setContent('<h2>現在地</h2><div><table><tbody><tr><td>緯度[°]</td><td>'
      + lon_lat[1].toFixed(6) + '</td></tr><tr><td>経度[°]</td><td>'
      + lon_lat[0].toFixed(6) + '</td></tr></tbody></table>'
    );
    popup.setPosition(coordinate);
  },
  terms: 'この地図の作成にあたっては、国土地理院長の承認を得て、同院発行の数値地図25000（地名・公共施設）を使用した。（承認番号 平29情使、第1007号）',
  closeLabel: 'TOP',
  closeHref: '.'
});
map.addControl(toolbar);

function todms(s) {
  const a = String(s).match(/(\d+)(\d\d)(\d\d)/);
  return a[1] + '°' + a[2] + '′' + a[3] + '″';
}

const q = document.getElementById('q');
const result = document.getElementById('result');

function removeResult() { // 前回の表示を削除
  while (result.firstChild) {
    result.removeChild(result.firstChild);
  }
}

document.getElementById('q-close').addEventListener('click', function () {
  q.style.display = 'none';
  removeResult();
});

function getHtml(json) {
  const geo = json.geo[0];
  let html = '<h2>' + geo.name
           + '</h2><table><tbody><tr><td>よみ</td><td>' + geo.kana
           + '</td></tr><tr><td>標高</td><td>' + geo.alt
           + 'm</td></tr><tr><td>緯度</td><td>' + todms(geo.lat)
           + '</td></tr><tr><td>経度</td><td>' + todms(geo.lon)
           + '</td></tr>';
  if (json.rec.length > 0) {
    html += '<tr><td>記録</td><td>' + json.rec.map(rec =>
      '<a href="' + rec.link + '" title="' + rec.title + "\n" + rec.summary + '">' + rec.summit + '</a>'
    ).join('<br>') + '</td></tr>';
  }
  return html;
}

function getRecord(json) {
  if (json.rec.length > 0) {
    q.style.display = 'none';
    removeResult();
    q.style.display = 'block';
  }
  popup.setContent(getHtml(json))
  json.rec.forEach(function (rec) {
    const tr = document.createElement('tr'); // new row
    let td = document.createElement('td'); // 1st column
    let a = document.createElement('a');
    a.setAttribute('href', rec.link);
    const img = document.createElement('img');
    img.setAttribute('src', rec.image || 'image/no_image.png');
    img.setAttribute('width', 60);
    img.setAttribute('height', 45);
    tr.appendChild(td).appendChild(a).appendChild(img);

    td = document.createElement('td'); // 2nd column
    a = document.createElement('a');
    a.setAttribute('href', rec.link);
    a.textContent = rec.summit;
    td.appendChild(a);
    td.appendChild(document.createElement('br'));
    td.appendChild(document.createTextNode(rec.title + '：' + rec.summary));
    result.appendChild(tr).appendChild(td);
  });
}

map.on('click', function (evt) {
  const found = map.forEachFeatureAtPixel(
    evt.pixel,
    function (feature, layer) {
      if (feature.getGeometry().getType() !== 'Point') {
        return false;
      }
      fetch(dburl + '?rec=' + feature.getId() + '&c=' + param.cat).then(
        response => response.json()
      ).then(
        json => getRecord(json)
      );
      return true;
    }
  );
  popup.setPosition(found ? evt.coordinate : undefined);
});

map.on('pointermove', function (evt) {
  if (evt.dragging) { return; }
  const found = map.forEachFeatureAtPixel(
    map.getEventPixel(evt.originalEvent),
    function (feature, layer) {
      return feature.getGeometry().getType() === 'Point';
    }
  );
  map.getTargetElement().style.cursor = found ? 'pointer' : '';
});
