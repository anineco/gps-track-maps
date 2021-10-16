import 'ol/ol.css';
import View from 'ol/View';
import {fromLonLat} from 'ol/proj';
import Map from 'ol/Map';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTile from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import stylefunction from 'ol-mapbox-style/dist/stylefunction';
import glStyle from './std.json';
import glSprite from './sprite/std.json';

const param = {
  lon: 139.435076, lat: 36.354746, zoom: 14
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
  minZoom: 5,
  maxZoom: 17
});
const gsibv = new VectorTileLayer({
  source: new VectorTile({
    attributions: "<a href='https://maps.gsi.go.jp/vector/' target='_blank'>地理院地図Vector（仮称）</a>",
    url: 'https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf',
    format: new MVT()
  }),
  declutter: true, // mandatory to avoid text clipping at tile edge
  visible: false
});
const map = new Map({
  target: 'map',
  layers: [gsibv],
  view: view
});

const glImage = new Image();
glImage.addEventListener('load', function() {
  const style = stylefunction(
    gsibv,
    glStyle,
    'gsibv-vectortile-source-1-4-16',
    undefined, // resolutions
    glSprite,
    glImage.src,
    undefined // getFonts
  );
  gsibv.setStyle(style);
  gsibv.setVisible(true);
}, false);
glImage.src = './sprite/std.png';
