/**
 * @module Popup
 */
import Overlay from 'ol/Overlay';

class Popup extends Overlay {
  constructor(target, opt_options) {
    const options = opt_options ? opt_options : {};
    const className = options.className || 'ol-popup';
    const popup = document.getElementById(target);
    popup.className = className,
    super({
      element: popup,
      autoPan: true,
      autoPanAnimation: { duration: 250 }
    });
    const overlay = this;

    const closer = document.createElement('span');
    closer.className = className + '-closer';
    closer.addEventListener('click', function () {
      overlay.setPosition(undefined);
      closer.blur();
    }, false);
    popup.appendChild(closer);

    const content = document.createElement('div');
    popup.appendChild(content);
    this.content = content;
  }
  setContent(html) {
    this.content.innerHTML = html;
  }
}

export default Popup;
