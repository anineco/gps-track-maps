const sources = [];
Array.prototype.map.call(document.querySelectorAll('.prettyprint'), function (element) {
  const url = element.getAttribute('data-url');
  if (!url) { return; }
  sources.push(new Promise(function (resolve) {
    fetch(url).then(function (response) {
      return response.text();
    }).then(function (text) {
      text = text.replace('ApSrHyswQlSkhiwqypJU_HidSkz0pWKYg7mpCYwpR1oja2ai3CHxJOHpa2LB5NNh', '[YOUR API KEY]')
                 .replace('AIzaSyAxcuxvdd1SeIgtubznQ_JC7e08BZrIHkk', '[YOUR API KEY]')
                 .replace('dj00aiZpPWR0cjBWa012YVBQNiZzPWNvbnN1bWVyc2VjcmV0Jng9ZDU-', '[YOUR API KEY]');
      element.appendChild(document.createTextNode(text));
      resolve();
    });
  }));
});
Promise.all(sources).then(PR.prettyPrint);
