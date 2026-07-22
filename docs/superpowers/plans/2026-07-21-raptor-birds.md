# Aves de rapina circulando o santuário — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar 2-3 aves de rapina (silhueta low-poly única, sem diferenciar espécie) circulando em voo sobre o Shrine, que debandam definitivamente no início da tempestade do juramento (`stormPhase: 'raging'`).

**Architecture:** Um módulo puro (`lib/raptorGeometry.ts`) constrói a malha 3D low-poly reutilizável (sem textura). Um componente R3F (`components/scene/RaptorBirds.tsx`) renderiza 2-3 `<mesh>` independentes (não instanciado — poucas aves não justificam `instancedMesh`), cada um com posição paramétrica em círculo + banking calculados imperativamente em `useFrame` (mesmo idioma do resto do projeto: zero re-render por frame). Reação à tempestade é lida direto de `useShrineStore` — sem novo estado global.

**Tech Stack:** React Three Fiber (`@react-three/fiber`), `three`, `zustand` (`useShrineStore` existente). Sem framework de teste unitário no projeto — verificação segue o padrão já estabelecido: `tsc --noEmit`, `eslint`, e scripts de QA via Puppeteer (`frontend/scripts/*-check.mjs`) que tiram screenshots pra inspeção visual.

## Global Constraints

- Sem diferenciação visual entre gavião e urubu — um tipo único de ave (spec).
- Sem reação a hover/clique/seleção de irmão — só reage a `stormPhase` (spec).
- Sem dependência do ciclo dia/noite — aves sempre visíveis até a debandada (spec).
- Debandada dispara na transição `'idle' → 'raging'` de `stormPhase`, nunca retorna (consistente com `stormPhase` nunca voltando a `'idle'` na mesma visita — `store/useShrineStore.ts:9`).
- Seguir o padrão imperativo já usado no projeto: mutação direta de `mesh.position`/`mesh.rotation` dentro de `useFrame`, sem re-render React por frame (ver `components/scene/SandStorm.tsx`, `components/scene/DustParticles.tsx`).
- Comentários no código em pt-BR, curtos, só onde o "porquê" não é óbvio — estilo já usado no resto do projeto.
- Gate obrigatório antes de considerar qualquer task pronta: `tsc --noEmit` e `eslint src --max-warnings 0` verdes (ambos rodam de dentro de `frontend/`).

---

### Task 1: Geometria low-poly da ave

**Files:**
- Create: `frontend/src/lib/raptorGeometry.ts`

**Interfaces:**
- Produces: `createRaptorGeometry(): THREE.BufferGeometry` — malha "pipa" achatada (bico → ponta de asa → rabo → ponta de asa) com espessura via ápices topo/base, 8 triângulos, sem UVs/textura. Espaço local: bico aponta em **-Z** (convenção do `Object3D.lookAt`, usada na Task 2), envergadura no eixo X, espessura no eixo Y.

- [ ] **Step 1: Escrever o módulo de geometria**

```ts
// frontend/src/lib/raptorGeometry.ts
import * as THREE from 'three'

/** Silhueta baixo-poli de ave de rapina: "pipa" achatada (bico → ponta de asa
 *  → rabo → ponta de asa) com espessura via ápices topo/base — 8 triângulos.
 *  Tem volume real (não é billboard) pra ler certo de qualquer ângulo de
 *  câmera enquanto a ave circula. Bico aponta em -Z: convenção do
 *  Object3D.lookAt (usado em RaptorBirds pra orientar a ave na trajetória). */
export function createRaptorGeometry(): THREE.BufferGeometry {
  const nose = [0, 0, -1.1]
  const rightTip = [1.6, 0, 0.15]
  const tail = [0, 0, 1.0]
  const leftTip = [-1.6, 0, 0.15]
  const top = [0, 0.06, 0]
  const bottom = [0, -0.06, 0]

  const triangles = [
    // metade de cima (bico → asa dir. → rabo → asa esq. → bico, ligando ao ápice de cima)
    nose, rightTip, top,
    rightTip, tail, top,
    tail, leftTip, top,
    leftTip, nose, top,
    // metade de baixo (mesmo perímetro, ligando ao ápice de baixo)
    rightTip, nose, bottom,
    tail, rightTip, bottom,
    leftTip, tail, bottom,
    nose, leftTip, bottom,
  ]

  const positions = new Float32Array(triangles.flat())
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `cd frontend && npx tsc --noEmit && npx eslint src/lib/raptorGeometry.ts --max-warnings 0`
Expected: sem erros (o arquivo compila e não tem warnings de lint).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/raptorGeometry.ts
git commit -m "$(cat <<'EOF'
feat: geometria low-poly da ave de rapina

Malha "pipa" com espessura (8 triângulos, sem textura) — base pro
componente RaptorBirds que vai circular sobre o Shrine.
EOF
)"
```

---

### Task 2: Componente RaptorBirds — voo circular, banking e debandada

**Files:**
- Create: `frontend/src/components/scene/RaptorBirds.tsx`

**Interfaces:**
- Consumes: `createRaptorGeometry(): THREE.BufferGeometry` (Task 1, `lib/raptorGeometry.ts`); `useShrineStore` (`store/useShrineStore.ts`) — lê `s.stormPhase: 'idle' | 'raging' | 'done'`.
- Produces: `export function RaptorBirds(): JSX.Element` — componente sem props, monta as 2-3 aves. Consumido pela Task 3 em `Experience.tsx`.

- [ ] **Step 1: Escrever o componente**

```tsx
// frontend/src/components/scene/RaptorBirds.tsx
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { createRaptorGeometry } from '../../lib/raptorGeometry'
import { useShrineStore } from '../../store/useShrineStore'

// Aves de rapina circulando sobre o Shrine (centro da cena). Debandam de vez
// no início da tempestade do juramento (stormPhase 'raging') — a fauna foge
// da tormenta — e nunca voltam, mesmo padrão de stormPhase nunca retornar a
// 'idle' na mesma visita.

const CENTER = new THREE.Vector3(0, 0, 0)
const BANK_AMOUNT = 0.35
/** duração da debandada: raio e altura crescem em ease-out até a ave sumir de vista */
const FLEE_SECONDS = 5
const BODY_COLOR = new THREE.Color('#1c140d')

interface RaptorSeed {
  radius: number
  height: number
  /** rad/s — sinal define sentido do círculo (horário/anti-horário) */
  angularSpeed: number
  phase: number
  bob: number
}

const SEEDS: RaptorSeed[] = [
  { radius: 10, height: 15, angularSpeed: 0.22, phase: 0, bob: 0.6 },
  { radius: 13, height: 12.5, angularSpeed: -0.16, phase: 2.4, bob: 0.9 },
  { radius: 8.5, height: 17, angularSpeed: 0.28, phase: 4.6, bob: 0.4 },
]

function Raptor({
  seed,
  geometry,
  fleeStartRef,
}: {
  seed: RaptorSeed
  geometry: THREE.BufferGeometry
  fleeStartRef: React.MutableRefObject<number | null>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh || !mesh.visible) return
    const t = clock.elapsedTime
    const angle = seed.phase + t * seed.angularSpeed

    let radius = seed.radius
    let height = seed.height + Math.sin(t * seed.bob + seed.phase) * 0.6

    const fleeStart = fleeStartRef.current
    if (fleeStart !== null) {
      const elapsed = t - fleeStart
      if (elapsed > FLEE_SECONDS) {
        mesh.visible = false
        return
      }
      // ease-out: acelera pra fora rápido no início, suaviza perto do fim
      const k = 1 - Math.pow(1 - Math.min(elapsed / FLEE_SECONDS, 1), 3)
      radius += k * 60
      height += k * 40
    }

    const x = CENTER.x + radius * Math.cos(angle)
    const z = CENTER.z + radius * Math.sin(angle)
    mesh.position.set(x, height, z)

    // tangente da trajetória circular = direção de voo; dirSign carrega o
    // sentido do círculo (sinal de angularSpeed)
    const dirSign = Math.sign(seed.angularSpeed) || 1
    target.set(x - Math.sin(angle) * dirSign, height, z + Math.cos(angle) * dirSign)
    mesh.lookAt(target)
    // banking: inclina na curva (raio constante = curvatura constante, então
    // um ângulo fixo já lê bem — sem precisar variar por frame)
    mesh.rotateZ(-dirSign * BANK_AMOUNT)
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color={BODY_COLOR} roughness={0.9} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function RaptorBirds() {
  const geometry = useMemo(() => createRaptorGeometry(), [])
  const stormPhase = useShrineStore((s) => s.stormPhase)
  const clock = useThree((s) => s.clock)
  const fleeStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (stormPhase === 'raging' && fleeStartRef.current === null) {
      fleeStartRef.current = clock.elapsedTime
    }
  }, [stormPhase, clock])

  return (
    <>
      {SEEDS.map((seed, i) => (
        <Raptor key={i} seed={seed} geometry={geometry} fleeStartRef={fleeStartRef} />
      ))}
    </>
  )
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `cd frontend && npx tsc --noEmit && npx eslint src/components/scene/RaptorBirds.tsx --max-warnings 0`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/scene/RaptorBirds.tsx
git commit -m "$(cat <<'EOF'
feat: componente RaptorBirds — voo circular, banking e debandada

Aves circulam com raio/altura/fase próprios (banking pela curvatura
constante); na transição stormPhase idle→raging, expandem raio e
altura em ease-out até sumir de vista e não retornam. Ainda não
montado em Experience.tsx (Task 3).
EOF
)"
```

---

### Task 3: Integração em Experience.tsx + QA visual

**Files:**
- Modify: `frontend/src/components/scene/Experience.tsx`
- Create: `frontend/scripts/raptor-check.mjs`

**Interfaces:**
- Consumes: `RaptorBirds()` (Task 2, `components/scene/RaptorBirds.tsx`).

- [ ] **Step 1: Montar `<RaptorBirds />` em Experience.tsx**

Editar `frontend/src/components/scene/Experience.tsx` — adicionar o import e montar o componente perto do `<Shrine />` (mesma área da cena):

```tsx
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { CameraRig } from './CameraRig'
import { DesertEnvironment } from './DesertEnvironment'
import { DustParticles } from './DustParticles'
import { Landmarks } from './Landmarks'
import { RaptorBirds } from './RaptorBirds'
import { SandBursts } from './SandBursts'
import { SandStorm } from './SandStorm'
import { Shrine } from './Shrine'
import { FOG_FAR, FOG_NEAR } from '../../lib/storm'

export function Experience() {
  return (
    <>
      <fog attach="fog" args={['#c97f52', FOG_NEAR, FOG_FAR]} />

      <CameraRig />
      <DesertEnvironment />
      <Landmarks />
      <DustParticles />
      {/* montada depois do DesertEnvironment: o useFrame dela roda depois e
          fecha o fog por cima da cor do ciclo dia/noite */}
      <SandStorm />
      <SandBursts />
      <Shrine />
      <RaptorBirds />

      <OrbitControls
        makeDefault
        enableDamping
        target={[0, 2.5, 0]}
        minDistance={6}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2 - 0.06}
        enablePan={false}
      />

      {/* Cinematografia: brilho nas armas/sol, grão de filme e vinheta */}
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1} luminanceSmoothing={0.25} />
        <Noise opacity={0.04} />
        <Vignette eskil={false} offset={0.22} darkness={0.78} />
      </EffectComposer>
    </>
  )
}
```

(Única mudança real: import de `RaptorBirds` e a linha `<RaptorBirds />` depois de `<Shrine />`.)

- [ ] **Step 2: Escrever o script de QA visual**

`?storm=1` já força `stormPhase: 'raging'` no store (`components/scene/SandStorm.tsx:62-71`) — o `RaptorBirds` lê o mesmo store, então nenhum deep-link novo é necessário.

```js
// frontend/scripts/raptor-check.mjs
// Verifica as aves de rapina: screenshot circulando calmas e, com ?storm=1,
// screenshot depois da debandada (FLEE_SECONDS + folga).
// Uso: node scripts/raptor-check.mjs <url-base> <dir-de-saida>
import puppeteer from 'puppeteer-core'

const [base, outDir] = process.argv.slice(2)

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--window-size=1600,900'],
})

try {
  const page = await browser.newPage()
  page.on('pageerror', (err) => console.error('[pageerror]', err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[console.error]', msg.text())
  })
  await page.setViewport({ width: 1600, height: 900 })

  // 'load' em vez de 'networkidle0': HMR do Vite nunca deixa o idle fechar
  await page.goto(`${base}/?tod=0`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 4000))
  await page.screenshot({ path: `${outDir}/raptors-circling.png` })
  console.log('screenshot das aves circulando salvo')

  await page.goto(`${base}/?tod=0&storm=1`, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 7000))
  await page.screenshot({ path: `${outDir}/raptors-fled.png` })
  console.log('screenshot pós-debandada salvo')
} finally {
  await browser.close()
}
```

- [ ] **Step 3: Rodar o gate completo**

Run: `cd frontend && npx tsc --noEmit && npx eslint src --max-warnings 0`
Expected: sem erros em nenhum dos dois.

- [ ] **Step 4: Rodar a verificação visual**

Com o dev server rodando em `:5173` (`npm run dev` dentro de `frontend/`, backend em `:3001` se aplicável):

Run: `node scripts/raptor-check.mjs http://localhost:5173 %TEMP%\claude-shots` (de dentro de `frontend/`)
Expected: dois PNGs gerados sem `[pageerror]`/`[console.error]` no output; `raptors-circling.png` mostra 2-3 silhuetas escuras circulando sobre o santuário; `raptors-fled.png` mostra a cena sem aves visíveis (debandaram).

Ler os dois screenshots (`Read` tool) e confirmar visualmente antes de seguir.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/scene/Experience.tsx frontend/scripts/raptor-check.mjs
git commit -m "$(cat <<'EOF'
feat: monta RaptorBirds na cena + script de QA visual

Aves de rapina agora circulam sobre o Shrine. Script
raptor-check.mjs verifica visualmente o voo calmo e a debandada
forçada via ?storm=1.
EOF
)"
```

---

## Self-Review

**Spec coverage:** geometria low-poly sem textura (Task 1) · 2-3 aves circulando sobre o Shrine com banking (Task 2, `SEEDS`) · debandada na transição idle→raging, ease-out, não retorna (Task 2, `fleeStartRef`/`FLEE_SECONDS`) · sem diferenciação de espécie, sem hover/clique, sem ciclo dia/noite (nenhuma task introduz isso — fora de escopo respeitado) · integração em Experience.tsx (Task 3) · verificação tsc/eslint/screenshot (Task 3) — todos os pontos da spec têm task correspondente.

**Placeholders:** nenhum "TBD"/"similar a"/handler vazio — todo código é completo e literal.

**Consistência de tipos:** `createRaptorGeometry(): THREE.BufferGeometry` (Task 1) é o único ponto de import usado em `RaptorBirds.tsx` (Task 2) com a mesma assinatura; `RaptorBirds()` (Task 2) é importado com o mesmo nome em `Experience.tsx` (Task 3); `fleeStartRef: React.MutableRefObject<number | null>` é o mesmo tipo declarado e consumido entre `RaptorBirds` e `Raptor`.
