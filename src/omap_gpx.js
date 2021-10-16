import 'ol/ol.css'
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import 'ol-popup/src/ol-popup.css';
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
import GPX from 'ol/format/GPX';
import LayerSwitcher from 'ol-layerswitcher';
import Popup from 'ol-popup';

const param = {
  lon: 139.435076, lat: 36.354746, zoom: 14,
  url: 'example/routemap.gpx'
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
const dash = {
  11: [4,2],        // short dash
  12: [6,2],        // long dash
  13: [1,2],        // dot
  14: [1,2,5,2],    // dot-dash (one dot chain)
  15: [1,2,1,2,6,2] // dot-dot-dash (two-dot chain)
};

function styleFunction(feature) {
  let style;
  const type = feature.getGeometry().getType();
  if (type === 'MultiLineString' || type === 'LineString') {
    const color = feature.get('kashmir3d:line_color').match(/^(..)(..)(..)$/).map(function (h) {
      return parseInt(h, 16);
    }).reverse();
    color[3] = 0.5;
    const w = feature.get('kashmir3d:line_size');
    const d = dash[feature.get('kashmir3d:line_style')];
    style = {
      stroke: new Stroke({
        color: color,
        width: w,
        lineDash: d && d.map(function (i) { return i * w; })
      })
    };
  } else if (type === 'Point') {
    style = {
      image: new Icon({
        src: 'https://map.jpn.org/icon/' + feature.get('kashmir3d:icon') + '.png',
        size: [24, 24],
        anchor: [12, 12],
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
        offsetX: 12,
        offsetY: 3
      })
    };
  }
  return new Style(style);
}

const track = new VectorLayer({
  source: new VectorSource({
    url: param.url,
    format: new GPX({
      readExtensions: function (feature, extensions) {
        const node = Array.prototype.slice.call(extensions.childNodes); // IE11
        node.forEach(function (elem) {
          if (elem.nodeName.startsWith('kashmir3d:')) {
            feature.set(elem.nodeName, elem.textContent);
          }
        });
      }
    })
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
  let body = '';
  feature.get('cmt').split(',').forEach(function(item) {
    const kv = item.split('=');
    if (!kv[0].match(/^[ 　]*$/)) {
      body += '<tr><td>' + kv[0] + '</td><td>' + kv[1] + '</td></tr>';
    }
  });
  if (body) {
    html += '<table><tbody>' + body + '</tbody></table>';
  }
  return html;
}

const popup = new Popup();
map.addOverlay(popup);
map.on('click', function (evt) {
  map.forEachFeatureAtPixel(
    evt.pixel,
    function (feature, layer) {
      const geometry = feature.getGeometry();
      if (geometry.getType() !== 'Point') {
        return false;
      }
      popup.show(geometry.getCoordinates(), getHTML(feature));
      return true;
    }
  );
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
