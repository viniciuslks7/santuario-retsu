# Clã Retsu — O Santuário do Deserto

Uma expedição 3D sobre memória, juramentos e o que resta depois do fim.
Explore nove lâminas, atravesse o portal, visite um arquivo em ruínas e encontre um oásis.
Quando o juramento está completo, o deserto revela uma décima história.

## Explorar

- Arraste para orbitar; use a roda do mouse ou dois dedos para aproximar.
- Escolha uma arma no cenário ou no catálogo para inspecionar e conhecer seu herdeiro.
- Na inspeção, arraste a arma para girá-la; `Esc` retorna ao santuário.
- Use **Lugares do mundo** para viajar ao portal, ao arquivo e ao oásis.
- Abra **As crônicas** para ler quatro capítulos, consultar o léxico e acompanhar a expedição.
- O progresso é salvo localmente no navegador. Nenhuma conta é necessária.
- Configure hora dourada, noite, dia, ciclo contínuo, qualidade e movimento reduzido.
- O som começa desligado. Cada herdeiro tem um tema musical procedural.
- Exporte a malha da arma como STL binário. A impressão pode exigir suportes e verificação no fatiador.

## Desenvolvimento

Requer Node.js 24 e npm.

```sh
cd frontend
npm ci
npm run dev
```

As histórias são arquivos estáticos carregados sob demanda. Não é necessário iniciar
um servidor de API. A pasta `backend` preserva o catálogo canônico original.
A versão pública usa somente `frontend/dist`.

```sh
npm run build
npm run preview
npm run lint
```

Para uma publicação em subdiretório, defina `VITE_BASE_PATH=/santuario-retsu/` durante o build.
Todos os modelos usam esse prefixo. Links diretos aceitam `?focus=lara` ou `?place=oasis`.

## Publicação gratuita

O workflow `.github/workflows/pages.yml` instala, valida, compila e publica pelo GitHub Pages
a cada push em `main`. Em Settings → Pages, a origem deve ser **GitHub Actions**.
Não requer chave de API, banco de dados, servidor pago ou domínio próprio.

## Verificação

`npm run check:experience` executa a revisão de navegador com Chrome no Windows.
As capturas locais ficam em `frontend/artifacts/review`, fora do Git.
O teste de publicação também verifica o build sob o prefixo `/santuario-retsu/`, com a API desligada.

## Tecnologia e direção artística

React, TypeScript, Vite, Three.js, React Three Fiber, Drei, GSAP e Zustand.
Arquitetura, dunas, materiais, água, partículas, armas e áudio são procedurais.
Pisos, escombros e elementos repetidos usam instâncias para reduzir chamadas de desenho.
O modo leve reduz efeitos e resolução; as crônicas continuam disponíveis quando WebGL falha.

As fontes consultadas e as decisões de projeto estão em [docs/research.md](docs/research.md).
