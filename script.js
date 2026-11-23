// Pele de Pêssego · landing page do aluguer
// Regras do simulador (documento central, secção 6A):
//   total = pacote + 3 € × (km de ida por estrada − 10), por deslocação; até 10 km a deslocação é 0 €.
//   Serviço até 50 km. No pacote mensal a deslocação é cobrada em cada deslocação.
(function () {
  'use strict';

  var KM_INCLUIDOS = 10;
  var KM_MAXIMO = 50;
  var EUR_POR_KM = 3;

  var root = document.documentElement;

  // Entrada do topo: uma vez, depois do primeiro desenho.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-ready'); });
  });

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  // Barra de contacto no telemóvel: só aparece quando os botões do topo e do fecho não estão à vista.
  var bar = document.querySelector('.actionbar');
  var alvos = document.querySelectorAll('.hero .actions, .closing .actions');
  if (bar && 'IntersectionObserver' in window && alvos.length) {
    var visiveis = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visiveis.add(e.target); else visiveis.delete(e.target);
      });
      bar.classList.toggle('is-hidden', visiveis.size > 0);
    });
    alvos.forEach(function (el) { io.observe(el); });
  }

  // Simulador
  var form = document.getElementById('calc');
  if (!form) return;
  var pacote = document.getElementById('pacote');
  var km = document.getElementById('km');
  var kmErro = document.getElementById('km-erro');
  var campoVisitas = document.getElementById('campo-visitas');
  var visitas = document.getElementById('visitas');
  var visitasErro = document.getElementById('visitas-erro');
  var out = document.getElementById('resultado');

  var eurInt = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var eurDec = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var eur = { format: function (v) { return (Math.round(v * 100) % 100 === 0 ? eurInt : eurDec).format(v); } };

  function lerNumero(txt) {
    var t = String(txt).trim().replace(/\s/g, '').replace(',', '.');
    if (t === '') return null;
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    return parseFloat(t);
  }

  function erro(campo, el, msg) {
    if (msg) { el.textContent = msg; el.hidden = false; campo.setAttribute('aria-invalid', 'true'); }
    else { el.textContent = ''; el.hidden = true; campo.removeAttribute('aria-invalid'); }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function mostrar(html, fora) {
    out.innerHTML = html;
    out.classList.toggle('result--out', !!fora);
  }

  var botaoLigar = '<a class="btn btn--primary" href="tel:+351916974262">Reservar por telefone</a>';

  function calcular() {
    var opt = pacote.options[pacote.selectedIndex];
    var mensal = opt && opt.getAttribute('data-mensal') === '1';
    campoVisitas.hidden = !mensal;

    var dist = lerNumero(km.value);
    if (dist !== null && isNaN(dist)) erro(km, kmErro, 'Escreva os km só com números, por exemplo 25.');
    else erro(km, kmErro, '');

    var n = 1;
    if (mensal) {
      var v = lerNumero(visitas.value);
      if (v === null || isNaN(v) || v < 1 || Math.floor(v) !== v) {
        erro(visitas, visitasErro, 'Escreva quantas deslocações prevê no mês, por exemplo 4.');
        n = null;
      } else { erro(visitas, visitasErro, ''); n = v; }
    } else {
      erro(visitas, visitasErro, '');
    }

    if (!pacote.value) {
      mostrar('<p class="result__empty">Escolha um pacote para ver o total.</p>');
      return;
    }
    if (dist === null || isNaN(dist) || n === null) {
      mostrar('<p class="result__empty">Escreva a distância em km para ver o total.</p>');
      return;
    }
    if (dist > KM_MAXIMO) {
      mostrar(
        '<p class="result__label">Fora da zona</p>' +
        '<p class="result__total">Esta morada fica fora da nossa zona de aluguer (50 km da Maia). Ligue-nos: podemos ter um centro parceiro perto de si.</p>' +
        botaoLigar, true);
      return;
    }

    var base = parseFloat(pacote.value);
    var kmCobrados = Math.max(0, dist - KM_INCLUIDOS);
    var porDeslocacao = kmCobrados * EUR_POR_KM;
    var deslocacao = porDeslocacao * n;
    var total = base + deslocacao;

    var detalhe;
    if (kmCobrados === 0) {
      detalhe = 'Deslocação incluída (' + esc(fmtKm(dist)) + ' km, dentro dos 10 km incluídos).';
    } else if (mensal) {
      detalhe = 'Pacote ' + eur.format(base) + ' + deslocação ' + eur.format(porDeslocacao) + ' × ' + n +
        (n === 1 ? ' deslocação' : ' deslocações') + ' (' + esc(fmtKm(dist)) + ' km, ' + esc(fmtKm(kmCobrados)) + ' km acima dos 10 incluídos).';
    } else {
      detalhe = 'Pacote ' + eur.format(base) + ' + deslocação ' + eur.format(deslocacao) +
        ' (' + esc(fmtKm(dist)) + ' km, ' + esc(fmtKm(kmCobrados)) + ' km acima dos 10 incluídos).';
    }

    mostrar(
      '<p class="result__label">Total estimado</p>' +
      '<p class="result__total">' + eur.format(total) + '</p>' +
      '<p class="result__detail">' + detalhe + '</p>' +
      '<p class="result__note">Valor indicativo. Confirmamos o preço final por telefone.</p>' +
      botaoLigar);
  }

  function fmtKm(x) { return String(Math.round(x * 10) / 10).replace('.', ','); }

  form.addEventListener('input', calcular);
  form.addEventListener('change', calcular);
  form.addEventListener('submit', function (e) { e.preventDefault(); calcular(); });
})();
