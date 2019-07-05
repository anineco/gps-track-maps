/**
 * @module Popup
 */
import Overlay from 'ol/Overlay';

class Popup {
  constructor(map) {
    const popup = document.getElementById('popup');
    popup.className = 'ol-popup';
    const overlay = new Overlay({
      element: popup,
      autoPan: true,
      autoPanAnimation: { duration: 250 }
    });
    map.addOverlay(overlay);

    const closer = document.createElement('span');
    closer.className = 'ol-popup-closer';
    closer.addEventListener('click', function () {
      overlay.setPosition(undefined);
      closer.blur();
    }, false);
    popup.appendChild(closer);

    const content = document.createElement('div');
    popup.appendChild(content);

    this.overlay = overlay;
    this.content = content;
  }
  setContent(html) {
    this.content.innerHTML = html;
  }
  setPosition(coordinate) {
    this.overlay.setPosition(coordinate);
  }
}

export default Popup;
