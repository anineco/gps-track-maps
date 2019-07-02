import 'url-polyfill'; // NOTE: for KML
import 'ol/ol.css';
import './Toolbar.css';
import './Popup.css';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import BingMaps from 'ol/source/BingMaps';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import KML from 'ol/format/KML';
import View from 'ol/View';
import {fromLonLat} from 'ol/proj';
import Map from 'ol/Map';
import {defaults} from 'ol/control';
import ScaleLine from 'ol/control/ScaleLine';
import Toolbar from './Toolbar.js';
import Popup from './Popup.js';

const param = {
  lon: 138.723460, lat: 35.931374, zoom: 13,
  url: 'https://anineco.github.io/gps-track-maps/example/routemap.min.kml'
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
  const otm = new TileLayer({
    visible: false,
    source: new XYZ({
      attributions: [
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, ',
        '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> ',
        '(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      ],
      url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
    })
  });
  const track = new VectorLayer({
    source: new VectorSource({
      url: param.url,
      format: new KML()
    })
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
    layerTitles: ['標準', '淡色', '写真', 'OTM', 'GPSデータ'],
    disableTerms: true,
    disableClose: true
  });
  map.addControl(toolbar);

  function getHtml(feature) {
    return '<h2>' + feature.get('name') + '</h2>' + (feature.get('description') || '');
  }

  const popup = new Popup(map);

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
});
