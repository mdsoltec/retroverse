/**
 * RetroVerse - RetroArch Overlay CFG Parser & Automatic Touch Engine (PocketArch Compatible)
 * 
 * Converte automaticamente qualquer arquivo .cfg do RetroArch / Libretro (ex: PocketArch)
 * e suas imagens de overlay em um sistema de controle touch dinâmico e calibrado.
 * 
 * Suporta:
 * - Tela inteira nativa (100% largura x 100% altura) sem cortar a parte inferior (MENU/START)
 * - Mapeamento de coordenadas (x, y) 100% sincronizado entre a imagem visual e a zona de toque do .cfg
 * - Mapeamento automático para window.EJS_emulator.gameManager.simulateInput(0, id, val)
 * - Renderização de imagens individuais de botões (ex: a-n64-grey.png, d-pad white.png, thumbstick.png)
 * - Analógico arrastável com movimento real
 * - ZERO efeitos visuais verdes desnecessários (100% limpo como um controle original)
 * - Sistema Inteligente de Prioridade de CFGs para GBA, PSX (DualShock), NDS e Saturn 6 Botões no Arcade
 */

(function(global) {
  'use strict';

  // Tabela de conversão de botões RetroArch -> EmulatorJS
  // Inclui suporte a layouts de 6 botões (Sega Saturn: A, B, C, X, Y, Z) para jogos de Luta no Arcade
  const RA_TO_EJS = {
    'b': 'B',
    'y': 'Y',
    'a': 'A',
    'x': 'X',
    'c': 'R',  // No layout Saturn 6 botões (A B C / X Y Z), 'c' aciona R (Chute Forte/Médio)
    'z': 'L',  // No layout Saturn 6 botões, 'z' aciona L (Soco Forte/Médio)
    'start': 'START',
    'select': 'SELECT',
    'l': 'L',
    'r': 'R',
    'l2': 'L2', // Z-Trigger no N64 / L2 no PSX
    'r2': 'R2',
    'l3': 'L3',
    'r3': 'R3',
    'up': 'UP',
    'down': 'DOWN',
    'left': 'LEFT',
    'right': 'RIGHT',
    'r_y_plus': 'RSTICK_UP',    // C-Up no N64
    'r_y_minus': 'RSTICK_DOWN', // C-Down no N64
    'r_x_minus': 'RSTICK_LEFT', // C-Left no N64
    'r_x_plus': 'RSTICK_RIGHT', // C-Right no N64
  };

  const EJS_INPUT_CODES = {
    B:0, Y:1, SELECT:2, START:3,
    UP:4, DOWN:5, LEFT:6, RIGHT:7,
    A:8, X:9, L:10, R:11, L2:12, R2:13,
    L3:14, R3:15,
    LSTICK_RIGHT:16, LSTICK_LEFT:17, LSTICK_DOWN:18, LSTICK_UP:19,
    RSTICK_RIGHT:20, RSTICK_LEFT:21, RSTICK_DOWN:22, RSTICK_UP:23,
  };

  class RetroArchOverlayEngine {
    constructor(wrapEl, cfgText, basePath, options = {}) {
      this.wrapEl = wrapEl;
      this.basePath = basePath.replace(/\/$/, '') + '/';
      this.debug = options.debug || new URLSearchParams(window.location.search).has('debug');
      this.isPortrait = options.isPortrait !== undefined ? options.isPortrait : (window.innerHeight > window.innerWidth);
      
      this.overlays = {};
      this.activeOverlayId = null;
      this.activeTouches = new Map(); // identifier -> list of { type, input, desc }
      this.activeButtons = new Set(); // EJS_INPUT codes atualmente pressionados

      this.parseCfg(cfgText);
      this.init();
    }

    parseCfg(cfgText) {
      const lines = cfgText.split(/\r?\n/);
      const data = {};

      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) continue;

        const key = line.substring(0, eqIndex).trim();
        let val = line.substring(eqIndex + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        data[key] = val;
      }

      const totalOverlays = parseInt(data['overlays'] || '1', 10);
      for (let i = 0; i < totalOverlays; i++) {
        const prefix = `overlay${i}_`;
        const ov = {
          id: `overlay${i}`,
          name: data[prefix + 'name'] || `overlay_${i}`,
          overlayImage: data[prefix + 'overlay'] || '',
          aspectRatio: parseFloat(data[prefix + 'aspect_ratio'] || '0'),
          descs: [],
        };

        const totalDescs = parseInt(data[prefix + 'descs'] || '0', 10);
        for (let d = 0; d < totalDescs; d++) {
          const dKey = `${prefix}desc${d}`;
          const dVal = data[dKey];
          if (!dVal) continue;

          const parts = dVal.split(',').map(p => p.trim());
          if (parts.length < 6) continue;

          const desc = {
            index: d,
            button: parts[0],
            x: parseFloat(parts[1]),
            y: parseFloat(parts[2]),
            type: parts[3], // 'radial' ou 'rect'
            rx: parseFloat(parts[4]),
            ry: parseFloat(parts[5]),
            nextTarget: data[`${dKey}_next_target`] || null,
            up: data[`${dKey}_up`] || null,
            down: data[`${dKey}_down`] || null,
            left: data[`${dKey}_left`] || null,
            right: data[`${dKey}_right`] || null,
            overlayImg: data[`${dKey}_overlay`] || null,
            imgEl: null,
          };
          ov.descs.push(desc);
        }

        this.overlays[ov.id] = ov;
        this.overlays[ov.name] = ov;
      }

      this.selectDefaultOverlay();
    }

    selectDefaultOverlay() {
      if (this.isPortrait) {
        this.activeOverlayId = 'overlay0';
      } else {
        this.activeOverlayId = this.overlays['overlay2'] ? 'overlay2' : 'overlay0';
      }
      if (!this.overlays[this.activeOverlayId]) {
        const keys = Object.keys(this.overlays);
        this.activeOverlayId = keys[0] || null;
      }
    }

    init() {
      if (!this.activeOverlayId || !this.wrapEl) return;
      this.renderOverlay(this.activeOverlayId);

      // Listeners Touch globais no container
      this.wrapEl.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
      this.wrapEl.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
      this.wrapEl.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
      this.wrapEl.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });

      // Suporte a cliques de mouse para testes no PC
      this.wrapEl.addEventListener('mousedown', (e) => this.onMouseDown(e));
      window.addEventListener('mousemove', (e) => this.onMouseMove(e));
      window.addEventListener('mouseup', (e) => this.onMouseUp(e));

      window.addEventListener('resize', () => {
        this.isPortrait = window.innerHeight > window.innerWidth;
        this.renderOverlay(this.activeOverlayId);
      });
    }

    renderOverlay(overlayId) {
      const ov = this.overlays[overlayId];
      if (!ov) return;
      this.activeOverlayId = overlayId;

      this.wrapEl.innerHTML = '';
      const W = window.innerWidth;
      const H = window.innerHeight;

      // O container principal ocupa a tela inteira (100vw x 100vh) desde o topo (0,0)
      Object.assign(this.wrapEl.style, {
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '5000',
        pointerEvents: 'auto',
        display: 'block',
      });

      // 1) Imagem base de fundo (ex: snes_phone_portrait_purple.png ou n64_phone_portrait_green.png)
      // Com object-fit: fill na tela inteira, a imagem cobre perfeitamente a largura horizontal, sem cortar o MENU, SELECT e START em baixo!
      if (ov.overlayImage) {
        const img = document.createElement('img');
        img.className = 'rv-ra-overlay-img';
        img.src = this.basePath + ov.overlayImage;
        img.draggable = false;
        Object.assign(img.style, {
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          position: 'absolute',
          top: '0',
          left: '0',
          pointerEvents: 'none',
          zIndex: '1',
        });
        img.onerror = () => {
          img.style.display = 'none';
        };
        this.wrapEl.appendChild(img);
      }

      // 2) Imagens individuais por botão/desc (ex: a-n64-grey.png, d-pad white.png, thumbstick.png)
      for (const desc of ov.descs) {
        if (desc.overlayImg) {
          const btnImg = document.createElement('img');
          btnImg.className = 'rv-ra-desc-img';
          btnImg.src = this.basePath + desc.overlayImg;
          btnImg.draggable = false;
          const leftPct = (desc.x - desc.rx) * 100;
          const topPct = (desc.y - desc.ry) * 100;
          const widthPct = desc.rx * 2 * 100;
          const heightPct = desc.ry * 2 * 100;

          Object.assign(btnImg.style, {
            position: 'absolute',
            left: leftPct + '%',
            top: topPct + '%',
            width: widthPct + '%',
            height: heightPct + '%',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: '2',
          });
          btnImg.onerror = () => {
            btnImg.style.display = 'none';
          };
          this.wrapEl.appendChild(btnImg);
          desc.imgEl = btnImg;
        }
      }

      // Modo debug visual (?debug=1 na URL)
      if (this.debug) {
        this.renderDebugZones(ov);
      }
    }

    renderDebugZones(ov) {
      const debugContainer = document.createElement('div');
      debugContainer.className = 'rv-ra-debug-container';
      Object.assign(debugContainer.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        zIndex: 9999,
      });

      for (const desc of ov.descs) {
        if (desc.x < 0 || desc.y < 0) continue;
        const box = document.createElement('div');
        const leftPct = (desc.x - desc.rx) * 100;
        const topPct = (desc.y - desc.ry) * 100;
        const widthPct = desc.rx * 2 * 100;
        const heightPct = desc.ry * 2 * 100;

        Object.assign(box.style, {
          position: 'absolute',
          left: leftPct + '%',
          top: topPct + '%',
          width: widthPct + '%',
          height: heightPct + '%',
          border: '1.5px dashed rgba(0, 255, 65, 0.85)',
          background: 'rgba(0, 255, 65, 0.15)',
          color: '#00ff41',
          fontSize: '9px',
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          textShadow: '0 0 2px #000',
        });
        box.innerText = desc.button;
        debugContainer.appendChild(box);
      }
      this.wrapEl.appendChild(debugContainer);
    }

    /**
     * Converte coordenada do toque (px) para (nX, nY) normalizado entre 0.0 e 1.0 na tela inteira
     */
    getNormalizedCoords(clientX, clientY) {
      const rect = this.wrapEl.getBoundingClientRect();
      const nX = (clientX - rect.left) / rect.width;
      const nY = (clientY - rect.top) / rect.height;
      return { nX: Math.max(0, Math.min(1, nX)), nY: Math.max(0, Math.min(1, nY)) };
    }

    findHitDescs(nX, nY) {
      const ov = this.overlays[this.activeOverlayId];
      if (!ov) return [];

      const hits = [];
      for (const desc of ov.descs) {
        if (desc.x < 0 || desc.y < 0) continue;

        let isHit = false;
        const dx = Math.abs(nX - desc.x);
        const dy = Math.abs(nY - desc.y);

        if (desc.type === 'radial') {
          const dist = (dx * dx) / (desc.rx * desc.rx) + (dy * dy) / (desc.ry * desc.ry);
          if (dist <= 1.0) isHit = true;
        } else {
          if (dx <= desc.rx && dy <= desc.ry) isHit = true;
        }

        if (isHit) {
          hits.push(desc);
        }
      }
      return hits;
    }

    /**
     * Apenas movimento físico do analógico arrastável (ZERO efeito verde ou brilhos desnecessários)
     */
    setDescHighlight(desc, active, moveX = 0, moveY = 0) {
      if (!desc) return;
      if (desc.button === 'analog_left' && desc.imgEl) {
        if (active) {
          desc.imgEl.style.transform = `translate(${moveX}px, ${moveY}px)`;
        } else {
          desc.imgEl.style.transform = 'translate(0px, 0px)';
        }
      }
    }

    processDescTouch(desc, nX, nY) {
      const actions = [];

      if (desc.button === 'overlay_next') {
        if (desc.nextTarget && this.overlays[desc.nextTarget]) {
          return [{ type: 'system', action: 'overlay_change', target: desc.nextTarget, desc }];
        }
        return [];
      }

      if (['save_state', 'load_state', 'reset', 'toggle_fast_forward', 'rewind', 'close_content'].includes(desc.button)) {
        return [{ type: 'system', action: desc.button, desc }];
      }

      // D-Pad Direcional com 8 direções e diagonais
      if (desc.button === 'dpad_area') {
        const dx = nX - desc.x;
        const dy = nY - desc.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const dist = Math.hypot(dx / desc.rx, dy / desc.ry);

        if (dist > 0.15) {
          if (angle > -157.5 && angle <= -22.5 && dy < 0) {
            if (angle > -112.5 && angle <= -67.5) actions.push('UP');
            else if (angle > -157.5 && angle <= -112.5) actions.push('UP', 'LEFT');
            else if (angle > -67.5 && angle <= -22.5) actions.push('UP', 'RIGHT');
          }
          if (angle > 22.5 && angle <= 157.5 && dy > 0) {
            if (angle > 67.5 && angle <= 112.5) actions.push('DOWN');
            else if (angle > 112.5 && angle <= 157.5) actions.push('DOWN', 'LEFT');
            else if (angle > 22.5 && angle <= 67.5) actions.push('DOWN', 'RIGHT');
          }
          if (Math.abs(angle) > 135) actions.push('LEFT');
          if (Math.abs(angle) < 45) actions.push('RIGHT');
        }
        return actions.map(a => ({ type: 'button', input: a, desc }));
      }

      // N64 C-Buttons (abxy_area -> RSTICK no EJS_INPUT)
      if (desc.button === 'abxy_area') {
        const dx = nX - desc.x;
        const dy = nY - desc.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) actions.push(desc.left || 'r_x_minus');
          else actions.push(desc.right || 'r_x_plus');
        } else {
          if (dy < 0) actions.push(desc.up || 'r_y_plus');
          else actions.push(desc.down || 'r_y_minus');
        }
        return actions.map(a => {
          const ejsBtn = RA_TO_EJS[a];
          return ejsBtn ? { type: 'button', input: ejsBtn, desc } : null;
        }).filter(Boolean);
      }

      // Analógico esquerdo (analog_left) com arraste dinâmico real
      if (desc.button === 'analog_left') {
        const dxNorm = (nX - desc.x) / desc.rx;
        const dyNorm = (nY - desc.y) / desc.ry;
        const maxMovePx = 28;
        const moveX = Math.max(-1, Math.min(1, dxNorm)) * maxMovePx;
        const moveY = Math.max(-1, Math.min(1, dyNorm)) * maxMovePx;

        this.setDescHighlight(desc, true, moveX, moveY);

        if (Math.hypot(dxNorm, dyNorm) > 0.18) {
          if (dyNorm < -0.35) actions.push('UP');
          if (dyNorm > 0.35) actions.push('DOWN');
          if (dxNorm < -0.35) actions.push('LEFT');
          if (dxNorm > 0.35) actions.push('RIGHT');
        }
        return actions.map(a => ({ type: 'button', input: a, desc }));
      }

      if (desc.button.includes('|')) {
        const subBtns = desc.button.split('|');
        for (const sb of subBtns) {
          const ejsBtn = RA_TO_EJS[sb] || sb.toUpperCase();
          actions.push({ type: 'button', input: ejsBtn, desc });
        }
        return actions;
      }

      const ejsBtn = RA_TO_EJS[desc.button] || desc.button.toUpperCase();
      if (ejsBtn) {
        actions.push({ type: 'button', input: ejsBtn, desc });
      }
      return actions;
    }

    triggerSystemAction(action, target) {
      if (action === 'overlay_change' && target) {
        this.renderOverlay(target);
        return;
      }
      try {
        const gm = window.EJS_emulator?.gameManager || window.EJS_emulator;
        if (!gm) return;
        if (action === 'save_state' && gm.saveState) gm.saveState();
        else if (action === 'load_state' && gm.loadState) gm.loadState();
        else if (action === 'reset' && gm.restart) gm.restart();
        else if (action === 'toggle_fast_forward' && gm.toggleFastForward) gm.toggleFastForward();
        else if (action === 'close_content') {
          window.location.href = 'index.html';
        }
      } catch(e) {}
    }

    /**
     * Mapeamento direto de cliques e toques para o emulador EmulatorJS
     */
    simulateInput(inputCode, pressed) {
      const code = (typeof window.EJS_INPUT !== 'undefined' && window.EJS_INPUT[inputCode] !== undefined)
        ? window.EJS_INPUT[inputCode]
        : EJS_INPUT_CODES[inputCode];
      if (code === undefined) return;
      const val = pressed ? 1 : 0;
      try {
        if (window.EJS_emulator && window.EJS_emulator.gameManager) {
          window.EJS_emulator.gameManager.simulateInput(0, code, val);
        } else if (window.EJS_emulator && typeof window.EJS_emulator.simulateInput === 'function') {
          window.EJS_emulator.simulateInput(0, code, val);
        }
      } catch(e) {}
    }

    updatePressedButtons() {
      const nextPressed = new Set();

      for (const actions of this.activeTouches.values()) {
        for (const act of actions) {
          if (act.type === 'button') {
            nextPressed.add(act.input);
          }
        }
      }

      for (const btn of this.activeButtons) {
        if (!nextPressed.has(btn)) {
          this.simulateInput(btn, false);
          this.activeButtons.delete(btn);
        }
      }

      for (const btn of nextPressed) {
        if (!this.activeButtons.has(btn)) {
          this.simulateInput(btn, true);
          this.activeButtons.add(btn);
        }
      }
    }

    onTouchStart(e) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const { nX, nY } = this.getNormalizedCoords(touch.clientX, touch.clientY);
        const hitDescs = this.findHitDescs(nX, nY);
        const actions = [];

        for (const desc of hitDescs) {
          const res = this.processDescTouch(desc, nX, nY);
          for (const item of res) {
            if (item.type === 'system') {
              this.triggerSystemAction(item.action, item.target);
            } else {
              actions.push(item);
            }
          }
        }
        this.activeTouches.set(touch.identifier, actions);
      }
      this.updatePressedButtons();
    }

    onTouchMove(e) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const { nX, nY } = this.getNormalizedCoords(touch.clientX, touch.clientY);
        const hitDescs = this.findHitDescs(nX, nY);
        const actions = [];

        for (const desc of hitDescs) {
          const res = this.processDescTouch(desc, nX, nY);
          for (const item of res) {
            if (item.type === 'button') actions.push(item);
          }
        }
        this.activeTouches.set(touch.identifier, actions);
      }
      this.updatePressedButtons();
    }

    onTouchEnd(e) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const descActs = this.activeTouches.get(touch.identifier) || [];
        for (const act of descActs) {
          if (act.desc && act.desc.button === 'analog_left') {
            this.setDescHighlight(act.desc, false);
          }
        }
        this.activeTouches.delete(touch.identifier);
      }
      this.updatePressedButtons();
    }

    onMouseDown(e) {
      const { nX, nY } = this.getNormalizedCoords(e.clientX, e.clientY);
      const hitDescs = this.findHitDescs(nX, nY);
      const actions = [];
      for (const desc of hitDescs) {
        const res = this.processDescTouch(desc, nX, nY);
        for (const item of res) {
          if (item.type === 'system') this.triggerSystemAction(item.action, item.target);
          else actions.push(item);
        }
      }
      this.activeTouches.set('mouse', actions);
      this.updatePressedButtons();
    }

    onMouseMove(e) {
      if (!this.activeTouches.has('mouse')) return;
      const { nX, nY } = this.getNormalizedCoords(e.clientX, e.clientY);
      const hitDescs = this.findHitDescs(nX, nY);
      const actions = [];
      for (const desc of hitDescs) {
        const res = this.processDescTouch(desc, nX, nY);
        for (const item of res) {
          if (item.type === 'button') actions.push(item);
        }
      }
      this.activeTouches.set('mouse', actions);
      this.updatePressedButtons();
    }

    onMouseUp(e) {
      const descActs = this.activeTouches.get('mouse') || [];
      for (const act of descActs) {
        if (act.desc && act.desc.button === 'analog_left') {
          this.setDescHighlight(act.desc, false);
        }
      }
      this.activeTouches.delete('mouse');
      this.updatePressedButtons();
    }
  }

  global.RetroArchOverlayEngine = RetroArchOverlayEngine;

  global.loadRetroArchOverlay = async function(core, wrapEl, options = {}) {
    // Tabela de perfis com pastas e arquivos candidatos em ordem de preferência
    // Dá prioridade para DualShock no PSX, Saturn (6 botões + analógico) no Arcade e reconhece variações do PocketArch
    const coreProfiles = {
      'snes': {
        folders: ['snes', 'SNES'],
        files: ['snes.cfg']
      },
      'nes': {
        folders: ['nes', 'NES'],
        files: ['nes.cfg']
      },
      'gba': {
        folders: ['gba', 'GBA'],
        files: ['gba.cfg']
      },
      'gbc': {
        folders: ['gbc', 'GBC'],
        files: ['gbc.cfg']
      },
      'gb': {
        folders: ['gb', 'GB'],
        files: ['gb.cfg']
      },
      'n64': {
        folders: ['n64', 'N64'],
        files: ['n64.cfg']
      },
      'pcsx_rearmed': {
        folders: ['psx', 'PSX', 'PS1', 'ps1'],
        files: ['psx.cfg']
      },
      'ps1': {
        folders: ['psx', 'PSX', 'PS1', 'ps1'],
        files: ['psx.cfg']
      },
      'segaMD': {
        folders: ['segaMD'],
        files: ['segaMD.cfg']
      },
      'segaCD': {
        folders: ['Genesis', 'genesis', 'segacd', 'segaCD', 'SegaCD'],
        files: ['genesis_phone_portrait.cfg', 'genesis.cfg', 'Genesis.cfg', 'segacd.cfg', 'segaCD.cfg', 'overlay.cfg', 'config.cfg']
      },
      'segaGG': {
        folders: ['GameGear', 'gamegear', 'gg', 'segaGG', 'GBC', 'gbc', 'GB', 'gb', 'GBA', 'gba', 'Universal', 'universal'],
        files: ['gg.cfg', 'gamegear.cfg', 'GameGear.cfg', 'gbc_phone_portrait.cfg', 'gbc.cfg', 'gb_phone_portrait.cfg', 'gb.cfg', 'gba_phone_portrait.cfg', 'gba.cfg', 'Universal.cfg', 'universal.cfg', 'overlay.cfg', 'config.cfg']
      },
      'nds': {
        folders: ['DS', 'ds', 'nds', 'NDS'],
        files: ['nds_phone_portrait.cfg', 'ds_phone_portrait.cfg', 'nds.cfg', 'NDS.cfg', 'DS.cfg', 'ds.cfg', 'overlay.cfg', 'config.cfg']
      },
      // Saturn (6 botões + analógico) como prioridade 1 para Arcade / Fliperama!
      'fbneo': {
        folders: ['arcade', 'Arcade', 'Saturn', 'saturn', 'Universal', 'universal'],
        files: ['saturn.cfg', 'Saturn.cfg', 'saturn_phone_portrait.cfg', 'arcade.cfg', 'Universal.cfg', 'universal.cfg', 'overlay.cfg', 'config.cfg']
      },
      'arcade': {
        folders: ['arcade', 'Arcade', 'Saturn', 'saturn', 'Universal', 'universal'],
        files: ['saturn.cfg', 'Saturn.cfg', 'saturn_phone_portrait.cfg', 'arcade.cfg', 'Universal.cfg', 'universal.cfg', 'overlay.cfg', 'config.cfg']
      },
      'psp': {
        folders: ['psp', 'PSP'],
        files: ['psp_phone_portrait.cfg', 'psp.cfg', 'PSP.cfg', 'overlay.cfg', 'config.cfg']
      }
    };

    const profile = coreProfiles[core];
    const folders = profile ? profile.folders : [core, core.toLowerCase(), core.toUpperCase()];
    const files = profile ? profile.files : [`${core}.cfg`, `${core.toLowerCase()}.cfg`, `${core.toUpperCase()}.cfg`, 'overlay.cfg', 'config.cfg'];
    const candidateUrls = [];

    for (const f of folders) {
      for (const file of files) {
        candidateUrls.push({ url: `overlays/${f}/${file}`, base: `overlays/${f}/` });
      }
    }

    for (const cand of candidateUrls) {
      try {
        const resp = await fetch(cand.url);
        if (resp.ok) {
          const cfgText = await resp.text();
          console.log(`[RetroArchOverlay] Sucesso ao carregar ${cand.url} (Compatível com PocketArch)`);
          return new RetroArchOverlayEngine(wrapEl, cfgText, cand.base, options);
        }
      } catch (err) {}
    }

    console.warn(`[RetroArchOverlay] Arquivo CFG não encontrado para o core "${core}". Fallback para SKINS[core].`);
    return null;
  };

})(window);
