import 'ol/ol.css';
import './omap.css';
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
import Overlay from 'ol/Overlay';
import View from 'ol/View';
import {fromLonLat, toLonLat} from 'ol/proj';
import Map from 'ol/Map';
import {defaults} from 'ol/control';
import ScaleLine from 'ol/control/ScaleLine';
import {format} from 'ol/coordinate';

const param = {
  lon: 138.723460, lat: 35.931374, zoom: 13,
  url: 'https://anineco.github.io/gps-track-maps/example/routemap.geojson'
};
location.search.slice(1).split('&').forEach(function (ma) {
  const s = ma.split('=');
  if (s[0] === 'url') {
    param[s[0]] = decodeURIComponent(s[1]);
  } else if (s[0] in param) {
    param[s[0]] = Number(s[1]);
  }
});

window.addEventListener('DOMContentLoaded', function () {
  const std = new TileLayer({
    source: new XYZ({
      attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
      url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
    })
  });
  const pale = new TileLayer({
    visible: false,
    source: new XYZ({
      attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
      url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'
    })
  });
  const ort = new TileLayer({
    visible: false,
/*
    source: new XYZ({
      attributions: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
      url: 'https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg'
    })
*/
    source: new BingMaps({
      key: 'ApSrHyswQlSkhiwqypJU_HidSkz0pWKYg7mpCYwpR1oja2ai3CHxJOHpa2LB5NNh',
      imagerySet: 'Aerial'
    })
  });
  const osm = new TileLayer({
    visible: false,
    source: new XYZ({
      attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png'
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
          font: 'bold 12px sans-serif',
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
  const overlay = new Overlay({
    element: document.getElementById('popup'),
    autoPan: true,
    autoPanAnimation: { duration: 250 }
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
    layers: [std, pale, ort, osm, track],
    overlays: [overlay]
  });

  const closer = document.getElementById('popup-closer');
  closer.addEventListener('click', function () {
    overlay.setPosition(undefined); closer.blur();
  }, false);

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

  function getHtml(feature) {
    let html = '<h2>' + feature.get('name') + '</h2>';
    const keys = feature.getKeys().filter(key => key !== 'geometry' && key !== 'name' && key.charAt(0) !== '_');
    if (keys.length > 0) {
      html += '<table><tbody><tr><td>'
           + keys.map(key => key + '</td><td>' + feature.get(key)).join('</td></tr><tr><td>')
           + '</td></tr></tbody></table>';
    }
    return html;
  }

  const content = document.getElementById('popup-content');
  map.on('click', function (evt) {
    const found = map.forEachFeatureAtPixel(
      evt.pixel,
      function (feature, layer) {
        if (feature.getGeometry().getType() !== 'Point') {
          return false;
        }
        content.innerHTML = getHtml(feature);
        return true;
      }
    );
    overlay.setPosition(found ? evt.coordinate : undefined);
  });

  const sel = document.getElementById('tb-zoom');
  const zmax = view.getMaxZoom();
  const zmin = view.getMinZoom();
  for (let i = 0; i <= zmax - zmin; i++) {
    const z = zmax - i;
    const opt = document.createElement('option');
    opt.setAttribute('value', z);
    sel.appendChild(opt).textContent = z;
  }
  sel.selectedIndex = zmax - param.zoom;
  sel.addEventListener('change', function () {
    view.setZoom(this.options[this.selectedIndex].value);
  });
  map.on('moveend', function () {
    const i = zmax - view.getZoom();
    if (sel.selectedIndex != i) {
      sel.selectedIndex = i;
    }
  });

  document.getElementById('tb-layer').addEventListener('change', function () {
    const v = this.options[this.selectedIndex].value;
    std.setVisible(v === 'std');
    pale.setVisible(v === 'pale');
    ort.setVisible(v === 'ort');
    osm.setVisible(v === 'osm');
  });

  document.getElementById('tb-track').addEventListener('change', function () {
    track.setVisible(this.checked);
  });

  document.getElementById('tb-cross').addEventListener('change', function () {
    document.getElementById('crosshair').style.visibility = this.checked ? 'visible' : 'hidden';
  });

  document.getElementById('tb-center').addEventListener('click', function () {
    alert(ol.coordinate.format(ol.proj.toLonLat(view.getCenter()), '緯度={y}\n経度={x}', 6));
  });
});
