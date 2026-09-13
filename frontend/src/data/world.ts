export interface WorldChapter {
  id: string
  title: string
  eyebrow: string
  summary: string
  paragraphs: string[]
  quote: string
}

export interface WorldLocation {
  id: 'gate' | 'archive' | 'oasis'
  name: string
  subtitle: string
  description: string[]
  clue: string
}

export interface GlossaryEntry {
  term: string
  meaning: string
}

export const WORLD_CHAPTERS: WorldChapter[] = [
  {
    id: 'ash',
    title: 'O mundo que apodreceu',
    eyebrow: 'I · A queda',
    summary: 'Não houve um último clarão. Houve a lenta descoberta de que nada voltaria a florescer sozinho.',
    paragraphs: [
      'Primeiro, os rios perderam os peixes. Depois, as margens. Nas cidades, as pessoas continuaram marcando encontros sob relógios parados, como se a pontualidade pudesse persuadir o mundo a retomar seu curso. Quando as cinzas começaram a cair sem estação, já não restava um único lugar de onde se pudesse anunciar o fim.',
      'As florestas do Leste endureceram de pé. Nas árvores que ainda guardavam seiva, o líquido queimava a pele. As estradas tornaram-se leitos de pó atravessados por caravanas pequenas demais para serem exércitos e armadas demais para serem apenas famílias. Cada cantil passou a valer uma história; cada página legível, uma possibilidade de não repetir o desastre.',
      'Os futuros Arquivistas da Lâmina recolheram tratados, canções e cadernos sem capa. Descobriram que os mesmos conhecimentos capazes de cultivar a terra também podiam romper um corpo. A decisão de transformar estudo em violência não encerrou sua missão. Tornou impossível cumpri-la sem carregar a contradição para dentro de casa.',
    ],
    quote: 'A cinza cai sobre tudo. O que permanece precisa ser escolhido.',
  },
  {
    id: 'library',
    title: 'A Biblioteca do Fim',
    eyebrow: 'II · O abrigo',
    summary: 'Suspensa sobre runas de gravidade, a fortaleza conserva aquilo que o chão já não consegue sustentar.',
    paragraphs: [
      'À distância, a Biblioteca parece uma noite presa no céu. Suas fundações ciclópicas levitam sobre runas de gravidade, enquanto o deserto se move sob a sombra. O santuário oferece ao viajante um limiar: armas dispostas como testemunhas, areia atravessada pelo vento e a sensação de que uma casa pode ser também um aviso.',
      'Dentro da fortaleza, os Arquivistas preservam mais que técnicas de combate. Há nomes de cidades desaparecidas, receitas escritas para colheitas extintas, cartas cujo destinatário jamais chegará. Um livro inútil para o cerco ainda pode impedir que alguém seja reduzido ao número de dias que conseguiu sobreviver.',
      'O lugar permanece vivo porque mãos distintas sustentam necessidades distintas. Iwao guarda a entrada, Mizuki mantém água e jardins, os demais enfrentam ameaças que nenhuma muralha contém. Abaixo dos salões, Raizō medita junto à própria tempestade. A Biblioteca flutua, mas o peso de preservá-la repousa inteiro sobre seus herdeiros.',
    ],
    quote: 'Preservar um nome é recusar que a ruína tenha a última palavra.',
  },
  {
    id: 'anchors',
    title: 'O ouro e a ferida',
    eyebrow: 'III · O preço',
    summary: 'As Joias Douradas ancoram a sanidade. Liberar seu poder significa sentir a âncora queimar.',
    paragraphs: [
      'Cravadas nos pulsos dos herdeiros, as Joias Douradas não são ornamentos nem sinais de riqueza. Elas seguram a mente diante da carga que o conhecimento impõe. Quando giram, queimam a carne e liberam uma força capaz de quebrar as leis da física. Para quem observa de longe, o brilho parece uma bênção. Para quem o carrega, tem temperatura e cicatriz.',
      'Nem todo preço pode ser medido pela mesma ferida. Tsumugi devolve paz às mentes e perde idade no próprio corpo. Setsuna organiza a violência em instantes que seus irmãos não conseguem testemunhar. Raizō comprime o cataclismo numa disciplina solitária. O clã dispõe de muitas maneiras de sobreviver, e nenhuma delas garante permanecer inteiro.',
      'A pergunta atravessa os corredores mesmo quando ninguém a pronuncia: até onde proteger o mundo autoriza gastar quem o protege? Os irmãos respondem com vigílias, silêncios e pequenas tarefas. Esses cuidados não cancelam o sacrifício. Tornam visível a pessoa que a necessidade ameaça transformar em arma.',
    ],
    quote: 'Toda âncora salva alguma coisa. Toda âncora também prende.',
  },
  {
    id: 'heresy',
    title: 'Os que recusaram o círculo',
    eyebrow: 'IV · A ruptura',
    summary: 'Dois irmãos arrancaram as próprias âncoras. A Décima jamais recebeu uma.',
    paragraphs: [
      'Ranmaru e Kyōya chegaram juntos à heresia. Julgaram insensato preservar a história de um mundo morto e arrancaram as Joias Douradas com as próprias mãos. Sobreviveram à remoção e estabilizaram o poder pelo descontrole. Partiram levando a certeza de que os livros eram correntes; deixaram para trás irmãos incapazes de separar a traição da perda.',
      'Os dois vagam pelas ruínas com a promessa de incendiar a Biblioteca. Ranmaru dá peso à revolta, Kyōya lhe dá movimento. Sua liberdade depende de não retornar; seu ódio, de continuar olhando para a casa abandonada. A fortaleza os conserva no próprio registro, mesmo quando eles desejam apagar tudo o que ela guarda.',
      'Chosen ocupa outra distância. Encontrada respirando cinzas no colapso, foi acolhida sem receber as Joias: não trazia um passado de conhecimento a limitar. Os viajantes lhe deram um nome e, com ele, um vínculo. Quando nem Lara nem Iwao bastam, os portões se abrem para sua passagem. A espada fora do círculo convida a reconhecer a Décima antes de pedir que ela seja a última arma.',
    ],
    quote: 'Há quem abandone a casa. Há quem espere, à porta, ser reconhecido.',
  },
]

export const WORLD_LOCATIONS: WorldLocation[] = [
  {
    id: 'gate',
    name: 'Os Portões da Última Vigília',
    subtitle: 'A fronteira entre o refúgio e o cerco',
    description: [
      'O metal guarda marcas que a areia não conseguiu polir. Algumas chegam à altura de um rosto; outras começam acima do alcance de qualquer homem. Diante dos portões, a fissura de Iwao corta a pedra como uma decisão que ninguém ousou desfazer.',
      'Por este limiar entram pessoas carregando cantis vazios e saem irmãos carregando armas. Quando os portões se abrem para Chosen, até os defensores recuam. O mesmo gesto que oferece abrigo pode anunciar que todos os outros recursos acabaram.',
    ],
    clue: 'Siga o olhar além do círculo das nove armas. Nem todo nome foi gravado perto dos demais.',
  },
  {
    id: 'archive',
    name: 'O Arquivo das Vozes',
    subtitle: 'Onde o esquecimento encontra resistência',
    description: [
      'As estantes guardam tratados de guerra ao lado de cadernos de cozinha e listas de nascimento. A lombada mais gasta não indica o livro mais poderoso, mas o que alguém precisou abrir muitas vezes para lembrar como era uma vida que não começava pelo medo.',
      'Há páginas deixadas em branco para os que ainda estão do lado de fora. Os Arquivistas discordam sobre quase tudo, mas continuam preparando espaço. Uma biblioteca que já soubesse o nome de todos os seus mortos não seria um abrigo: seria um túmulo.',
    ],
    clue: 'Os epítetos contam como o mundo vê cada irmão. As lembranças revelam o que esse olhar deixa de fora.',
  },
  {
    id: 'oasis',
    name: 'Os Jardins de Mizuki',
    subtitle: 'Água doce sob um céu de chumbo',
    description: [
      'Nos jardins suspensos, os peixes luminosos desenham constelações que o céu já não mostra. O vento ainda traz cinza, mas encontra folhas úmidas, terra cuidada e a água viva do Cântaro do Oásis. Pela primeira vez em muitas léguas, o silêncio não parece uma ameaça.',
      'Mizuki conhece cada raiz. Haruki traz sementes das florestas petrificadas, e um pequeno canteiro recebe todas, inclusive as que jamais abrirão. O lugar não promete que o mundo será curado. Oferece a prova modesta de que alguma coisa pode continuar crescendo enquanto houver quem a regue.',
    ],
    clue: 'A água que mantém este jardim também defende a entrada. Procure a Sétima Irmã para conhecer as duas faces do oásis.',
  },
]

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'Arquivistas da Lâmina', meaning: 'Guardiões que transformaram conhecimento em técnicas de combate para defender a Biblioteca do Fim e aquilo que ela preserva.' },
  { term: 'Biblioteca do Fim', meaning: 'Fortaleza ciclópica do Clã Retsu, suspensa sobre runas de gravidade; abrigo, arquivo e último compromisso de seus herdeiros.' },
  { term: 'Joias Douradas', meaning: 'Âncoras de sanidade cravadas nos pulsos. Ao girar, queimam a carne e liberam poderes que rompem as leis da física.' },
  { term: 'Guerras das cinzas', meaning: 'Conflitos do mundo devastado nos quais Tsumugi salvou centenas de pessoas e perdeu, a cada uso da Gênese, parte da própria idade.' },
  { term: 'Vorpal', meaning: 'Crescente de sangue em alta pressão produzido pela Minazuki Sanguínea de Lara. Ao atingir um inimigo, alimenta a arma com o sangue absorvido.' },
  { term: 'A Gênese do Libertador', meaning: 'Exorcismo mental de Tsumugi que reescreve a loucura com paz e cobra um retrocesso físico de idade da própria curandeira.' },
  { term: 'Filhos da Heresia', meaning: 'Ranmaru e Kyōya, irmãos que removeram suas Joias Douradas, abandonaram o clã e desejam destruir a Biblioteca.' },
  { term: 'Os Portões Abertos', meaning: 'O último recurso do clã: liberar Chosen quando os exércitos que cercam a fortaleza excedem a força dos outros irmãos.' },
]
