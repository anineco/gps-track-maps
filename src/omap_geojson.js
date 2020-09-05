import 'ol/ol.css'
import 'ol-layerswitcher/src/ol-layerswitcher.css';
import 'ol-popup/src/ol-popup.css';
import './omap_geojson.css';
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
import GeoJSON from 'ol/format/GeoJSON';
import LayerSwitcher from 'ol-layerswitcher';
import Popup from 'ol-popup';

const param = {
  lon: 139.435076, lat: 36.354746, zoom: 14,
  url: 'example/routemap.geojson'
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

const fill = new Fill({ color: 'blue' });
const stroke = new Stroke({ color: 'white', width: 2 });

function styleFunction(feature) {
  let style;
  const type = feature.getGeometry().getType();
  if (type === 'LineString') {
    const color = feature.get('_color').match(/^#(..)(..)(..)$/).slice(1).map(function (h) {
      return parseInt(h, 16);
    });
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
  source: new VectorSource({
    url: param.url,
    format: new GeoJSON()
  }),
  style: styleFunction
});
const data = new LayerGroup({
  layers: [track],
  title: 'GPS'
});
map.addLayer(data);
map.addControl(new LayerSwitcher());

function getHTML(feature) {
  let html = '<h2>' + feature.get('name') + '</h2>';
  const keys = feature.getKeys().filter(function (key) {
    return key !== 'geometry' && key !== 'name' && key.charAt(0) !== '_';
  });
  if (keys.length > 0) {
    html += '<table><tbody>' + keys.map(function (key) {
      return '<tr><td>' + key + '</td><td>' + feature.get(key) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  return html;
}

const popup = new Popup();
map.addOverlay(popup);
map.on('click', function (evt) {
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
