/* ═══════════════════════════════════════════════════════════
   RETROVERSE — RADIO PLAYER (widget auto-injetado)

   COMO USAR: basta incluir estas duas linhas antes de </body>
   em qualquer pagina. Nao e preciso mexer no layout.

     <script src="js/radios.js"></script>
     <script src="js/radio-player.js"></script>

   O widget se monta sozinho no topo da pagina, em position
   fixed, e empurra o conteudo para baixo. Nao sobrescreve
   nada: cria os proprios elementos, com prefixo rvr- em todas
   as classes e ids, e injeta o CSS num <style> proprio.

   NAO CARREGAR em retrotv.html: a RetroTV ja tem o audio dos
   canais ao vivo e as duas fontes brigariam.

   COMPORTAMENTO
   • Barra recolhida no topo, com o nome da estacao tocando.
   • Clique em ESTACOES para abrir a lista, agrupada por
     categoria, com busca.
   • O que esta tocando e o volume persistem em localStorage
     e seguem o usuario de uma pagina para outra.
   • NAO toca sozinho ao abrir a pagina: navegador bloqueia
     autoplay com som. O estado e restaurado pausado e o
     usuario da play uma vez.
   • Em play.html o widget respeita o emulador: ao entrar em
     modo theater ou tela cheia, a barra se esconde sozinha.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // nao roda na RetroTV (audio concorrente) nem se ja existir
  if (/retrotv\.html/i.test(location.pathname)) return;
  if (window.RV_RADIO_ON) return;
  window.RV_RADIO_ON = true;

  var RADIOS = window.RV_RADIOS || [];
  if (!RADIOS.length) return;

  var CHAVE_EST = 'rv_radio_est';
  var CHAVE_VOL = 'rv_radio_vol';
  var CHAVE_ABA = 'rv_radio_aberta';

  function ler(k, padrao) {
    try { var v = localStorage.getItem(k); return v === null ? padrao : v; }
    catch (e) { return padrao; }
  }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ── CSS proprio (prefixo rvr-, nao colide com o site) ── */
  var css = ''
    + ':root { --rvr-h: 46px; }'
    + '.rvr-bar{position:fixed;top:0;left:0;right:0;height:var(--rvr-h);z-index:10000;'
    + 'display:flex;align-items:center;gap:10px;padding:0 12px;'
    + 'background:rgba(3,6,4,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);'
    + 'border-bottom:1px solid rgba(0,255,65,.22);'
    + 'box-shadow:0 2px 18px rgba(0,0,0,.7);'
    + 'font-family:var(--font-body,system-ui),sans-serif;'
    + 'transform:translateY(0);transition:transform .25s ease}'
    + '.rvr-bar.rvr-oculta{transform:translateY(-100%)}'
    + 'body.rvr-ativo{padding-top:var(--rvr-h)!important}'

    + '.rvr-btn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;'
    + 'gap:6px;height:30px;padding:0 11px;border-radius:15px;cursor:pointer;'
    + 'background:rgba(0,255,65,.08);border:1px solid rgba(0,255,65,.32);'
    + 'color:var(--green-neon,#00ff41);font-family:var(--font-display,system-ui),sans-serif;'
    + 'font-size:.6rem;font-weight:700;letter-spacing:1px;'
    + 'transition:background .18s ease,color .18s ease,box-shadow .18s ease}'
    + '.rvr-btn:hover{background:rgba(0,255,65,.2);box-shadow:0 0 12px rgba(0,255,65,.3)}'
    + '.rvr-btn svg{width:15px;height:15px;fill:currentColor;flex:0 0 auto}'
    + '.rvr-btn.rvr-play{width:34px;height:34px;padding:0;border-radius:50%}'
    + '.rvr-btn.rvr-play svg{width:17px;height:17px}'
    + '.rvr-btn.rvr-on{background:var(--green-neon,#00ff41);color:#030604}'

    + '.rvr-info{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center;line-height:1.25}'
    + '.rvr-nome{font-family:var(--font-display,system-ui),sans-serif;font-size:.68rem;font-weight:700;'
    + 'letter-spacing:1px;color:var(--text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.rvr-sub{font-size:.6rem;letter-spacing:.5px;color:var(--text-muted,#8e9e94);'
    + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'

    /* barrinhas animadas quando esta tocando */
    + '.rvr-eq{flex:0 0 auto;display:none;align-items:flex-end;gap:2px;height:16px;width:18px}'
    + '.rvr-bar.rvr-tocando .rvr-eq{display:flex}'
    + '.rvr-eq i{width:3px;background:var(--green-neon,#00ff41);border-radius:1px;animation:rvrEq .9s ease-in-out infinite}'
    + '.rvr-eq i:nth-child(1){height:40%;animation-delay:0s}'
    + '.rvr-eq i:nth-child(2){height:75%;animation-delay:.15s}'
    + '.rvr-eq i:nth-child(3){height:55%;animation-delay:.3s}'
    + '.rvr-eq i:nth-child(4){height:90%;animation-delay:.45s}'
    + '@keyframes rvrEq{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}'
    + '@media (prefers-reduced-motion:reduce){.rvr-eq i{animation:none}}'

    + '.rvr-vol{flex:0 0 auto;width:78px;height:4px;-webkit-appearance:none;appearance:none;'
    + 'background:rgba(255,255,255,.16);border-radius:2px;outline:none;cursor:pointer}'
    + '.rvr-vol::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;'
    + 'background:var(--green-neon,#00ff41);cursor:pointer;border:none}'
    + '.rvr-vol::-moz-range-thumb{width:12px;height:12px;border-radius:50%;'
    + 'background:var(--green-neon,#00ff41);cursor:pointer;border:none}'

    /* painel de estacoes */
    + '.rvr-painel{position:fixed;top:var(--rvr-h);left:0;right:0;z-index:9999;'
    + 'max-height:min(66vh,560px);overflow-y:auto;display:none;'
    + 'background:rgba(3,6,4,.985);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);'
    + 'border-bottom:1px solid rgba(0,255,65,.28);box-shadow:0 14px 40px rgba(0,0,0,.8);'
    + 'padding:14px 16px 20px;font-family:var(--font-body,system-ui),sans-serif}'
    + '.rvr-painel.rvr-on{display:block}'
    + '.rvr-busca{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);'
    + 'border:1px solid rgba(0,255,65,.22);border-radius:9px;padding:9px 13px;margin-bottom:12px;'
    + 'color:var(--text,#fff);font-family:inherit;font-size:.85rem;outline:none}'
    + '.rvr-busca:focus{border-color:var(--green-neon,#00ff41);box-shadow:0 0 12px rgba(0,255,65,.25)}'
    + '.rvr-busca::placeholder{color:var(--text-muted,#8e9e94)}'
    + '.rvr-cat{font-family:var(--font-display,system-ui),sans-serif;font-size:.58rem;font-weight:700;'
    + 'letter-spacing:2.5px;margin:14px 2px 8px;padding-bottom:5px;'
    + 'border-bottom:1px solid rgba(255,255,255,.07)}'
    + '.rvr-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:8px}'
    + '.rvr-item{display:block;width:100%;text-align:left;cursor:pointer;'
    + 'background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);'
    + 'border-radius:9px;padding:9px 11px;color:var(--text,#fff);font-family:inherit;'
    + 'transition:border-color .16s ease,background .16s ease,transform .16s ease}'
    + '.rvr-item:hover{background:rgba(0,255,65,.07);border-color:rgba(0,255,65,.45);transform:translateY(-2px)}'
    + '.rvr-item.rvr-on{border-color:var(--green-neon,#00ff41);background:rgba(0,255,65,.11)}'
    + '.rvr-item-nome{display:block;font-family:var(--font-display,system-ui),sans-serif;'
    + 'font-size:.68rem;font-weight:700;letter-spacing:.5px;margin-bottom:2px}'
    + '.rvr-item-desc{display:block;font-size:.68rem;line-height:1.4;color:var(--text-muted,#8e9e94)}'
    + '.rvr-vazio{padding:18px 2px;color:var(--text-muted,#8e9e94);font-size:.85rem}'

    + '@media (max-width:640px){'
    + ':root{--rvr-h:44px}'
    + '.rvr-sub,.rvr-vol{display:none}'
    + '.rvr-btn span{display:none}'
    + '.rvr-btn{padding:0 9px}'
    + '.rvr-grade{grid-template-columns:1fr 1fr}}';

  var st = document.createElement('style');
  st.id = 'rvr-estilo';
  st.textContent = css;
  document.head.appendChild(st);

  /* ── elementos ── */
  var audio = new Audio();
  audio.preload = 'none';
  audio.crossOrigin = 'anonymous';

  var bar = document.createElement('div');
  bar.className = 'rvr-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Radio RetroVerse');
  bar.innerHTML =
      '<button class="rvr-btn rvr-play" id="rvr-play" title="Tocar" aria-label="Tocar">'
    +   '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
    + '</button>'
    + '<div class="rvr-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'
    + '<div class="rvr-info">'
    +   '<span class="rvr-nome" id="rvr-nome">RADIO RETROVERSE</span>'
    +   '<span class="rvr-sub" id="rvr-sub">escolha uma estacao</span>'
    + '</div>'
    + '<input type="range" class="rvr-vol" id="rvr-vol" min="0" max="100" value="70" '
    +   'title="Volume" aria-label="Volume">'
    + '<button class="rvr-btn" id="rvr-lista" title="Ver estacoes" aria-expanded="false">'
    +   '<svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>'
    +   '<span>ESTACOES</span>'
    + '</button>';

  var painel = document.createElement('div');
  painel.className = 'rvr-painel';
  painel.innerHTML =
      '<input type="search" class="rvr-busca" id="rvr-busca" placeholder="Buscar estacao...">'
    + '<div id="rvr-conteudo"></div>';

  function montar() {
    document.body.appendChild(bar);
    document.body.appendChild(painel);
    document.body.classList.add('rvr-ativo');
  }
  if (document.body) montar();
  else document.addEventListener('DOMContentLoaded', montar);

  var elPlay, elNome, elSub, elVol, elLista, elBusca, elConteudo;
  function pegar() {
    elPlay = document.getElementById('rvr-play');
    elNome = document.getElementById('rvr-nome');
    elSub = document.getElementById('rvr-sub');
    elVol = document.getElementById('rvr-vol');
    elLista = document.getElementById('rvr-lista');
    elBusca = document.getElementById('rvr-busca');
    elConteudo = document.getElementById('rvr-conteudo');
  }

  var atual = -1;
  var ICO_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  var ICO_PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

  function pintar() {
    var tocando = !audio.paused && atual >= 0;
    bar.classList.toggle('rvr-tocando', tocando);
    if (elPlay) {
      elPlay.innerHTML = tocando ? ICO_PAUSE : ICO_PLAY;
      elPlay.title = tocando ? 'Pausar' : 'Tocar';
      elPlay.setAttribute('aria-label', elPlay.title);
      elPlay.classList.toggle('rvr-on', tocando);
    }
    var itens = painel.querySelectorAll('.rvr-item');
    for (var i = 0; i < itens.length; i++) {
      itens[i].classList.toggle('rvr-on', +itens[i].dataset.i === atual);
    }
  }

  function sintonizar(i, tocar) {
    if (i < 0 || i >= RADIOS.length) return;
    atual = i;
    var r = RADIOS[i];
    gravar(CHAVE_EST, String(i));

    if (elNome) elNome.textContent = r.nome;
    if (elSub) elSub.textContent = r.categoria + ' · ' + r.desc;
    if (elNome) elNome.style.color = r.cor || '';

    audio.src = r.url;
    if (tocar) {
      var p = audio.play();
      if (p && p.catch) {
        p.catch(function () {
          if (elSub) elSub.textContent = 'toque no play para ouvir';
          pintar();
        });
      }
    }
    pintar();
  }

  function alternar() {
    if (atual < 0) { sintonizar(0, true); return; }
    if (audio.paused) {
      if (!audio.src) audio.src = RADIOS[atual].url;
      var p = audio.play();
      if (p && p.catch) p.catch(function () { pintar(); });
    } else {
      audio.pause();
    }
    pintar();
  }

  function render() {
    if (!elConteudo) return;
    var termo = (elBusca && elBusca.value || '').trim().toLowerCase();
    var cats = [];
    RADIOS.forEach(function (r) {
      if (cats.indexOf(r.categoria) === -1) cats.push(r.categoria);
    });

    var html = '';
    var achou = 0;
    cats.forEach(function (cat) {
      var lista = [];
      RADIOS.forEach(function (r, i) {
        if (r.categoria !== cat) return;
        if (termo && (r.nome + ' ' + r.desc + ' ' + r.categoria).toLowerCase().indexOf(termo) < 0) return;
        lista.push({ r: r, i: i });
      });
      if (!lista.length) return;
      achou += lista.length;
      html += '<div class="rvr-cat" style="color:' + lista[0].r.cor + '">' + cat + '</div>';
      html += '<div class="rvr-grade">';
      lista.forEach(function (o) {
        html += '<button class="rvr-item' + (o.i === atual ? ' rvr-on' : '') + '" data-i="' + o.i + '">'
             +    '<span class="rvr-item-nome" style="color:' + o.r.cor + '">' + o.r.nome + '</span>'
             +    '<span class="rvr-item-desc">' + o.r.desc + '</span>'
             +  '</button>';
      });
      html += '</div>';
    });

    elConteudo.innerHTML = achou ? html
      : '<p class="rvr-vazio">Nenhuma estacao encontrada.</p>';

    var itens = elConteudo.querySelectorAll('.rvr-item');
    for (var i = 0; i < itens.length; i++) {
      itens[i].onclick = function () {
        sintonizar(+this.dataset.i, true);
        fechar();
      };
    }
  }

  function abrir() {
    painel.classList.add('rvr-on');
    if (elLista) elLista.setAttribute('aria-expanded', 'true');
    gravar(CHAVE_ABA, '1');
    render();
    if (elBusca) elBusca.focus();
  }
  function fechar() {
    painel.classList.remove('rvr-on');
    if (elLista) elLista.setAttribute('aria-expanded', 'false');
    gravar(CHAVE_ABA, '0');
  }

  function iniciar() {
    pegar();
    if (!elPlay) return;

    var vol = parseInt(ler(CHAVE_VOL, '70'), 10);
    if (isNaN(vol)) vol = 70;
    audio.volume = vol / 100;
    elVol.value = vol;

    elPlay.onclick = alternar;
    elVol.oninput = function () {
      audio.volume = this.value / 100;
      gravar(CHAVE_VOL, this.value);
    };
    elLista.onclick = function () {
      painel.classList.contains('rvr-on') ? fechar() : abrir();
    };
    if (elBusca) elBusca.oninput = render;

    audio.addEventListener('playing', pintar);
    audio.addEventListener('pause', pintar);
    audio.addEventListener('error', function () {
      if (elSub) elSub.textContent = 'estacao fora do ar, escolha outra';
      pintar();
    });
    audio.addEventListener('waiting', function () {
      if (elSub) elSub.textContent = 'conectando...';
    });
    audio.addEventListener('playing', function () {
      if (elSub && atual >= 0) {
        elSub.textContent = RADIOS[atual].categoria + ' · ' + RADIOS[atual].desc;
      }
    });

    // fecha o painel ao clicar fora ou com ESC
    document.addEventListener('click', function (e) {
      if (!painel.classList.contains('rvr-on')) return;
      if (painel.contains(e.target) || bar.contains(e.target)) return;
      fechar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && painel.classList.contains('rvr-on')) fechar();
    });

    /* restaura a estacao anterior — PAUSADA.
       Autoplay com som e bloqueado pelo navegador: se
       chamassemos play() aqui, o botao ficaria mentindo
       que esta tocando. O usuario da play uma vez. */
    var salva = parseInt(ler(CHAVE_EST, '-1'), 10);
    if (salva >= 0 && salva < RADIOS.length) {
      atual = salva;
      var r = RADIOS[salva];
      elNome.textContent = r.nome;
      elNome.style.color = r.cor || '';
      elSub.textContent = 'pausado · toque no play';
      audio.src = r.url;
    }
    pintar();

    /* em play.html, some junto com os controles do emulador */
    if (document.getElementById('game')) {
      var obs = new MutationObserver(function () {
        var esconder = document.body.classList.contains('theater-mode')
                    || !!document.fullscreenElement;
        bar.classList.toggle('rvr-oculta', esconder);
        document.body.classList.toggle('rvr-ativo', !esconder);
        if (esconder) fechar();
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      document.addEventListener('fullscreenchange', function () {
        var esconder = document.body.classList.contains('theater-mode')
                    || !!document.fullscreenElement;
        bar.classList.toggle('rvr-oculta', esconder);
        document.body.classList.toggle('rvr-ativo', !esconder);
        if (esconder) fechar();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* API simples, caso voce queira controlar de fora */
  window.RV_RADIO = {
    tocar: function (i) { sintonizar(i, true); },
    pausar: function () { audio.pause(); pintar(); },
    estacoes: RADIOS,
    audio: audio
  };
})();
