/* ═══════════════════════════════════════════════════════════
   RETROVERSE — CANAIS DA RETROTV (fonte única)
   CANAIS DE TV AO VIVO (atuais) — sintonizou, tem sinal.
   Todos IPTV com VERIFICAÇÃO: playlist 200 + segmento .ts 200 +
   CORS * + codecs H.264/AAC (testado em 13/08/2026).
   Fonte: lista iptv-org/iptv + testes próprios.

   tipo: 'iptv' → url = playlist .m3u8
   ═══════════════════════════════════════════════════════════ */
window.RV_CANAIS = [
  /* ── DESENHOS / INFANTIL ── */
  { nome: 'GLOOBINHO',     programa: 'DESENHOS · 24/7',      categoria: 'INFANTIL', cor: '#00AEEF',
    tipo: 'iptv', url: 'http://177.52.24.163/GLOOBINHO-HD/index.m3u8',
    desc: 'Programação infantil ao vivo.' },
  { nome: 'BOX KIDS',      programa: 'DESENHOS · 24/7',      categoria: 'INFANTIL', cor: '#F58220',
    tipo: 'iptv', url: 'http://45.190.28.50/BOX_KIDS_HD/index.m3u8',
    desc: 'Desenhos para a criançada, ao vivo.' },
  { nome: 'NICKTOONS',     programa: 'DESENHOS · 24/7',      categoria: 'INFANTIL', cor: '#FF8C00',
    tipo: 'iptv', url: 'https://stmv2.srvif.com/nicktoons/nicktoons/playlist.m3u8',
    desc: 'NickToons — animações da Nickelodeon, ao vivo.' },
  { nome: 'KURIAKOS KIDS', programa: 'INFANTIL · 24/7',      categoria: 'INFANTIL', cor: '#4CAF50',
    tipo: 'iptv', url: 'https://w2.manasat.com/kkids/smil:kkids.smil/playlist.m3u8',
    desc: 'Canal infantil ao vivo (1080p).' },

  /* ── MÚSICA ── */
  { nome: 'MUSIC BOX',     programa: 'CLIPES · 24/7',        categoria: 'MÚSICA', cor: '#FF2D95',
    tipo: 'iptv', url: 'http://45.190.28.50/MUSIC_BOX_HD/index.m3u8',
    desc: 'Clipe nacional e internacional, ao vivo.' },
  { nome: 'KPOP TV',       programa: 'CLIPES · 24/7',        categoria: 'MÚSICA', cor: '#7A5CFF',
    tipo: 'iptv', url: 'https://giatv.bozztv.com/giatv/giatv-kpoptvplay/kpoptvplay/playlist.m3u8',
    desc: 'O canal do K-pop, ao vivo.' },
  { nome: 'TRACE BRASIL',  programa: 'URBANO · 24/7',        categoria: 'MÚSICA', cor: '#E4002B',
    tipo: 'iptv', url: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01131-tracetv-tracebrazuca-samsungbr/playlist.m3u8',
    desc: 'Hip hop, funk e cultura urbana brasileira, ao vivo.' },
  { nome: 'LAMORE ROCK',   programa: 'ROCK · 24/7',          categoria: 'MÚSICA', cor: '#333333',
    tipo: 'iptv', url: 'https://a.cdni.live/rodrigo2364/rodrigo2364/playlist.m3u8',
    desc: 'Rock Show WebTV — rock e som pesado, ao vivo.' },

  /* ── TV ABERTA ── */
  { nome: 'TV CULTURA',    programa: 'AO VIVO',              categoria: 'TV ABERTA', cor: '#00AEEF',
    tipo: 'iptv', url: 'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8',
    desc: 'Cultura Fast — canal oficial da TV Cultura, ao vivo.' },
  { nome: 'CULTURA PARA',  programa: 'AO VIVO',              categoria: 'TV ABERTA', cor: '#00AEEF',
    tipo: 'iptv', url: 'http://170.84.165.204/CANAL_21_HD/index.m3u8',
    desc: 'Cultura Pará — afiliada regional, ao vivo.' },
  { nome: 'BAND',          programa: 'AO VIVO',              categoria: 'TV ABERTA', cor: '#E4002B',
    tipo: 'iptv', url: 'http://45.190.28.50/BAND_HD/index.m3u8',
    desc: 'A Band ao vivo.' },
  { nome: 'REDETV!',       programa: 'AO VIVO',              categoria: 'TV ABERTA', cor: '#2E2E2E',
    tipo: 'iptv', url: 'http://45.190.28.50/REDE_TV_HD/index.m3u8',
    desc: 'RedeTV! ao vivo.' },
  { nome: 'REDE BRASIL',   programa: 'AO VIVO',              categoria: 'TV ABERTA', cor: '#C4170C',
    tipo: 'iptv', url: 'https://redebrasil.nuvemplay.live/hls/stream.m3u8',
    desc: 'Rede Brasil ao vivo (1080p).' },
  { nome: 'RECORD NEWS',   programa: 'JORNALISMO · 24/7',    categoria: 'TV ABERTA', cor: '#C4170C',
    tipo: 'iptv', url: 'https://5cf4a2c2512a2.streamlock.net/8016/8016/playlist.m3u8',
    desc: 'Record News — jornalismo 24 horas ao vivo.' }
];
