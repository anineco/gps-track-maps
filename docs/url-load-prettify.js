const sources = [];
Array.prototype.map.call(document.querySelectorAll('.prettyprint'), function (element) {
  const url = element.getAttribute('data-url');
  if (!url) { return; }
  sources.push(new Promise(function (resolve) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'text';
    xhr.addEventListener('loadend', function (event) {
      if (xhr.status === 200) {
        const text = xhr.response
          .replace('ApSrHyswQlSkhiwqypJU_HidSkz0pWKYg7mpCYwpR1oja2ai3CHxJOHpa2LB5NNh', '[YOUR API KEY]')
          .replace('AIzaSyAxcuxvdd1SeIgtubznQ_JC7e08BZrIHkk', '[YOUR API KEY]')
          .replace('dj00aiZpPWR0cjBWa012YVBQNiZzPWNvbnN1bWVyc2VjcmV0Jng9ZDU-', '[YOUR API KEY]');
        element.appendChild(document.createTextNode(text));
        resolve();
      }
    });
    xhr.send();
  }));
});
Promise.all(sources).then(PR.prettyPrint);
