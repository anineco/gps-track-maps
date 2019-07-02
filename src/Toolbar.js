/**
 * @module ol/control/Toobar
 */
import Control from 'ol/control/Control';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from 'ol/css';
import {format} from 'ol/coordinate';
import {toLonLat} from 'ol/proj';

/**
 * @property {Map} map
 * @typedef {Object} Options
 * @property {Array<string>} layerTitles
 * @property {boolean} [disablePrint]
 * @property {string} [terms]
 * @property {boolean} [disableClose]
 * @property {string} [closeLabel]
 * @property {string} [closeHref]
 */

class Toobar extends Control {
  constructor(map, opt_options) {
    const options = opt_options ? opt_options : {};
    super({
      element: document.createElement('div'),
    });
    const container = document.createElement('div');
    const view = map.getView();
    const layers = map.getLayers().getArray();
    const last = layers.length - 1;
    const titles = options.layerTitles;
    const track = layers[last];
    const title = titles[last];
/**
 * Zoom
 */
    const tb_zoom = document.createElement('select');
    const zmax = view.getMaxZoom();
    const zmin = view.getMinZoom();
    for (let i = 0; i <= zmax - zmin; i++) {
      const opt = document.createElement('option');
      tb_zoom.appendChild(opt).textContent = zmax - i;
    }
    tb_zoom.selectedIndex = zmax - view.getZoom();
    tb_zoom.addEventListener('change', function () {
      view.setZoom(this.options[this.selectedIndex].value);
    });
    container.insertAdjacentText('beforeend', 'ズーム');
    container.appendChild(tb_zoom);

    map.on('moveend', function () {
      const i = zmax - view.getZoom();
      if (tb_zoom.selectedIndex != i) {
        tb_zoom.selectedIndex = i;
      }
    });
/**
 * Layers
 */
    const tb_layers = document.createElement('select');
    for (let i = 0; i < last; i++) {
      const opt = document.createElement('option');
      opt.selected = layers[i].getVisible();
      tb_layers.appendChild(opt).textContent = titles[i];
    }
    tb_layers.addEventListener('change', function () {
      const n = this.selectedIndex;
      for (let i = 0; i < last; i++) {
        layers[i].setVisible(i === n);
      }
    });
    container.insertAdjacentText('beforeend', 'マップ');
    container.appendChild(tb_layers);
/**
 * Track
 */
    const tb_track_label = document.createElement('label');
    const tb_track = document.createElement('input');
    tb_track.type = 'checkbox';
    tb_track.checked = track.getVisible();
    tb_track.addEventListener('change', function () {
      track.setVisible(this.checked);
    });
    tb_track_label.appendChild(tb_track);
    tb_track_label.insertAdjacentText('beforeend', title);
    container.appendChild(tb_track_label);
/**
 * Crosshair
 */
    const tb_cross_label = document.createElement('label');
    const tb_cross = document.createElement('input');
    tb_cross.type = 'checkbox';
    tb_cross.checked = true;
    tb_cross.addEventListener('change', function () {
      document.getElementById('crosshair').style.visibility = this.checked ? 'visible' : 'hidden';
    });
    tb_cross_label.appendChild(tb_cross);
    tb_cross_label.insertAdjacentText('beforeend', '中心十字線');
    container.appendChild(tb_cross_label);
/**
 * Center
 */
    const tb_center = document.createElement('input');
    tb_center.type = 'button';
    tb_center.value = '中心座標';
    tb_center.addEventListener('click', function () {
      alert(format(toLonLat(view.getCenter()), '緯度={y}\n経度={x}', 6));
    });
    container.appendChild(tb_center);
/**
 * Print
 */
    if (!options.disablePrint) {
      const tb_print = document.createElement('input');
      tb_print.type = 'button';
      tb_print.value = '印刷';
      tb_print.addEventListener('click', function () {
        window.print();
      });
      container.appendChild(tb_print);
    }
/**
 * Terms
 */
    if (options.terms) {
      const tb_terms = document.createElement('input');
      tb_terms.type = 'button';
      tb_terms.value = '承認情報';
      tb_terms.addEventListener('click', function () {
        alert(options.terms);
      });
      container.appendChild(tb_terms);
    }
/**
 * Close
 */
    if (!options.disableClose) {
      const tb_close = document.createElement('input');
      tb_close.className = 'ol-toolbar-close';
      tb_close.type = 'button';
      tb_close.value = options.closeLabel || '閉じる';
      tb_close.addEventListener('click', function () {
        if (options.closeHref) {
          location.assign(options.closeHref);
        } else {
          window.close();
        }
      });
      container.appendChild(tb_close);
    }

    const element = this.element;
    element.className = 'ol-toolbar ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    element.appendChild(container);
  }
}

export default Toobar;
