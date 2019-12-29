import 'normalize.css';
import './omap.css';
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
import {fromLonLat} from 'ol/proj';
import Map from 'ol/Map';
import {defaults} from 'ol/control';
import ScaleLine from 'ol/control/ScaleLine';
import Toolbar from './lib/Toolbar.js';
import Popup from './lib/Popup.js';

const param = {
  lon: 138.723460, lat: 35.931374, zoom: 13,
  url: 'https://anineco.github.io/gps-track-maps/share/routemap.geojson'
};
location.search.slice(1).split('&').forEach(function (ma) {
  const s = ma.split('=');
  if (s[0] === 'url') {
    param[s[0]] = decodeURIComponent(s[1]);
  } else if (s[0] in param) {
    param[s[0]] = Number(s[1]);
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
const key = document.getElementById('map').getAttribute('data-bingmaps-key');
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

const fill = new Fill({ color: 'blue' });
const stroke = new Stroke({ color: 'white', width: 2 });

function styleFunction(feature) {
  let style;
  const type = feature.getGeometry().getType();
  if (type === 'LineString') {
    const color = feature.get('_color').match(/^#(..)(..)(..)$/).slice(1).map(h => parseInt(h, 16));
    color[3] = feature.get('_opacity');
    style = {
      stroke: new Stroke({
        color: color,
        width: feature.get('_weight'),
        lineDash: feature.get('_dashArray').split(',')
      })
    };
  } else if (type === 'Point') {
    style = {
      image: new Icon({
        src: feature.get('_iconUrl'),
        size: feature.get('_iconSize'),
        anchor: feature.get('_iconAnchor'),
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        crossOrigin: 'Anonymous'
      }),
      text: new Text({
        text: feature.get('name'),
        font: '14px sans-serif',
        fill: fill,
        stroke: stroke,
        textAlign: 'left',
        offsetX: 10,
        offsetY: -10
      })
    };
  }
  return new Style(style);
};

const track = new VectorLayer({
  title: 'GPSデータ',
  source: new VectorSource({
    url: param.url,
    format: new GeoJSON()
  }),
  style: styleFunction
});
const view = new View({
  center: fromLonLat([param.lon, param.lat]),
  maxZoom: 18,
  minZoom: 0,
  zoom: param.zoom
});
const map = new Map({
  target: 'map',
  view: view,
  controls: defaults().extend([
    new ScaleLine()
  ]),
  layers: [std, pale, ort, otm, track]
});
const toolbar = new Toolbar(map, {
  layers: [std, pale, ort, otm],
  track: track,
  disableClose: true
});
map.addControl(toolbar);

function getHtml(feature) {
  let html = '<h2>' + feature.get('name') + '</h2>';
  const keys = feature.getKeys().filter(
    key => key !== 'geometry' && key !== 'name' && key.charAt(0) !== '_'
  );
  if (keys.length > 0) {
    html += '<table><tbody><tr><td>'
         + keys.map(key => key + '</td><td>' + feature.get(key)).join('</td></tr><tr><td>')
         + '</td></tr></tbody></table>';
  }
  return html;
}

const popup = new Popup('popup');
map.addOverlay(popup);

map.on('click', function (evt) {
  const found = map.forEachFeatureAtPixel(
    evt.pixel,
    function (feature, layer) {
      if (feature.getGeometry().getType() !== 'Point') {
        return false;
      }
      popup.setContent(getHtml(feature));
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
