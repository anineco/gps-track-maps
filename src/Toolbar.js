/**
 * @module Toolbar
 */
import Control from 'ol/control/Control';
import {CLASS_CONTROL, CLASS_UNSELECTABLE} from 'ol/css';
import {format} from 'ol/coordinate';
import {toLonLat} from 'ol/proj';

function createZoom(map) {
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

function createLayerSelector(layers) {
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

function createLayerSwitch(layer) {
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

function createCrosshair(map) {
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
  element.insertAdjacentText('beforeend', '中心十字線');
  return element;
}

function createCenter(map) {
  const view = map.getView();
  const element = document.createElement('input');
  element.type = 'button';
  element.value = '中心座標';
  element.addEventListener('click', function () {
    alert(format(toLonLat(view.getCenter()), '緯度={y}\n経度={x}', 6));
  });
  return element;
}

function createPrint() {
  const element = document.createElement('input');
  element.type = 'button';
  element.value = '印刷';
  element.addEventListener('click', function () {
    window.print();
  });
  return element;
}

function createTerms(terms) {
  const element = document.createElement('input');
  element.type = 'button';
  element.value = '承認情報';
  element.addEventListener('click', function () {
    alert(terms);
  });
  return element;
}

function createClose(label, url) {
  const element = document.createElement('input');
  element.className = 'ol-toolbar-close';
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

class Toolbar extends Control {
  constructor(map, opt_options) {
    const options = opt_options ? opt_options : {};
    super({
      element: document.createElement('div'),
    });
    const container = document.createElement('div');
    container.insertAdjacentText('beforeend', 'ズーム');
    container.appendChild(createZoom(map));
    container.insertAdjacentText('beforeend', 'マップ');
    container.appendChild(createLayerSelector(options.layers));
    container.appendChild(createLayerSwitch(options.track));
    container.appendChild(createCrosshair(map));
    container.appendChild(createCenter(map));
    if (!options.disablePrint) {
      container.appendChild(createPrint());
    }
    if (options.terms) {
      container.appendChild(createTerms(options.terms));
    }
    if (!options.disableClose) {
      container.appendChild(createClose(
        options.closeLabel || '閉じる',
        options.closeHref
      ));
    }
    const element = this.element;
    element.className = 'ol-toolbar ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
    element.appendChild(container);
  }
}

export default Toolbar;
