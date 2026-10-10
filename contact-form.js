/* Contact form: builds an e-mail in the visitor's own mail app (mailto).
   Nothing is sent to any third-party server. */
(function () {
  var TO = 'mailtomorrow@yandex.ru';
  var form = document.getElementById('contactForm');
  if (!form) return;

  var T = {
    ru: {
      fill: 'Заполните email, тему и сообщение.',
      mail: 'Введите корректный email.',
      opened: 'Открываем вашу почтовую программу. Если ничего не открылось, напишите на ' + TO + ' или откройте письмо в:',
      files: 'Файлы прикрепите к письму в вашей почте.'
    },
    en: {
      fill: 'Please fill in email, subject and message.',
      mail: 'Please enter a valid email.',
      opened: 'Opening your mail app. If nothing opened, write to ' + TO + ' or open the message in:',
      files: 'Please attach files to the message in your mail app.'
    }
  };
  function t(k) {
    var l = (document.documentElement.lang || 'en').slice(0, 2);
    return (T[l] || T.en)[k];
  }

  // Files cannot be attached through mailto: hide the file field, show a hint.
  var file = document.getElementById('attachment');
  if (file) {
    var group = file.closest('.form-group') || file.parentNode;
    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:.9rem;opacity:.75;';
    hint.textContent = t('files');
    group.parentNode.replaceChild(hint, group);
  }

  var status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.style.cssText = 'margin-top:.8rem;font-size:.95rem;line-height:1.5;';
  form.appendChild(status);

  function link(href, text) {
    var a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = text;
    a.style.marginRight = '.8rem';
    return a;
  }
  function err(text) {
    status.textContent = text;
    status.style.color = '#b91c1c';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = ((document.getElementById('email') || {}).value || '').trim();
    var subject = ((document.getElementById('subject') || {}).value || '').trim();
    var message = ((document.getElementById('message') || {}).value || '').trim();

    if (!email || !subject || !message) { err(t('fill')); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err(t('mail')); return; }

    var body = message + '\n\n---\nReply to: ' + email;
    var s = encodeURIComponent(subject);
    var b = encodeURIComponent(body);

    status.style.color = '';
    status.textContent = t('opened') + ' ';
    status.appendChild(link('https://mail.yandex.ru/compose?to=' + encodeURIComponent(TO) + '&subject=' + s + '&body=' + b, 'Яндекс Почта'));
    status.appendChild(link('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(TO) + '&su=' + s + '&body=' + b, 'Gmail'));

    window.location.href = 'mailto:' + TO + '?subject=' + s + '&body=' + b;
  });
})();
