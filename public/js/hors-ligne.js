// Sans réseau.
//
// Sans réseau, le téléphone montre la copie gardée des pages (voir
// public/service-worker.js) : une barre en haut le dit, avec l'heure de la
// copie. Ce qu'on note pendant ce temps attend dans le téléphone et part vers
// le Pi dès qu'il répond : la même barre dit combien d'actions attendent, et
// les montre si on la touche. Une fois parties, un message le confirme.
(function () {
  var copy = document.querySelector('meta[name="isoterra-copie"]');
  var bar, waitingCount = 0, listOpen = false;

  function say(text) {
    var toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(say.timer);
    say.timer = setTimeout(function () { toast.hidden = true; }, 4000);
  }

  function when(ms) {
    var d = new Date(Number(ms));
    if (isNaN(d.getTime())) return '';
    var today = new Date().toDateString() === d.toDateString();
    return (today ? "aujourd'hui" : 'le ' + d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }))
      + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  // ---------- The actions kept in the phone (the service worker's store) ----------

  function waitingActions() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) return resolve([]);
      var open = indexedDB.open('isoterra-hors-ligne', 1);
      open.onupgradeneeded = function () { open.result.createObjectStore('actions', { keyPath: 'ref' }); };
      open.onerror = function () { resolve([]); };
      open.onsuccess = function () {
        var db = open.result;
        try {
          var get = db.transaction('actions', 'readonly').objectStore('actions').getAll();
          get.onsuccess = function () { db.close(); resolve((get.result || []).sort(function (a, b) { return a.at - b.at; })); };
          get.onerror = function () { db.close(); resolve([]); };
        } catch (e) {
          db.close();
          resolve([]);
        }
      };
    });
  }

  // ---------- The bar ----------

  function build() {
    bar = document.createElement('div');
    bar.className = 'offline-bar';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<p class="offline-bar__copy" hidden></p>'
      + '<div class="offline-bar__wait" hidden><p></p>'
      + '<div class="offline-bar__buttons"><button type="button" class="btn-quiet" data-off="list">Voir</button>'
      + '<button type="button" class="btn-quiet" data-off="send">Envoyer maintenant</button></div>'
      + '<ol class="offline-bar__list" hidden></ol></div>';
    var host = document.querySelector('.paper-main') || document.querySelector('.tour-screen') || document.body;
    host.insertBefore(bar, host.firstChild);
    bar.addEventListener('click', function (event) {
      var b = event.target.closest('[data-off]');
      if (!b) return;
      if (b.dataset.off === 'list') {
        listOpen = !listOpen;
        paint();
      } else if (b.dataset.off === 'send') {
        ask();
        say(navigator.onLine ? 'Envoi au Pi…' : 'Toujours pas de réseau : les actions restent gardées.');
      } else if (b.dataset.off === 'reload') {
        location.reload();
      }
    });
  }

  function paint() {
    if (!copy && !waitingCount) {
      if (bar) bar.hidden = true;
      return;
    }
    if (!bar) build();
    bar.hidden = false;
    var top = bar.querySelector('.offline-bar__copy');
    top.hidden = !copy;
    if (copy) {
      top.innerHTML = '';
      top.appendChild(document.createTextNode(navigator.onLine
        ? 'Le Pi ne répond pas : copie de la page gardée ' + when(copy.content) + '. '
        : 'Pas de réseau : copie de la page gardée ' + when(copy.content) + '. '));
      var reload = document.createElement('button');
      reload.type = 'button';
      reload.className = 'btn-quiet';
      reload.dataset.off = 'reload';
      reload.textContent = 'Réessayer';
      top.appendChild(reload);
    }
    var wait = bar.querySelector('.offline-bar__wait');
    wait.hidden = !waitingCount;
    wait.querySelector('p').textContent = waitingCount
      ? (waitingCount > 1 ? waitingCount + ' actions gardées' : '1 action gardée') + ' dans le téléphone : '
        + (waitingCount > 1 ? 'elles partent' : 'elle part') + ' vers le Pi dès qu\'il répond.'
      : '';
    bar.querySelector('[data-off="list"]').textContent = listOpen ? 'Masquer' : 'Voir';
    var list = bar.querySelector('.offline-bar__list');
    list.hidden = !listOpen || !waitingCount;
    if (!list.hidden) {
      waitingActions().then(function (all) {
        list.innerHTML = '';
        all.forEach(function (a) {
          var li = document.createElement('li');
          var time = document.createElement('span');
          time.textContent = when(a.at);
          li.appendChild(time);
          li.appendChild(document.createTextNode(a.what || 'Action'));
          list.appendChild(li);
        });
      });
    }
  }

  // Quick actions of this page already noted and waiting: shown as done (the
  // "À faire aujourd'hui" rows of the home page go).
  function markWaiting(all) {
    all.forEach(function (a) {
      if (a.mode !== 'fetch') return;
      var u = new URL(a.url);
      document.querySelectorAll('form[data-todo-action]').forEach(function (form) {
        var f = new URL(form.action, location.href);
        if (f.pathname === u.pathname && f.search === u.search && form.querySelector('button')) {
          form.dispatchEvent(new CustomEvent('quicklog:done', { bubbles: true }));
        }
      });
    });
  }

  function refresh() {
    return waitingActions().then(function (all) {
      waitingCount = all.length;
      paint();
      return all;
    });
  }

  // ---------- Talking with the service worker ----------

  function ask() {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage('actions');
  }

  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', function (event) {
      var data = event.data || {};
      if (data.type !== 'isoterra-actions') return;
      waitingCount = data.waiting || 0;
      if (data.refused && data.refused.length) {
        say('Refusé par le Pi : ' + data.refused.join(' ; '));
      } else if (data.sent) {
        say(data.sent > 1 ? data.sent + ' actions envoyées au Pi.' : '1 action envoyée au Pi.');
      }
      paint();
    });
  }

  window.addEventListener('online', function () {
    ask();
    paint();
  });
  window.addEventListener('offline', paint);

  refresh().then(markWaiting);
  if (document.readyState === 'complete') ask();
  else window.addEventListener('load', ask);

  window.isoHorsLigne = { refresh: refresh };
})();
