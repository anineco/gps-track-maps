/**
 * @module Toolbar
 */
import Control from 'ol/control/Control';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from 'ol/css';
import {format} from 'ol/coordinate';
import {toLonLat} from 'ol/proj';

const lc = {
  'zoom': 'ズーム',
  'maps': 'マップ',
  'close': '閉じる',
  'crosshair': '中心十字線',
  'center': '中心座標',
  'lat': '緯度',
  'lon': '経度',
  'print': '印刷',
  'terms': '承認情報'
};
 
class Toolbar extends Control {
  constructor(map, opt_options) {
    const options = opt_options ? opt_options : {};
    const className = options.className || 'ol-toolbar';
    super({
      element: document.createElement('div'),
    });
    const element = this.element;
    element.className = className + ' ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    if (!options.disableDefault) {
      element.appendChild(Toolbar.createDefault(map, options));
    }
  }

  static createDefault(map, options) {
    const container = document.createElement('div');
    container.insertAdjacentText('beforeend', lc.zoom);
    container.appendChild(Toolbar.createZoom(map));
    container.insertAdjacentText('beforeend', lc.maps);
    container.appendChild(Toolbar.createLayerSelector(options.layers));
    if (options.track) {
      container.appendChild(Toolbar.createLayerSwitch(options.track));
    }
    if (!options.disableCrosshair) {
      container.appendChild(Toolbar.createCrosshair(map));
      container.appendChild(Toolbar.createCenter(map, lc.center, options.center));
    }
    if (!options.disablePrint) {
      container.appendChild(Toolbar.createPrint());
    }
    if (options.terms) {
      container.appendChild(Toolbar.createTerms(options.terms));
    }
    if (!options.disableClose) {
      container.appendChild(Toolbar.createClose(
        options.closeLabel || lc.close,
        options.closeHref
      ));
    }
    return container;
  }

  static createZoom(map) {
    const view = map.getView();
    const zmax = view.getMaxZoom();
    const zmin = view.getMinZoom();
    const element = document.createElement('select');
    for (let i = 0; i <= zmax - zmin; i++) {
      const opt = document.createElement('option');
      element.appendChild(opt).textContent = zmax - i;
    }
    element.selectedIndex = zmax - view.getZoom();
    element.addEventListener('change', function () {
      view.setZoom(this.options[this.selectedIndex].value);
    });

    map.on('moveend', function () {
      const i = zmax - view.getZoom();
      if (element.selectedIndex != i) {
        element.selectedIndex = i;
      }
    });
    return element;
  }

  static createLayerSelector(layers) {
    const element = document.createElement('select');
    for (let i = 0; i < layers.length; i++) {
      const opt = document.createElement('option');
      opt.selected = layers[i].getVisible();
      opt.textContent = layers[i].get('title');
      element.appendChild(opt);
    }
    element.addEventListener('change', function () {
      for (let i = 0; i < layers.length; i++) {
        layers[i].setVisible(i === this.selectedIndex);
      }
    });
    return element;
  }

  static createLayerSwitch(layer) {
    const element = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = layer.getVisible();
    input.addEventListener('change', function () {
      layer.setVisible(this.checked);
    });
    element.appendChild(input);
    element.insertAdjacentText('beforeend', layer.get('title'));
    return element;
  }

  static createCrosshair(map) {
    const crosshair = new Control({
      element: document.getElementById('crosshair')
    });
    map.addControl(crosshair);
    const element = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', function () {
      if (this.checked) {
        map.addControl(crosshair);
      } else {
        map.removeControl(crosshair);
      }
    });
    element.appendChild(input);
//  element.insertAdjacentText('beforeend', lc.crosshair);
    return element;
  }

  static createCenter(map, label, func) {
    const element = document.createElement('input');
    element.type = 'button';
    element.value = label;
    element.addEventListener('click', func || function () {
      const coordinate = map.getView().getCenter();
      alert(format(toLonLat(coordinate), lc.lat + '={y}\n' + lc.lon + '={x}', 6));
    });
    return element;
  }

  static createPrint() {
    const element = document.createElement('input');
    element.type = 'button';
    element.value = lc.print;
    element.addEventListener('click', function () {
      window.print();
    });
    return element;
  }

  static createTerms(terms) {
    const element = document.createElement('input');
    element.type = 'button';
    element.value = lc.terms;
    element.addEventListener('click', function () {
      alert(terms);
    });
    return element;
  }

  static createClose(label, url) {
    const element = document.createElement('input');
    if (url) {
      element.className = 'navi';
    }
    element.type = 'button';
    element.value = label;
    element.addEventListener('click', function () {
      if (url) {
        location.assign(url);
      } else {
        window.close();
      }
    });
    return element;
  }
}

export default Toolbar;
