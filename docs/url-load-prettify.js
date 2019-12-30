const sources = [];
Array.prototype.map.call(document.querySelectorAll('.prettyprint'), function (element) {
  const url = element.getAttribute('data-url');
  if (!url) { return; }
  sources.push(new Promise(function (resolve) {
    fetch(url).then(function (response) {
      return response.text();
    }).then(function (text) {
      element.appendChild(document.createTextNode(text));
      resolve();
    });
  }));
});
Promise.all(sources).then(PR.prettyPrint);
