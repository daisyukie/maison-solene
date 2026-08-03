(function () {
  'use strict';

  var EASE = 'cubic-bezier(.2,.7,.2,1)';

  // Editable defaults — equivalent to the props panel in the original design tool.
  var props = {
    nomeCasa: 'Maison Solène',
    whatsapp: '+00 000 000 0000',
    idiomaPadrao: 'pt',
    ambiente: 1
  };

  function Site(root) {
    this.root = root;
    this.props = props;
  }

  Site.prototype.init = function () {
    if (!this.root) return;
    this.lang = (this.props.idiomaPadrao || 'pt');
    this.onClick = this.handleClick.bind(this);
    this.onSubmit = this.handleSubmit.bind(this);
    this.onScroll = this.handleScroll.bind(this);
    this.root.addEventListener('click', this.onClick);
    this.root.addEventListener('submit', this.onSubmit);
    window.addEventListener('scroll', this.onScroll, { passive: true });

    var self = this;
    this.onOver = function (e) {
      var m = e.target.closest && e.target.closest('[data-massage]');
      if (m) self.setMassage(parseInt(m.dataset.massage, 10));
      var r = e.target.closest && e.target.closest('[data-rule]');
      if (r) self.setRule(parseInt(r.dataset.rule, 10), true);
      var card = e.target.closest && e.target.closest('[data-price-card]');
      self.root.querySelectorAll('[data-card-plate]').forEach(function (p) {
        p.style.transform = (card && card.contains(p)) ? 'scale(1.08)' : 'scale(1)';
      });
    };
    this.root.addEventListener('mouseover', this.onOver);

    this.armReveals(this.root.querySelector('[data-page="inicio"]'));
    this.setMassage(0);
    this.setRule(0);
    this.ruleTimer = setInterval(function () {
      var wrap = self.root.querySelector('[data-rules]');
      if (!wrap || !wrap.offsetParent) return;
      var r = wrap.getBoundingClientRect();
      if (r.bottom < 120 || r.top > window.innerHeight - 120) return;
      self.setRule(((self.rule || 0) + 1) % 5);
    }, 4800);
    this.onScroll();
    setTimeout(function () { self.checkReveals(false); }, 20);
    this.applyProps();
    if (this.lang === 'en') this.applyLang('en');
    this.armHoverStyles();
  };

  Site.prototype.destroy = function () {
    if (!this.root) return;
    this.root.removeEventListener('click', this.onClick);
    this.root.removeEventListener('submit', this.onSubmit);
    this.root.removeEventListener('mouseover', this.onOver);
    window.removeEventListener('scroll', this.onScroll);
    clearTimeout(this.safety);
    clearInterval(this.ruleTimer);
  };

  // The design tool authored hover states as a non-standard `style-hover`
  // attribute (never wired into a real :hover rule in the exported runtime).
  // Reproduce it generically so buttons/cards/links keep their intended feedback.
  Site.prototype.armHoverStyles = function () {
    this.root.querySelectorAll('[style-hover]').forEach(function (el) {
      var base = el.getAttribute('style') || '';
      var hover = el.getAttribute('style-hover') || '';
      var apply = function (css) {
        css.split(';').forEach(function (decl) {
          var i = decl.indexOf(':');
          if (i < 0) return;
          var prop = decl.slice(0, i).trim();
          var val = decl.slice(i + 1).trim();
          if (prop) el.style.setProperty(prop, val);
        });
      };
      el.addEventListener('mouseenter', function () { apply(hover); });
      el.addEventListener('mouseleave', function () { el.setAttribute('style', base); });
      el.addEventListener('focus', function () { apply(hover); });
      el.addEventListener('blur', function () { el.setAttribute('style', base); });
    });
  };

  Site.prototype.applyProps = function () {
    var nome = this.props.nomeCasa;
    if (nome) this.root.querySelectorAll('[data-slot="nome"]').forEach(function (el) { el.textContent = nome; });
    var wa = this.props.whatsapp;
    if (wa) {
      var digits = String(wa).replace(/[^0-9]/g, '');
      this.root.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (el) { el.href = 'https://wa.me/' + digits; });
      this.root.querySelectorAll('[data-en*="WhatsApp ·"]').forEach(function (el) {
        el.textContent = 'WhatsApp · ' + wa;
        el.dataset.en = 'WhatsApp · ' + wa;
        el.dataset.pt = 'WhatsApp · ' + wa;
      });
    }
    var amb = this.props.ambiente;
    if (typeof amb === 'number') {
      var glows = this.root.querySelectorAll('[style*="animation:drift"]');
      glows.forEach(function (el) { el.style.opacity = String(amb); });
    }
  };

  Site.prototype.show = function (el) {
    if (el.dataset.shown === '1') return;
    el.dataset.shown = '1';
    var d = parseInt(el.dataset.revealDelay || '0', 10);
    setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none'; }, d);
  };

  Site.prototype.armReveals = function (scope) {
    var self = this;
    if (!scope) return;
    scope.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.style.transition = 'opacity 1s ease, transform 1s ' + EASE + ', filter 1s ease';
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.dataset.shown = '0';
        self.show(el);
      } else {
        el.dataset.shown = '0';
        el.style.opacity = '0';
        el.style.transform = 'translateY(26px)';
        el.style.filter = 'blur(6px)';
      }
    });
    clearTimeout(this.safety);
    this.safety = setTimeout(function () { self.checkReveals(true); }, 1400);
  };

  Site.prototype.checkReveals = function (force) {
    var page = this.root.querySelector('[data-page].is-active') || this.root;
    page.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.dataset.shown === '1') return;
      var top = el.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.92 || (force && top < window.innerHeight * 1.6)) this.show(el);
    }, this);
  };

  Site.prototype.setRule = function (i, manual) {
    var wrap = this.root.querySelector('[data-rules]');
    if (!wrap) return;
    this.rule = i;
    if (manual) { clearInterval(this.ruleTimer); this.ruleTimer = null; }
    var deg = i * 72;
    ['[data-arc]', '[data-glow]', '[data-needle]'].forEach(function (sel) {
      var el = wrap.querySelector(sel);
      if (el) el.style.transform = 'rotate(' + deg + 'deg)';
    });
    wrap.querySelectorAll('[data-panel]').forEach(function (p, k) {
      p.style.opacity = k === i ? '1' : '0';
      p.style.transform = k === i ? 'none' : 'translateY(10px)';
    });
    wrap.querySelectorAll('svg [data-rule]').forEach(function (g, k) {
      var on = k === i;
      var dot = g.querySelector('[data-dot]');
      var tick = g.querySelector('[data-tick]');
      if (dot) { dot.setAttribute('fill', on ? '#B0243A' : '#0B0708'); dot.setAttribute('stroke', on ? '#C9A25B' : 'rgba(201,162,91,.55)'); }
      if (tick) tick.setAttribute('fill', on ? '#C9A25B' : 'rgba(201,162,91,.45)');
    });
    wrap.querySelectorAll('[data-rule] [data-rt]').forEach(function (t, k) {
      var row = t.closest('[data-rule]');
      var on = k === i;
      t.style.color = on ? '#F4EBE1' : '#7C7369';
      row.style.paddingLeft = on ? '14px' : '0px';
      var n = row.querySelector('[data-rn]');
      if (n) n.style.color = on ? '#C9A25B' : 'rgba(201,162,91,.42)';
      var bar = row.querySelector('[data-rbar]');
      if (bar) bar.style.width = on ? '58px' : '0px';
    });
  };

  Site.prototype.setDuration = function (which) {
    this.dur = which;
    this.root.querySelectorAll('[data-duration]').forEach(function (b) {
      var on = b.dataset.duration === which;
      b.style.background = on ? '#B0243A' : 'transparent';
      b.style.color = on ? '#F6EFE4' : '#9A8F88';
    });
    this.root.querySelectorAll('[data-price]').forEach(function (el) {
      el.style.opacity = '0';
      setTimeout(function () {
        el.textContent = which === '2' ? el.dataset.p2 : el.dataset.p1;
        el.style.opacity = '1';
      }, 220);
    });
    this.root.querySelectorAll('[data-dur]').forEach(function (el) {
      el.textContent = which === '2' ? el.dataset.d2 : el.dataset.d1;
    });
  };

  Site.prototype.setMassage = function (i) {
    var wrap = this.root.querySelector('[data-massagens]');
    if (!wrap) return;
    this.active = i;
    wrap.querySelectorAll('[data-plate]').forEach(function (p, k) {
      p.style.opacity = k === i ? '1' : '0';
      p.style.transform = k === i ? 'scale(1)' : 'scale(1.06)';
    });
    var num = wrap.querySelector('[data-plate-num]');
    if (num) num.textContent = ['I', 'II', 'III', 'IV'][i] || 'I';
    wrap.querySelectorAll('[data-massage]').forEach(function (row, k) {
      var on = k === i;
      row.style.paddingLeft = on ? '14px' : '0px';
      var t = row.querySelector('[data-title]');
      var n = row.querySelector('[data-num]');
      var d = row.querySelector('[data-desc]');
      if (t) t.style.color = on ? '#EDE6DD' : '#7C7369';
      if (n) n.style.color = on ? '#C9A25B' : '#6B5A3A';
      if (d) { d.style.maxHeight = on ? d.scrollHeight + 'px' : '0px'; d.style.opacity = on ? '1' : '0'; }
    });
  };

  Site.prototype.handleScroll = function () {
    var self = this;
    if (this.raf) return;
    this.raf = setTimeout(function () {
      self.raf = null;
      self.checkReveals(false);
      var tl = self.root.querySelector('[data-timeline]');
      if (tl && tl.offsetParent) {
        var r = tl.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (window.innerHeight * 0.56 - r.top) / Math.max(1, r.height)));
        var fill = tl.querySelector('[data-axis-fill]');
        if (fill) fill.style.height = (p * Math.max(0, r.height - 28)) + 'px';
        tl.querySelectorAll('[data-step]').forEach(function (st) {
          var on = st.getBoundingClientRect().top < window.innerHeight * 0.62;
          var dot = st.querySelector('[data-dot]');
          if (dot) {
            dot.style.background = on ? '#B0243A' : '#0B0708';
            dot.style.boxShadow = on ? '0 0 0 5px #0B0809, 0 0 16px 3px rgba(176,36,58,.6)' : '0 0 0 5px #0B0809';
          }
        });
      }
      self.root.querySelectorAll('[data-parallax]').forEach(function (el) {
        var f = parseFloat(el.dataset.parallax) || 0;
        var box = el.getBoundingClientRect();
        var rel = (box.top + box.height / 2 - window.innerHeight / 2);
        el.style.transform = 'translate3d(0,' + (-rel * f).toFixed(1) + 'px,0)';
      });
    }, 16);
  };

  Site.prototype.handleClick = function (ev) {
    var nav = ev.target.closest('[data-goto]');
    if (nav) { ev.preventDefault(); this.goTo(nav.dataset.goto); return; }
    var lang = ev.target.closest('[data-lang-toggle]');
    if (lang) { ev.preventDefault(); this.applyLang(this.lang === 'pt' ? 'en' : 'pt'); return; }
    var dur = ev.target.closest('[data-duration]');
    if (dur) { ev.preventDefault(); this.setDuration(dur.dataset.duration); return; }
    var r = ev.target.closest('[data-rule]');
    if (r) { ev.preventDefault(); this.setRule(parseInt(r.dataset.rule, 10), true); return; }
    var m = ev.target.closest('[data-massage]');
    if (m) { this.setMassage(parseInt(m.dataset.massage, 10)); return; }
    var q = ev.target.closest('[data-faq-q]');
    if (q) { ev.preventDefault(); this.toggleFaq(q.closest('[data-faq]')); }
  };

  Site.prototype.toggleFaq = function (item) {
    var a = item.querySelector('[data-faq-a]');
    var icon = item.querySelector('[data-faq-icon]');
    var open = a.style.maxHeight && a.style.maxHeight !== '0px';
    if (open) {
      a.style.maxHeight = '0px'; a.style.opacity = '0';
      icon.style.transform = 'none'; icon.textContent = '+';
    } else {
      a.style.maxHeight = a.scrollHeight + 'px'; a.style.opacity = '1';
      icon.style.transform = 'rotate(135deg)';
    }
  };

  Site.prototype.goTo = function (page) {
    var self = this;
    var cur = this.root.querySelector('[data-page].is-active') || this.root.querySelector('[data-page="inicio"]');
    if (cur && cur.dataset.page === page) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var next = this.root.querySelector('[data-page="' + page + '"]');
    if (!next || !cur) return;
    cur.style.opacity = '0'; cur.style.transform = 'translateY(12px)'; cur.style.filter = 'blur(5px)';
    setTimeout(function () {
      cur.style.display = 'none';
      cur.classList.remove('is-active');
      next.style.display = 'block';
      next.classList.add('is-active');
      next.style.opacity = '0'; next.style.transform = 'translateY(12px)'; next.style.filter = 'blur(5px)';
      window.scrollTo(0, 0);
      self.armReveals(next);
      self.syncNav(page);
      self.onScroll();
      void next.offsetHeight;
      setTimeout(function () {
        next.style.opacity = '1'; next.style.transform = 'none'; next.style.filter = 'none';
      }, 20);
      setTimeout(function () {
        next.style.opacity = '1'; next.style.transform = 'none'; next.style.filter = 'none';
        self.checkReveals(true);
      }, 600);
    }, 420);
  };

  Site.prototype.syncNav = function (page) {
    this.root.querySelectorAll('header [data-goto]').forEach(function (el) {
      if (el.style.background) return;
      el.style.color = el.dataset.goto === page ? '#EDE6DD' : '#9A8F88';
    });
  };

  Site.prototype.applyLang = function (lang) {
    this.lang = lang;
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    this.root.querySelectorAll('[data-en]').forEach(function (el) {
      if (el.dataset.pt === undefined) el.dataset.pt = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.pt;
    });
    this.root.querySelectorAll('[data-en-ph]').forEach(function (el) {
      if (el.dataset.ptPh === undefined) el.dataset.ptPh = el.placeholder;
      el.placeholder = lang === 'en' ? el.dataset.enPh : el.dataset.ptPh;
    });
    var btn = this.root.querySelector('[data-lang-toggle]');
    if (btn) btn.textContent = lang === 'en' ? 'PT' : 'EN';
    this.setMassage(this.active || 0);
    this.setRule(this.rule || 0);
  };

  Site.prototype.handleSubmit = function (ev) {
    if (!ev.target.matches('[data-booking]')) return;
    ev.preventDefault();
    var ok = ev.target.querySelector('[data-booking-ok]');
    ok.style.display = 'block';
    void ok.offsetHeight;
    setTimeout(function () { ok.style.opacity = '1'; ok.style.transform = 'none'; }, 20);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('[data-site-root]');
    var site = new Site(root);
    site.init();
  });
})();
