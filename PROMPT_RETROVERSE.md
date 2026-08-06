# 🎮 RetroVerse — Documento Completo do Projeto

## Visão Geral

**RetroVerse** é uma plataforma web de emulação de jogos retro que roda diretamente no navegador, usando **EmulatorJS** como engine. O sistema permite jogar clássicos de 11 consoles com controles touch otimizados para celular (portrait e landscape), overlays personalizados por console e uma interface premium com tema neon/retro.

**URL de produção:** GitHub Pages (retroverse)  
**Engine:** EmulatorJS (cdn.emulatorjs.org/stable/data/)  
**ROMs:** Cloudflare Worker → Backblaze B2 (privado, via `retroverse-roms.mdsoltec.workers.dev`)  
**Hospedagem:** GitHub Pages  

---

## 📁 Estrutura de Arquivos

```
retroverse/
├── index.html              ← Página inicial (consoles por categoria + busca global + recentes/favoritos)
├── games.html              ← Lista de jogos do console selecionado + filtros + favoritos
├── play.html               ← Emulador + overlays calibrados + controles CSS fallback
├── css/
│   └── style.css           ← Estilos globais (design system premium)
├── assets/
│   ├── rv-icon.png         ← Favicon
│   ├── rv-icon-mini.png
│   ├── rv-icon-solid.png
│   ├── rv-transparent-final-box.png
│   ├── rv-transparent-final-outline.png
│   └── rv-transparent-final-solid.png
├── overlays/               ← Imagens de skin e botões por console
│   ├── snes/               ← snes_phone_portrait_purple.png + botões soltos (a-grey, b-grey, x-grey, y-grey, dpad-white, l-white, r-white, select-white, start-white, menu-white)
│   ├── gba/                ← gba_phone_portrait_yellow.png + animated versions + botões (a-white, b-white, dpad-white, l-white, r-white, select-white, start-white, menu-white)
│   ├── gbc/                ← gbc_phone_portrait_yellow.png + animated versions + botões
│   ├── nes/                ← nes_phone_portrait_beige.png + botões
│   ├── n64/                ← n64_phone_portrait_green.png + n64_phone_portrait_thumbstick.png + botões N64 (a-n64-grey, b-n64-grey, c-pad-grey, z-n64-grey, landscape_thumbstick)
│   ├── psx/                ← psx_phone_portrait_beige.png + psx_phone_portrait_analog.png + botões PS1 (circle35, cross-35, square35, triangle35, dpad35, L135, l35, l235, l335, r135, r35, r235, r335, select35, start35, menu35)
│   ├── sega/               ← saturn_portrait_black.png + saturn_portrait_black_stick.png + saturn_portrait_transparent_stick.png + botões Saturn/Sega (a-grey, b-grey, c-grey, x-grey, y-grey, z-grey, dpad-white, l-white, r-white, mode-white, analog-white, portrait_thumbstick, landscape_thumbstick, select-white, start-white, menu-white)
│   ├── saturn/             ← (cópia de sega/ — legado, pode remover)
│   ├── nds/                ← (vazia — aguardando skin)
│   └── arcade/             ← (vazia — aguardando skin)
├── covers/                 ← (não versionado) Capas dos jogos por console
└── calibrate.html          ← Ferramenta de calibração de overlays (não sobe pro GitHub)
```

---

## 🎯 Funcionalidades Atuais (Implementadas)

### Index (Home)
- **Navbar** com logo RV + nome "RETROVERSE" + slogan "ENTER THE CLASSICS"
- **Barra de busca global** fixa abaixo da navbar (position: fixed, não se move ao scroll)
  - Pesquisa em TODOS os consoles simultaneamente
  - Dropdown com resultados (console badge + nome + subtítulo)
  - Clique no resultado → vai direto para o jogo
  - Fecha ao clicar fora
- **Hero cinematográfico** com:
  - Gradientes animados (roxo, azul, verde em movimento)
  - Grid holográfico com scroll infinito
  - 15 partículas multicoloridas (cores dos consoles)
  - Animações de entrada escalonadas (fade-in com delay)
  - Stats em cards glass (11 Consoles | 100+ Jogos | ∞ Diversão)
- **Seção "Continue Jogando"** (preenchida via localStorage)
  - Carrossel horizontal com últimos 8 jogos abertos
  - Mostra capa, nome, subtítulo e console
  - Botão "Limpar" para resetar
- **Seção "Favoritos"** (preenchida via localStorage)
  - Carrossel horizontal com jogos favoritados
  - Botão "Limpar" para resetar
- **Categorias de consoles por era:**
  - 8-Bit (1983–1992): NES, GBC
  - 16-Bit (1988–1996): SNES, Mega Drive, Sega CD
  - 3D Era (1994–2002): N64, PS1
  - Portáteis (HANDHELDS): GBA, Game Gear, NDS
  - Arcade (FLIPERAMA): Arcade
- **Cards de console com glassmorphism:**
  - backdrop-filter: blur(16px) saturate(1.2)
  - Cores temáticas por console (CSS variables)
  - Hover com glow colorido, imagem flutua, badge muda de cor
- **Footer** minimalista

### Games (Lista de Jogos)
- **Navbar** com grid de 3 colunas: [← Consoles] | [CENTRO ABSOLUTO: RETROVERSE + nome console] | [spacer]
- **Toolbar fixa** abaixo da navbar com:
  - Busca (padronizada com glow verde igual à index)
  - Badge de quantidade de jogos (ao lado da busca)
  - Filtros à direita: Padrão | A-Z | Z-A | ❤ Favoritos
- **Grid de capas** estilo Steam/eShop:
  - Altura fixa das capas (200px desktop, 160px tablet, 130px mobile)
  - Overlay "JOGAR ▶" no hover
  - Botão de favorito ❤ (canto superior direito de cada card)
  - Info (nome + subtítulo) com altura fixa
- **Busca** filtra por nome e subtítulo em tempo real
- **Filtros:** Padrão (ordem original), A-Z, Z-A, Favoritos (mostra só favoritos)

### Play (Emulador)
- **Loading screen personalizada por console:**
  - Cores temáticas (CSS variables)
  - Logo RV na cor do console
  - Nome do console entre logo e "RETROVERSE"
  - Barra de progresso na cor do console
  - Barra de progresso de download (para jogos grandes)
- **Sistema de overlays calibrados (portrait):**
  - Imagem da skin como fundo (1080x2220, aspect 2.056)
  - Zonas de toque transparentes posicionadas sobre os botões da imagem
  - Coordenadas calibradas manualmente via calibrate.html
  - D-Pad com detecção de direção (8 direções)
  - Analógico (N64, PSX) com lógica de stick
  - Imagens animated (GBA, GBC) trocam ao pressionar botão
  - Container com max-height: 100vh e overflow: visible
- **Controles CSS (landscape/fallback):**
  - D-Pad SVG com grid 3x3 de direção
  - Botões de face em losango
  - Shoulders (L, R, L2, R2)
  - Meta (Select, Start)
  - Analógico com knob arrastável
- **EmulatorJS** com:
  - Preload de ROM com barra de progresso
  - Codificação de apóstrofos (%27) no URL
  - Hiding do gamepad nativo via CSS + MutationObserver
  - Fullscreen via gesto do usuário
- **Save no "Continue Jogando"** (localStorage) ao abrir o jogo

### Cores Temáticas por Console

| Console | CSS Variable | Cor | Glow |
|---|---|---|---|
| SNES | `--snes-color` | #7B2D8E (roxo) | rgba(123,45,142,0.5) |
| PS1 | `--psx-color` | #1560BD (azul) | rgba(21,96,189,0.5) |
| N64 | `--n64-color` | #E4000F (vermelho) | rgba(228,0,15,0.5) |
| Mega Drive | `--sega-color` | #003087 (azul escuro) | rgba(0,48,135,0.5) |
| GBA | `--gba-color` | #6B2FA0 (roxo) | rgba(107,47,160,0.5) |
| GBC | `--gbc-color` | #00A651 (verde) | rgba(0,166,81,0.5) |
| NES | `--nes-color` | #E4002B (vermelho) | rgba(228,0,43,0.5) |
| Arcade | `--arcade-color` | #00FF41 (verde neon) | rgba(0,255,65,0.5) |
| NDS | `--nds-color` | #00BFFF (ciano) | rgba(0,191,255,0.5) |
| Sega CD | `--segacd-color` | #1A1AFF (azul) | rgba(26,26,255,0.5) |
| Game Gear | `--gamegear-color` | #CC0000 (vermelho) | rgba(204,0,0,0.5) |

### Mapa de Input do EmulatorJS

```javascript
const EJS_INPUT = {
  B:0, Y:1, SELECT:2, START:3,
  UP:4, DOWN:5, LEFT:6, RIGHT:7,
  A:8, X:9, L:10, R:11, L2:12, R2:13,
  L3:14, R3:15,
  LSTICK_RIGHT:16, LSTICK_LEFT:17, LSTICK_DOWN:18, LSTICK_UP:19,
  RSTICK_RIGHT:20, RSTICK_LEFT:21, RSTICK_DOWN:22, RSTICK_UP:23,
};
```

### Coordenadas dos Overlays (Calibradas)

As coordenadas são em % da imagem (1080x2220), onde x=0 é esquerda e y=0 é topo.

**SNES:** dpad(23.24, 75.94, 39x18.5) | Y(57.13, 76.08) | X(71.57, 69.34) | B(71.94, 82.94) | A(85.83, 75.85) | L(14.72, 60.35) | R(85.28, 60.76) | SELECT(41.57, 90.08) | START(57.69, 89.99)

**GBA:** dpad(23.06, 75.31, 38.5x18.5) | A(84.91, 71.87) | B(65.46, 79.1) | L(15.46, 60.4) | R(84.72, 60.49) | SELECT(41.94, 87.87) | START(58.06, 87.87)

**GBC:** dpad(23.06, 75.04, 39x19) | A(84.17, 71.24) | B(64.72, 79.46) | SELECT(39.91, 88.59) | START(59.17, 88.5)

**NES:** dpad(24.72, 76.93, 30.5x14.5) | A(81.94, 77.02) | B(61.02, 77.02) | SELECT(38.61, 89.76) | START(59.17, 89.76)

**N64:** dpad(23.24, 84.25, 36.5x17.5) | A(85.28, 69.07) | B(62.13, 65.28) | Z(79.91, 58.5) | C_UP(73.61, 78.83) | C_DOWN(73.61, 89.76) | C_LEFT(61.57, 84.25) | C_RIGHT(85.28, 84.25) | L(13.8, 51.45) | R(85.83, 51.18) | START(49.72, 75.67) | STICK(analog, 30, 65, 25x12)

**PSX:** dpad(23.24, 63.74, 36.5x17.5) | CIRCLE(87.69, 63.92) | CROSS(73.61, 69.98) | SQUARE(59.17, 63.74) | TRIANGLE(73.61, 58.05) | L1(11.02, 49.65) | R1(89.35, 49.92) | L2(32.13, 49.83) | R2(67.69, 49.92) | SELECT(41.57, 75.85) | START(56.94, 75.94) | STICK_L(analog, 30, 82, 22x10) | STICK_R(analog, 70, 82, 22x10)

**Sega/Saturn:** dpad(23.61, 77.29, 34x16.5) | A(63.8, 83.26) | B(75.83, 78.02) | C(89.35, 73.32) | X(54.72, 77.02) | Y(67.5, 70.97) | Z(81.02, 66.63) | L(15.83, 56.06) | R(84.35, 56.06) | START(46.57, 93.83)

**Sega CD:** Reusa overlay do Sega/Saturn (mesmos controles)

**Game Gear:** Reusa overlay do Sega/Saturn (só dpad + A + B + Start)

**NDS:** Reusa overlay do GBA (mesmos botões + X, Y extras)

### localStorage Keys

| Key | Conteúdo | Formato |
|---|---|---|
| `rv_recent` | Últimos 8 jogos abertos | `[{name, subtitle, file, core, console, consoleShort, timestamp}]` |
| `rv_favorites` | Jogos favoritados | `[{name, subtitle, file, core, console, consoleShort}]` |

---

## ⚠️ Pendências Conhecidas

### Overlays Incompletos
1. **N64** — Analógico (thumbstick) precisa de calibração fina na posição exata
2. **PSX** — Analógicos L/R + L3/R3 precisam de calibração
3. **Arcade** — Pasta `overlays/arcade/` vazia, aguardando skin + botões (joystick + 6 botões + start + coin + menu)
4. **NDS** — Pasta `overlays/nds/` vazia, reusa GBA temporariamente

### Botão de Menu
- Nenhum console tem botão de menu mapeado nos overlays
- O botão de menu deveria abrir o menu nativo do EmulatorJS (save states, reset, etc.)
- Existe `menu-white.png` / `menu35.png` em cada pasta, mas não está posicionado

### Arcade
- Core: `fbneo` (FinalBurn Neo)
- Planejado: 6 botões (estilo Street Fighter: LP, MP, HP, LK, MK, HK) + joystick analógico + Start + Coin
- BIOS: `arcade/neogeo.zip`
- Formato das ROMs: `.zip`

---

## 🗺️ Roadmap Completo

### ✅ Fase 1 — Visual Premium (CONCLUÍDA)
- [x] Hero cinematográfico com gradientes animados e grid holográfico
- [x] Partículas multicoloridas por console (15 partículas)
- [x] Glassmorphism nos cards (backdrop-filter blur)
- [x] Cores temáticas por console (11 cores)
- [x] Loading screen personalizada por console
- [x] Stats em cards glass
- [x] Animações de entrada escalonadas

### ✅ Fase 2 — Experiência do Usuário (CONCLUÍDA)
- [x] "Continue Jogando" (localStorage, últimos 8 jogos)
- [x] Favoritos (❤ em cada jogo + seção na home)
- [x] Filtros na lista de jogos (Padrão, A-Z, Z-A, Favoritos)
- [x] Busca global (pesquisa em todos os consoles)
- [x] Barras fixas (index: search bar; games: toolbar com busca+badge+filtros)

### 📋 Fase 3 — Features Diferenciadas (PENDENTE)
- [ ] **Save States na nuvem** — Salvar/carregar progresso via Firebase ou Supabase
  - Integração com login de usuário (Google/GitHub)
  - Múltiplos slots de save por jogo
  - Auto-save ao sair do jogo
  - Sincronização entre dispositivos
- [ ] **Screenshots** — Captura de tela durante o jogo
  - Botão flutuante no play.html
  - Galeria pessoal no perfil
  - Download do screenshot
- [ ] **Perfil do Jogador** — Página com estatísticas
  - Horas jogadas por console
  - Jogos mais jogados
  - Conquistas desbloqueadas
  - Últimas atividades
- [ ] **Conquistas** — Badges por marcos
  - Primeiro jogo aberto
  - 10 jogos diferentes
  - 1 hora em um console
  - Completar X jogos
  - Favoritar 5 jogos
- [ ] **PWA** — Instalável como app
  - Service Worker
  - Manifest.json
  - Ícones para cada plataforma
  - Funciona offline (páginas, não ROMs)
- [ ] **Modo Theater** — Imersão total
  - Esconde navbar, toolbar, tudo
  - Só jogo + controles
  - Gesture para sair

### 📋 Fase 4 — Imersão Total (PENDENTE)
- [ ] **Sons de boot** — Ao abrir jogo, toca som de boot do console
  - Nintendo "ding", Sega "SEEEGA", PS1 startup, N64 chime
  - Toggle nas configurações
- [ ] **Música de fundo** — Lo-fi/chiptune opcional na navegação
  - Player discreto na navbar
  - Volume controlável
  - Múltiplas playlists
- [ ] **Efeitos sonoros UI** — Cliques, hovers, transições com sons 8-bit
  - Click suave ao navegar
  - Hover com blip
  - Transição entre páginas
- [ ] **Logo animado** — RV pulsa com efeito CRT na navbar
- [ ] **Gamepass semanal** — Destaque rotativo de jogos
  - Seção na home com 3-5 jogos recomendados
  - Rotação semanal automática

---

## 🔧 Detalhes Técnicos

### Cloudflare Worker (ROMs)
- URL base: `https://retroverse-roms.mdsoltec.workers.dev/`
- Estrutura: `/{console}/{filename}`
- CORS: Configurado para permitir domínios específicos
- Encoding: Apóstrofos codificados como `%27` no `preloadGame()`

### EmulatorJS
- CDN: `https://cdn.emulatorjs.org/stable/data/`
- Loader: `loader.js`
- Cores disponíveis: `snes`, `nes`, `gba`, `gbc`, `gb`, `n64`, `pcsx_rearmed`, `segaMD`, `segaCD`, `segaGG`, `fbneo`, `nds`
- Gamepad nativo: Escondido via CSS (`[class*="gamepad"]`) + MutationObserver
- Input: Via `EJS_emulator.gameManager.simulateInput(0, inputId, value)`

### Responsividade
- Breakpoints: 768px (tablet), 600px (mobile), 380px (xs)
- Grid consoles: `auto-fill, minmax(250px, 1fr)` → tablet `minmax(200px)` → mobile `repeat(2, 1fr)`
- Grid jogos: `auto-fill, minmax(150px, 1fr)` → tablet `repeat(4, 1fr)` → mobile `repeat(3, 1fr)` → xs `repeat(3, 1fr)`
- Navbar games: grid de 3 colunas no desktop, simplificada no mobile
- Toolbar games: horizontal no desktop, empilhada no mobile

### Z-Index Hierarchy
```
9999  — Loading screen
9998  — CRT overlay
999   — Navbar
998   — Search bar / Toolbar (fixos)
8000  — Fullscreen button
5000  — Overlay de controles / Pad CSS
4999  — Skin image (fundo decorativo)
1     — Game (EmulatorJS)
```

---

## 📝 Instruções de Manutenção

### Adicionar Novo Console
1. Adicionar card no `index.html` na categoria correta
2. Adicionar entrada no `config` e `catalog` do `games.html`
3. Adicionar skin image em `overlays/{console}/`
4. Calibrar overlay no `calibrate.html` e copiar coordenadas para `OVERLAYS` no `play.html`
5. Adicionar entrada em `SKINS` no `play.html` (para fallback landscape)
6. Adicionar entrada em `CONSOLE_THEMES` no `play.html` (para loading screen)
7. Adicionar cor temática no `:root` do `style.css` e classe `.console-card.{console}`

### Adicionar Jogo ao Catálogo
1. Fazer upload da ROM para o Backblaze B2 via Cloudflare Worker
2. Adicionar entrada no `catalog` do `games.html` no console correto
3. Opcional: adicionar capa em `covers/{console}/{filename}.png`

### Ajustar Posição de Overlay
1. Abrir `calibrate.html` no navegador
2. Selecionar o console
3. Clicar no botão que quer ajustar
4. Clicar na imagem para posicionar
5. Arrastar para mover, scroll para redimensionar
6. Exportar JSON e copiar para o `OVERLAYS` no `play.html`

---

## 🎨 Design System

### Fontes
- Display: `Orbitron` (títulos, badges, labels)
- Body: `Rajdhani` (textos, descrições)

### Paleta de Cores Base
- Fundo: `#020503` (verde-escuro quase preto)
- Card: `rgba(8,14,10,0.6)` (glassmorphism)
- Texto: `#ffffff`
- Texto muted: `#8e9e94`
- Neon verde: `#00ff41`
- Borda: `rgba(255,255,255,0.06)`

### Efeitos
- Glassmorphism: `backdrop-filter: blur(16px) saturate(1.2)`
- Neon glow: `box-shadow: 0 0 20px rgba(0,255,65,0.5)`
- CRT scanlines: `repeating-linear-gradient` com flicker animation
- Hover cards: `translateY(-12px) scale(1.03)` + glow colorido
