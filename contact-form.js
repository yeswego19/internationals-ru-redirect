(function () {
  var TO = 'mailtomorrow@yandex.ru';
  var form = document.getElementById('contactForm');
  if (!form) return;

  var T = {
    ru: { sending: 'Отправляем...', ok: 'Сообщение отправлено. Мы скоро свяжемся с вами.', fail: 'Не удалось отправить. Напишите нам на ' + TO, fill: 'Заполните email, тему и сообщение.', mail: 'Введите корректный email.' },
    en: { sending: 'Sending...', ok: 'Message sent. We will contact you shortly.', fail: 'Could not send. Please email us at ' + TO, fill: 'Please fill in email, subject and message.', mail: 'Please enter a valid email.' }
  };
  function t(k) {
    var l = (document.documentElement.lang || 'en').slice(0, 2);
    return (T[l] || T.en)[k];
  }

  var btn = form.querySelector('button[type="submit"]');
  var status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.style.cssText = 'margin-top:.8rem;font-size:.95rem;';
  form.appendChild(status);

  function say(text, ok) {
    status.textContent = text;
    status.style.color = ok ? '#15803d' : '#b91c1c';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (document.getElementById('email') || {}).value || '';
    var subject = (document.getElementById('subject') || {}).value || '';
    var message = (document.getElementById('message') || {}).value || '';
    email = email.trim(); subject = subject.trim(); message = message.trim();

    if (!email || !subject || !message) { say(t('fill'), false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say(t('mail'), false); return; }

    var fd = new FormData();
    fd.append('email', email);
    fd.append('subject', subject);
    fd.append('message', message);
    fd.append('_subject', 'Запрос с сайта: ' + subject);
    fd.append('_template', 'table');
    fd.append('_captcha', 'false');
    fd.append('_replyto', email);
    var files = document.getElementById('attachment');
    if (files && files.files) {
      Array.prototype.forEach.call(files.files, function (f) { fd.append('attachment', f, f.name); });
    }

    var oldText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = t('sending'); }
    say('', true);

    fetch('https://formsubmit.co/ajax/' + encodeURIComponent(TO), {
      method: 'POST',
      body: fd,
      headers: { 'Accept': 'application/json' }
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && (res.j.success === true || res.j.success === 'true')) {
          say(t('ok'), true);
          form.reset();
        } else {
          say(t('fail'), false);
        }
      })
      .catch(function () { say(t('fail'), false); })
      .then(function () { if (btn) { btn.disabled = false; btn.textContent = oldText; } });
  });
})();
