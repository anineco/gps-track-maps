import 'ol/ol.css';
import './omap_basic.css';
import View from 'ol/View';
import {fromLonLat} from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import Map from 'ol/Map';

const param = {
  lon: 139.435076, lat: 36.354746, zoom: 14
};

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
  })
});
const map = new Map({
  target: 'map',
  layers: [std],
  view: view
});
