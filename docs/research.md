# Pesquisa e decisões de projeto

Revisão realizada em setembro de 2026 com GPT‑6 Astra. As referências abaixo orientaram
as decisões; o cenário e a narrativa foram implementados especificamente para o Clã Retsu.

## Experiências interativas

- [Bruno Simon](https://bruno-simon.com/): referência para exploração orientada por curiosidade,
  controles acessíveis, configurações de qualidade e descobertas. Aplicação: catálogo sempre
  disponível, retorno ao santuário, destinos e diário. Sem copiar veículo, cenário ou identidade.
- [Unseen — Projects](https://unseen.co/projects/): referência para entrada contemplativa,
  convite à interação e experiência sonora opcional. Aplicação: abertura curta, som desligado
  por padrão e instruções junto à exploração.

## Desempenho e acessibilidade

- [React Three Fiber — Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance):
  reuso de recursos e instâncias reduzem trabalho repetido. Aplicação: pisos, caminhos,
  escombros e ornamentos em lotes; modo leve com resolução e efeitos reduzidos.
- [React Three Fiber — Canvas](https://r3f.docs.pmnd.rs/api/canvas): tratamento de falhas WebGL.
  Aplicação: mensagem de recuperação e entrada no diário mesmo sem cena 3D.
- [W3C — Animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html):
  movimento não essencial deve poder ser reduzido. Aplicação: preferência do sistema,
  controle manual, transições curtas, redução de efeitos e revelação sem tempestade.
- [WAI — Dialog modal pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):
  modal precisa gerenciar foco e Escape. Aplicação: diário usa dialog nativo; painéis
  de artefatos continuam não modais para permitir navegação no catálogo.

## Hospedagem gratuita

- [Vite — GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages):
  build estático, base compatível com subdiretório e publicação por Actions.
  Aplicação: VITE_BASE_PATH e assetUrl para todos os modelos e favicon.
- [GitHub — Creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site):
  Pages permite hospedagem gratuita de repositórios públicos no GitHub Free.
  Aplicação: publicação do dist, sem serviço de API ou domínio comprado.
- [GitHub — Pages REST API](https://docs.github.com/en/rest/pages/pages): configuração
  do site com build_type workflow e validação da URL publicada.

## Escolhas artísticas

A arquitetura mistura madeira vermelha envelhecida, pedra talhada e bronze.
O portal marca a chegada; a plataforma circular organiza os nove herdeiros;
caminhos ligam os lugares a essa composição. Telhados com beirais curvos,
lanternas e escombros dão escala ao visitante. Luz quente e sombras frias
separam os planos. O oásis introduz água e vegetação como contraponto às ruínas.

A narrativa preserva nomes, armas, citações e textos canônicos originais.
Novos fragmentos desenvolvem conflitos, vínculos e lugares. O diário reúne
os capítulos sem exigir que o visitante leia tudo antes de explorar.
