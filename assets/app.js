(function () {
  'use strict';

  var UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id'];
  var WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=5511930468463&text=Ol%C3%A1%2C%20acessei%20o%20site%20e%20tenho%20interesse%20na%20Imers%C3%A3o%201%20M%C3%AAs%20em%201%20Dia';
  var modal = document.getElementById('lead-modal');

  function loadClarity() {
    var meta = document.querySelector('meta[name="clarity-project-id"]');
    var projectId = meta ? String(meta.content || '').trim() : '';
    if (!projectId) return;
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,'clarity','script',projectId);
  }

  function clarityEvent(name) {
    if (typeof window.clarity === 'function') window.clarity('event', name);
  }

  function readUtms() {
    var search = new URLSearchParams(window.location.search);
    var stored = {};
    UTM_KEYS.forEach(function (key) {
      var value = search.get(key);
      if (value !== null && value !== '') sessionStorage.setItem('lp_frio_' + key, value);
      stored[key] = value || sessionStorage.getItem('lp_frio_' + key) || '';
    });
    return stored;
  }

  function hydrateUtms(form, utms) {
    UTM_KEYS.forEach(function (key) {
      var input = form.elements[key];
      if (input) input.value = utms[key] || '';
    });
  }

  function loadDeferredPosters() {
    var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-poster]'));
    if (!videos.length) return;
    function loadPoster(video) {
      var poster = video.getAttribute('data-poster');
      if (poster && !video.getAttribute('poster')) {
        video.setAttribute('poster', poster);
        video.removeAttribute('data-poster');
      }
    }
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            loadPoster(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '600px 0px' });
      videos.forEach(function(video){ observer.observe(video); });
    } else {
      videos.forEach(loadPoster);
    }
  }

  function scrollToOffer() {
    var offer = document.getElementById('oferta');
    if (!offer) return;
    var header = document.querySelector('.site-header');
    var offset = (header ? header.offsetHeight : 0) + 12;
    var target = offer.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: target, behavior: 'smooth' });
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }

  document.addEventListener('click', function (event) {
    var offerButton = event.target.closest('[data-scroll-offer]');
    if (offerButton) {
      clarityEvent('cta_click');
      scrollToOffer();
      return;
    }
    if (event.target.closest('[data-close-form]')) closeModal();
  });

  document.addEventListener('keydown', function(event){
    if (event.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  var playTestimonialButton = document.querySelector('[data-play-testimonial]');
  var testimonialVideo = document.querySelector('[data-testimonial-video]');
  if (playTestimonialButton && testimonialVideo) {
    playTestimonialButton.addEventListener('click', function () {
      var poster = testimonialVideo.getAttribute('data-poster');
      if (poster && !testimonialVideo.getAttribute('poster')) {
        testimonialVideo.setAttribute('poster', poster);
        testimonialVideo.removeAttribute('data-poster');
      }
      testimonialVideo.play().catch(function(){});
      testimonialVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  var testimonialVideoTracked = false;
  document.addEventListener('play', function (event) {
    if (!testimonialVideoTracked && event.target && event.target.matches && event.target.matches('[data-testimonial-video]')) {
      testimonialVideoTracked = true;
      clarityEvent('testimonial_video_play');
    }
  }, true);

  function initProofCarousel() {
    var carousel = document.getElementById('proofCarousel');
    var track = document.getElementById('proofTrack');
    if (!carousel || !track) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll('.proof-slide'));
    var dotsWrap = document.getElementById('proofDots');
    var prev = document.getElementById('proofPrev');
    var next = document.getElementById('proofNext');
    var index = 0;
    var timer = null;
    var paused = false;
    var touchStart = null;

    function perView() {
      return window.innerWidth >= 760 ? 3 : 1;
    }

    function maxIndex() {
      return Math.max(0, slides.length - perView());
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (var i = 0; i <= maxIndex(); i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'proof-dot';
        dot.setAttribute('aria-label','Ir para prova ' + (i + 1));
        (function(n){
          dot.addEventListener('click', function(){
            index = n;
            update();
            restart();
          });
        })(i);
        dotsWrap.appendChild(dot);
      }
    }

    function update() {
      var gap = parseFloat(window.getComputedStyle(track).gap) || 18;
      var first = slides[0];
      var step = first ? first.getBoundingClientRect().width + gap : 0;
      index = Math.max(0, Math.min(index, maxIndex()));
      track.style.transform = 'translate3d(' + (-index * step) + 'px,0,0)';

      slides.forEach(function(slide, i){
        var activeStart = index;
        var activeEnd = index + perView() - 1;
        slide.classList.toggle('is-active', i >= activeStart && i <= activeEnd);
      });

      if (dotsWrap) {
        Array.prototype.slice.call(dotsWrap.children).forEach(function(dot, i){
          dot.classList.toggle('is-active', i === index);
        });
      }
    }

    function advance() {
      index = index >= maxIndex() ? 0 : index + 1;
      update();
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (!paused && maxIndex() > 0) timer = setInterval(advance, 3200);
    }

    function restart() {
      stop();
      setTimeout(start, 180);
    }

    if (prev) {
      prev.addEventListener('click', function(){
        index = index <= 0 ? maxIndex() : index - 1;
        update();
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function(){
        advance();
        restart();
      });
    }

    carousel.addEventListener('mouseenter', function(){
      paused = true;
      stop();
    });

    carousel.addEventListener('mouseleave', function(){
      paused = false;
      start();
    });

    carousel.addEventListener('touchstart', function(event){
      if (!event.touches || !event.touches[0]) return;
      touchStart = event.touches[0].clientX;
      paused = true;
      stop();
    }, { passive: true });

    carousel.addEventListener('touchend', function(event){
      if (touchStart === null || !event.changedTouches || !event.changedTouches[0]) return;
      var delta = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(delta) > 45) {
        if (delta < 0) advance();
        else {
          index = index <= 0 ? maxIndex() : index - 1;
          update();
        }
      }
      touchStart = null;
      paused = false;
      start();
    }, { passive: true });

    window.addEventListener('resize', function(){
      index = Math.min(index, maxIndex());
      buildDots();
      update();
      restart();
    });

    buildDots();
    update();
    start();
  }

  function bindForm(form, utms) {
    hydrateUtms(form, utms);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var status = form.querySelector('[data-form-status]');
      var button = form.querySelector('button[type="submit"]');
      if (!form.reportValidity()) return;

      if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'ENVIANDO...';
      }
      if (status) status.textContent = '';

      var data = new FormData(form);
      var payload = {
        nome: String(data.get('nome') || '').trim(),
        telefone: String(data.get('telefone') || '').trim(),
        email: String(data.get('email') || '').trim(),
        utm_source: String(data.get('utm_source') || ''),
        utm_medium: String(data.get('utm_medium') || ''),
        utm_campaign: String(data.get('utm_campaign') || ''),
        utm_content: String(data.get('utm_content') || ''),
        utm_term: String(data.get('utm_term') || ''),
        utm_id: String(data.get('utm_id') || '')
      };

      try {
        var response = await fetch('/api/lead', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });

        var result = {};
        try { result = await response.json(); } catch (_) {}
        if (!response.ok || result.ok === false) throw new Error(result.error || 'Falha ao enviar');

        clarityEvent('lead_submit_success');
        if (typeof window.fbq === 'function') window.fbq('track','Lead');
        if (status) status.textContent = 'Dados enviados. Abrindo o WhatsApp…';

        setTimeout(function(){
          window.location.assign(WHATSAPP_URL);
        }, 250);
      } catch (error) {
        console.error('Erro no envio do formulário:', error);
        if (status) status.textContent = 'Não foi possível enviar seus dados agora. Tente novamente em alguns segundos.';
        if (button) {
          button.disabled = false;
          button.textContent = button.dataset.originalText || 'QUERO RECEBER OS DETALHES';
        }
      }
    });
  }

  loadClarity();
  loadDeferredPosters();
  initProofCarousel();

  var utms = readUtms();
  document.querySelectorAll('[data-lead-form]').forEach(function(form){
    bindForm(form, utms);
  });
})();
