/* Contact form.
   API set  -> sends the form with files to a Yandex Cloud Function (which e-mails it).
   API empty -> fallback: opens the visitor's mail app (mailto), no files. */
(function () {
  var API = 'https://functions.yandexcloud.net/d4euiknhlp54cij0mq09';
  var TO = 'mailtomorrow@yandex.ru';
  var MAX_TOTAL = 2400 * 1024;        // total files limit (function accepts ~3.5 MB request)
  var form = document.getElementById('contactForm');
  if (!form) return;

  var T = {
    ru: { fill: 'Заполните email, тему и сообщение.', mail: 'Введите корректный email.', sending: 'Отправляем...',
          ok: 'Сообщение отправлено. Мы скоро свяжемся с вами.',
          fail: 'Не удалось отправить. Напишите нам на ' + TO,
          big: 'Файлы слишком большие (до 2,4 МБ в сумме). Отправьте их нам в WhatsApp или на ' + TO,
          opened: 'Открываем вашу почтовую программу. Если ничего не открылось, напишите на ' + TO + ' или откройте письмо в:',
          files: 'Файлы прикрепите к письму в вашей почте.' },
    en: { fill: 'Please fill in email, subject and message.', mail: 'Please enter a valid email.', sending: 'Sending...',
          ok: 'Message sent. We will contact you shortly.',
          fail: 'Could not send. Please email us at ' + TO,
          big: 'Files are too large (2.4 MB total max). Please send them via WhatsApp or to ' + TO,
          opened: 'Opening your mail app. If nothing opened, write to ' + TO + ' or open the message in:',
          files: 'Please attach files to the message in your mail app.' }
  };
  function t(k) { var l = (document.documentElement.lang || 'en').slice(0, 2); return (T[l] || T.en)[k]; }

  var btn = form.querySelector('button[type="submit"]');
  var fileInput = document.getElementById('attachment');
  var status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.style.cssText = 'margin-top:.8rem;font-size:.95rem;line-height:1.5;';
  form.appendChild(status);
  function say(text, ok) { status.textContent = text; status.style.color = ok ? '#15803d' : '#b91c1c'; }

  // honeypot field for bots (hidden from people)
  var hp = document.createElement('input');
  hp.type = 'text'; hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off';
  hp.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;width:0;';
  form.appendChild(hp);

  if (!API && fileInput) {  // mailto cannot attach files
    var group = fileInput.closest('.form-group') || fileInput.parentNode;
    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:.9rem;opacity:.75;';
    hint.textContent = t('files');
    group.parentNode.replaceChild(hint, group);
    fileInput = null;
  }

  // shrink photos so that they fit the limit
  function shrink(file) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return resolve(file);
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1800, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b || b.size >= file.size) return resolve(file);
          resolve(new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.8);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function link(href, text) {
    var a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = text; a.style.marginRight = '.8rem';
    return a;
  }

  function viaMailto(email, subject, message) {
    var s = encodeURIComponent(subject), b = encodeURIComponent(message + '\n\n---\nReply to: ' + email);
    status.style.color = ''; status.textContent = t('opened') + ' ';
    status.appendChild(link('https://mail.yandex.ru/compose?to=' + encodeURIComponent(TO) + '&subject=' + s + '&body=' + b, 'Яндекс Почта'));
    status.appendChild(link('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(TO) + '&su=' + s + '&body=' + b, 'Gmail'));
    window.location.href = 'mailto:' + TO + '?subject=' + s + '&body=' + b;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = ((document.getElementById('email') || {}).value || '').trim();
    var subject = ((document.getElementById('subject') || {}).value || '').trim();
    var message = ((document.getElementById('message') || {}).value || '').trim();
    if (!email || !subject || !message) { say(t('fill'), false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say(t('mail'), false); return; }
    if (!API) { viaMailto(email, subject, message); return; }

    var oldText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = t('sending'); }
    status.textContent = '';
    function done() { if (btn) { btn.disabled = false; btn.textContent = oldText; } }

    var list = fileInput && fileInput.files ? Array.prototype.slice.call(fileInput.files) : [];
    Promise.all(list.map(shrink)).then(function (files) {
      var total = files.reduce(function (s, f) { return s + f.size; }, 0);
      if (total > MAX_TOTAL || files.length > 5) { say(t('big'), false); done(); return; }
      var fd = new FormData();
      fd.append('email', email); fd.append('subject', subject); fd.append('message', message);
      fd.append('website', hp.value);
      files.forEach(function (f) { fd.append('attachment', f, f.name); });
      return fetch(API, { method: 'POST', body: fd }).then(function (r) {
        if (r.ok) { say(t('ok'), true); form.reset(); }
        else if (r.status === 413) say(t('big'), false);
        else say(t('fail'), false);
      }).catch(function () { say(t('fail'), false); }).then(done);
    });
  });
})();
