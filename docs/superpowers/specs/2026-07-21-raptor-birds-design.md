# Gaviões/urubus circulando o santuário — design

**Data**: 2026-07-21
**Contexto**: um dos candidatos de "próximo passo" listados no checkpoint pós-Passo 16
(`santuario-retsu-retomada.md`). Escolhido pelo Vinicius em 21/07/2026.

## Objetivo

Aves de rapina (gaviões/urubus tratados como um único tipo visual — sem diferenciar
espécie) circulando em voo sobre o Shrine, reforçando a atmosfera do diorama. Elas
debandam definitivamente no início da tempestade do juramento (`stormPhase: 'raging'`).

## Componente

Novo arquivo: `frontend/src/components/scene/RaptorBirds.tsx`, montado em
`Experience.tsx` (perto de `<Shrine />`). Sem props, sem novo estado global —
só leitura de `useShrineStore(s => s.stormPhase)`.

## Geometria

Malha custom low-poly, sem textura: silhueta "boomerang" — duas asas triangulares
achatadas anguladas levemente pra cima nas pontas (V raso, clássico de ave planando)
+ corpo central fino. Uma única `BufferGeometry` construída uma vez (`useMemo`,
~12-16 triângulos) e reutilizada nas 2-3 instâncias (elementos `<mesh>` separados,
não `instancedMesh` — poucas aves não justificam). Material `meshStandardMaterial`
escuro/fosco (silhueta), sem mapa.

## Voo

2-3 aves, cada uma com seed própria (raio 8-14, altura 12-18, velocidade angular e
fase distintos), circulando em torno do centro da cena (eixo do Shrine, ~x=0, z=0).
Por frame (`useFrame`, imperativo, sem re-render):
- posição paramétrica: `x = cx + r*cos(ω*t+phase)`, `z = cz + r*sin(...)`, altura y fixa
  por ave (± leve bob senoidal).
- orientação: aponta na tangente do círculo (direção de movimento) + **banking**
  (roll no eixo de avanço, proporcional à curvatura/velocidade angular) para simular
  inclinação natural da curva.
- sem flap de asas — rapina real predominantemente plana enquanto plana.

## Reação ao juramento

Hook em `stormPhase`. Na transição `'idle' → 'raging'` (9 lâminas inspecionadas,
início da tempestade — momento em que a fauna foge da tormenta), cada ave entra em
modo fuga: mantém o círculo mas expande raio e altura rapidamente (ease-out, ~4-6s)
até sair da área visível. Depois disso o componente para de atualizar (ou fica
invisível) — não retorna, consistente com `stormPhase` nunca voltando a `'idle'`
na mesma visita.

## Fora de escopo

- Sem diferenciação visual entre gavião e urubu.
- Sem reação a hover/clique/seleção de irmão.
- Sem dependência do ciclo dia/noite (aves sempre visíveis até a fuga).

## Verificação

- `tsc --noEmit` e `eslint src --max-warnings 0` verdes.
- Screenshot da vista geral com as aves circulando visíveis.
- Screenshot/checagem via deep-link de QA forçando `stormPhase: 'raging'`
  (mesmo padrão já usado em `SandStorm.tsx`) confirmando que as aves debandam
  e não retornam.
