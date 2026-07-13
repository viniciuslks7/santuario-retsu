# O Santuário do Deserto do Clã Retsu

Diorama 3D interativo: um santuário no deserto com 9 artefatos dos irmãos samurai do Clã Retsu (e um décimo, escondido). Câmera cinematográfica (GSAP), lore servida por API, ambiente com a Biblioteca do Fim ao horizonte e ruínas, e exportação STL da malha real de cada arma.

## Interações

- **Clique num artefato** → câmera voa pro close + painel de lore (direita).
- **Clique na fortaleza central (monólito)** → lore do clã + contador de descoberta (esquerda).
- **Exportar STL** → baixa a malha real da arma (STL binário, ~100 mm), pronta pra fatiar.
- **Clique na areia / fora / `Esc`** → volta pra visão geral.
- **Deep-link** `?focus=<id>` abre direto num artefato.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Vite + React (TypeScript) |
| 3D | React Three Fiber + Drei + react-postprocessing |
| Animação | GSAP |
| Estado | Zustand |
| UI 2D | TailwindCSS v4 |
| Backend | Node.js + Express (`/api/lore/:siblingId`) |

## Rodando em dev

```bash
# Terminal 1 — API (porta 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (porta 5173, com proxy /api → 3001)
cd frontend && npm run dev
```

## Ferramentas

```bash
# Regenera os GLB procedurais das armas (frontend/public/models/)
# Cada arma tem 9–40 peças; a malha gerada aqui é a mesma exportada como STL.
cd frontend && node tools/build-models.mjs

# Screenshot headless + estado da cena (precisa do dev server de pé)
cd frontend && node scripts/shot.mjs "http://localhost:5173/?focus=lara" out.png 6000
```

Deep-link: `?focus=<id>` abre direto no close de um artefato (ids: haruki, setsuna,
lara, iwao, tsumugi, raizo, mizuki, ranmaru, kyoya — e o segredo, chosen).

## Estrutura

```
santuario-retsu/
├── backend/
│   └── src/
│       ├── server.js        # Express + endpoints da API
│       └── data/            # Lore dos 9 irmãos (JSON)
└── frontend/
    └── src/
        ├── components/
        │   ├── scene/       # DesertEnvironment, Shrine, artefatos (R3F)
        │   └── ui/          # Overlay 2D (lore, HUD, export)
        ├── store/           # Zustand (currentView, selectedSibling)
        └── lib/             # GSAP helpers, fetch da API
```
