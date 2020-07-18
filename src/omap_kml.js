import 'ol/ol.css'
import 'ol-layerswitcher/src/ol-layerswitcher.css';
import 'ol-popup/src/ol-popup.css';
import './omap_kml.css';
import View from 'ol/View';
import {fromLonLat} from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import LayerGroup from 'ol/layer/Group';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import Style from 'ol/style/Style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import KML from 'ol/format/KML';
import LayerSwitcher from 'ol-layerswitcher';
import Popup from 'ol-popup';

const param = {
  lon: 139.435076, lat: 36.354746, zoom: 15,
  url: 'example/routemap.kml'
};
location.search.slice(1).split('&').forEach(function (ma) {
  const s = ma.split('=');
  if (s[0] === 'url') {
    param[s[0]] = decodeURIComponent(s[1]);
  } else if (s[0] in param) {
    param[s[0]] = Number(s[1]);
  }
});

const view = new View({
  center: fromLonLat([param.lon, param.lat]),
  zoom: param.zoom,
  minZoom: 2,
  maxZoom: 18
});

const std = new TileLayer({
  source: new XYZ({
    attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
  }),
  title: '標準',
  type: 'base'
});
const pale = new TileLayer({
  source: new XYZ({
    attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'
  }),
  title: '淡色',
  type: 'base',
  visible: false
});
const seamlessphoto = new TileLayer({
  source: new XYZ({
    attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'
  }),
  title: '写真',
  type: 'base',
  visible: false
});
const bases = new LayerGroup({
  layers: [seamlessphoto, pale, std],
  title: '地図の種類'
});
const map = new Map({
  target: 'map',
  layers: [bases],
  view: view
});
const track = new VectorLayer({
  source: new VectorSource({
    url: param.url,
    format: new KML()
  })
});
const data = new LayerGroup({
  layers: [track],
  title: 'GPS'
});
map.addLayer(data);
map.addControl(new LayerSwitcher());

function getHTML(feature) {
  return '<h2>' + feature.get('name') + '</h2>' + (feature.get('description') || '');
};

const popup = new Popup();
map.addOverlay(popup);
map.on('singleclick', function (evt) {
  let html;
  const found = map.forEachFeatureAtPixel(
    evt.pixel,
    function (feature, layer) {
      if (feature.getGeometry().getType() !== 'Point') {
        return false;
      }
      html = getHTML(feature);
      return true;
    }
  );
  popup.show(found ? evt.coordinate : undefined, html);
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
