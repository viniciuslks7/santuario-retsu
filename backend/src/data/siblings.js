// Lore do Clã Retsu — fonte: "As Crônicas do Clã Retsu: Da Cinza ao Sangue".
// Nomes dos irmãos sem nome nas crônicas foram batizados aqui (trocáveis):
// cada um carrega um significado ligado à sua natureza.

export const clanLore = {
  clan: 'Clã Retsu',
  fortress: 'A Biblioteca do Fim',
  prologue:
    'O mundo não acabou em espetáculo — ele apodreceu. Rios viraram lama tóxica, ' +
    'cidades viraram esqueletos de concreto e cinzas caem como neve o ano inteiro. ' +
    'Os Arquivistas da Lâmina transformaram conhecimento em violência para proteger ' +
    'a Biblioteca do Fim, sua fortaleza ciclópica que levita sobre runas de gravidade. ' +
    'Joias Douradas cravadas nos pulsos ancoram a sanidade de cada herdeiro — e queimam ' +
    'a carne quando giram, liberando o poder que quebra as leis da física.',
};

export const siblings = [
  {
    id: 'haruki',
    order: 1,
    name: 'Haruki Retsu',
    title: 'O Primeiro Irmão',
    epithet: 'A Dança da Natureza Morta',
    color: '#7cb342',
    hidden: false,
    goldenJewels: true,
    weapon: {
      name: 'A Adormecida',
      type: 'Nodachi selada',
      description:
        'Uma nodachi longa e assustadora carregada às costas — cabo coberto de teias ' +
        'de aranha, bainha selada. Ele se recusa a desembainhá-la.',
    },
    discipline: 'Combate primal desarmado · chakra puro',
    ultimate: null,
    personality:
      'Estatura assustadoramente baixa, trapos confortáveis e a expressão de uma ' +
      'criança que acabou de descobrir um inseto novo. Abraçou a ingenuidade num ' +
      'mundo que endureceu todos os corações.',
    lore: [
      'Ele caminha pelas florestas petrificadas do Leste conversando com árvores que ' +
        'sangram seiva ácida, sorrindo para o céu de chumbo. Sua ingenuidade não é ' +
        'fraqueza; é desapego.',
      'Em combate, a pureza vira ferocidade primal. Ele não usa o conhecimento dos ' +
        'livros: luta como os grandes predadores que o mundo perdeu. Punhos impulsionados ' +
        'por chakra puro afundam em armaduras de metal como se fossem argila. Ele esmaga ' +
        'crânios sem perder a doçura no olhar, acreditando estar apenas "brincando" na floresta.',
    ],
    quote: 'O aço é frio, corta o que deve crescer.',
    stats: { forca: 9, velocidade: 7, tecnica: 3, espirito: 8, sanidade: 9 },
  },
  {
    id: 'setsuna',
    order: 2,
    name: 'Setsuna Retsu',
    title: 'O Segundo Irmão',
    epithet: 'O Cronometrista do Fim',
    color: '#90caf9',
    hidden: false,
    goldenJewels: true,
    weapon: {
      name: 'O Corte Anterior',
      type: 'Katana de Iaijutsu',
      description:
        'Uma katana que nunca está suja de sangue: ela corta o inimigo no passado, ' +
        'garantindo que o sangue já tenha esfriado quando o golpe se concretiza no presente.',
    },
    discipline: 'Iaijutsu · equação matemática do tempo',
    ultimate: null,
    personality:
      'A estátua de gelo do clã. Alto, esguio, postura impecável — parece nunca ' +
      'respirar. Se o primeiro é o caos da natureza, ele é a ordem implacável do relógio.',
    lore: [
      'Ele não se move rápido; ele materializa o corte no tecido da realidade antes ' +
        'que o evento ocorra. O inimigo não vê o desembainhar nem o brilho da lâmina — ' +
        'de repente, o corpo se divide em vinte pedaços simétricos, desmoronando como ' +
        'uma torre de blocos.',
      'Ele não fala em batalha. Palavras levam tempo, e para ele, o tempo já acabou.',
    ],
    quote: 'Palavras levam tempo. O tempo já acabou.',
    stats: { forca: 6, velocidade: 10, tecnica: 10, espirito: 7, sanidade: 8 },
  },
  {
    id: 'lara',
    order: 3,
    name: 'Lara Retsu',
    title: 'A Terceira Irmã',
    epithet: 'A Sinfonia Escarlate',
    color: '#d32f2f',
    hidden: false,
    goldenJewels: true,
    weapon: {
      name: 'Minazuki Sanguínea',
      type: 'Espada hemomante',
      description:
        'Uma lâmina que bebe o sangue da própria Lara e se transforma em entidade de ' +
        'puro plasma escarlate. Cada corte no ar cria um Vorpal — lâmina crescente de ' +
        'sangue em alta pressão que dissolve tudo o que toca.',
    },
    discipline: 'Hemomancia · domínio cinético absoluto',
    ultimate: {
      name: 'Minazuki Sanguínea',
      description:
        'Ritualisticamente, ela corta a própria palma com a ponta da espada. O sangue ' +
        'não cai na terra seca — levita. A lâmina o bebe e cada vorpal que atinge um ' +
        'inimigo absorve o sangue dele, alimentando a arma num ciclo infinito de ' +
        'letalidade vermelha.',
    },
    personality:
      'O terror elegante. Postura impecável, traços suaves, quase maternais, e olhos ' +
      'que transmitem o vazio de um abismo escuro.',
    lore: [
      'Há um mito entre os sobreviventes: se você não consegue ouvir seus próprios ' +
        'batimentos cardíacos, é porque Lara Retsu está no mesmo ambiente que você.',
      'Décadas de estudo cinético deram a ela o silêncio impossível: ela caminha única ' +
        'e exclusivamente na ponta dos pés — o calcanhar nunca tocou o chão em batalha. ' +
        'Ela corre pela areia, quebra tábuas podres e salta entre escombros sem produzir ' +
        'um único decibel. O fantasma absoluto, dançando em meio à carnificina silenciosa.',
    ],
    quote: 'Se você ainda ouve o próprio coração, eu ainda não cheguei.',
    stats: { forca: 7, velocidade: 9, tecnica: 10, espirito: 9, sanidade: 7 },
  },
  {
    id: 'iwao',
    order: 4,
    name: 'Iwao Retsu',
    title: 'O Quarto Irmão',
    epithet: 'O Murro da Montanha',
    color: '#8d6e63',
    hidden: false,
    goldenJewels: true,
    weapon: {
      name: 'Pilar de Ferro',
      type: 'Espada colossal',
      description:
        'Uma lâmina de proporções grotescas, tão pesada e larga que parece mais um ' +
        'pilar de ferro do que uma arma. Um único golpe no chão cria fissuras sísmicas ' +
        'que engolem dezenas de inimigos.',
    },
    discipline: 'Destruição sísmica · magia bruta da força inegável',
    ultimate: null,
    personality:
      'Colossal. Ombros esculpidos em granito, semblante permanentemente fechado pela ' +
      'raiva. Odeia conversas, odeia os desvios mágicos das irmãs e, acima de tudo, ' +
      'odeia os tolos que desafiam o Clã Retsu.',
    lore: [
      'Ele é o sentinela. Não há espaço para sutilezas ou filosofias quando a ' +
        'Biblioteca do Fim é sitiada — é aí que ele entra.',
      'Quando ele ataca, a terra chora. Ele não precisa de ultimates complexas; sua ' +
        'presença física é a magia bruta da destruição inegável.',
    ],
    quote: 'Fale menos. A terra responde por mim.',
    stats: { forca: 10, velocidade: 4, tecnica: 5, espirito: 6, sanidade: 8 },
  },
  {
    id: 'tsumugi',
    order: 5,
    name: 'Tsumugi Retsu',
    title: 'A Quinta Irmã',
    epithet: 'O Tributo da Inocência',
    color: '#ce93d8',
    hidden: false,
    goldenJewels: true,
    weapon: {
      name: 'Fuso da Tecelã',
      type: 'Fuso ritual de fios de luz',
      description:
        'O instrumento com que ela entra no labirinto mental de qualquer pessoa — ' +
        'distorce a realidade na cabeça de um inimigo ou tece memórias de uma vida ' +
        'feliz que nunca existiu para confortar um moribundo.',
    },
    discipline: 'Magia da Mente · Tecelã de Memórias',
    ultimate: {
      name: 'A Gênese do Libertador',
      description:
        'O exorcismo mental supremo: arranca a loucura da alma e a reescreve com paz ' +
        'absoluta. O preço altera a causalidade do próprio corpo — cada uso causa um ' +
        'retrocesso físico de idade. Um dia, ela regredirá até deixar de existir, ' +
        'apagada da própria linha do tempo para que outros vivam.',
    },
    personality:
      'Já foi uma mulher de trinta e poucos anos com olhos cansados de sabedoria. ' +
      'Hoje, após salvar centenas nas guerras das cinzas, seus traços são os de uma ' +
      'pré-adolescente. Ela sabe o que a espera.',
    lore: [
      'Num mundo onde o apocalipse destruiu não apenas as cidades, mas as mentes — ' +
        'cultistas insanos, traumatizados crônicos, mentes corrompidas pelo medo — ela ' +
        'é a única verdadeira curandeira.',
      'Seus irmãos a protegem com as próprias vidas, tentando evitar que ela precise ' +
        'se sacrificar mais uma vez.',
    ],
    quote: 'Eu lembro por você. É só isso que eu sei dar.',
    stats: { forca: 2, velocidade: 5, tecnica: 9, espirito: 10, sanidade: 6 },
  },
  {
    id: 'raizo',
    order: 6,
    name: 'Raizō Retsu',
    title: 'O Sexto Irmão',
    epithet: 'A Tempestade Enclausurada',
    color: '#fdd835',
    hidden: false,
    goldenJewels: true,
    weapon: {
      name: 'Amarelo-Raio',
      type: 'Lâmina de relâmpago perpétuo',
      description:
        'Não é aço comum: é relâmpago condensado que estala e vibra incessantemente. ' +
        'Ele a afia contra pedras magnéticas numa busca doentia pela perfeição atômica do corte.',
    },
    discipline: 'Fúria elétrica focada · meditação agressiva',
    ultimate: null,
    personality:
      'O medo guardado a sete chaves. Não fala com os irmãos, não recebe visitantes, ' +
      'não senta à mesa. Vive em meditação constante e agressiva no nível mais profundo ' +
      'da Biblioteca do Fim.',
    lore: [
      'O ar ao redor de seus aposentos cheira eternamente a ozônio e cabelo queimado.',
      'Os sobreviventes sussurram sobre ele, mas nenhum o viu batalhar — e o clã ' +
        'prefere que continue assim. No dia em que ele desembainhar a Amarelo-Raio em ' +
        'campo aberto, a fúria elétrica fritará o oxigênio num raio de quilômetros. ' +
        'Ele não é um espadachim; é um cataclismo sob rédea curta.',
    ],
    quote: '— (do fundo da clausura, apenas o estalo da lâmina responde)',
    stats: { forca: 9, velocidade: 9, tecnica: 8, espirito: 9, sanidade: 4 },
  },
  {
    id: 'mizuki',
    order: 7,
    name: 'Mizuki Retsu',
    title: 'A Sétima Irmã',
    epithet: 'O Oásis de Sangue',
    color: '#4dd0e1',
    hidden: false,
    goldenJewels: true,
    weapon: {
      name: 'Cântaro do Oásis',
      type: 'Urna d’água viva',
      description:
        'A fonte da água serena dos jardins suspensos. Num movimento suave dos pulsos, ' +
        'a água se ergue em chicotes pressurizados — lâminas líquidas capazes de fatiar ' +
        'carne e ossos com a facilidade de quem poda folhas.',
    },
    discipline: 'Magia da Água · criação e sustento da vida',
    ultimate: null,
    personality:
      'Uma obra de arte fora de lugar entre assassinos amaldiçoados. Beleza ' +
      'estonteante, cabelos negros que quase tocam o chão, pele que reflete a palidez ' +
      'da lua morta. O coração vibrante do clã.',
    lore: [
      'No apocalipse, onde a terra é seca e o vento corta como vidro, ela é a deusa da ' +
        'criação. É por causa dela que a Biblioteca do Fim possui jardins suspensos ' +
        'florescentes, lagos com peixes luminosos e água potável e doce.',
      'Ser gentil não significa ser fraca: quando invasores ultrapassam os portões, ' +
        'ela não pisca.',
    ],
    quote: 'A mesma água que rega o jardim lava o sangue dos portões.',
    stats: { forca: 5, velocidade: 7, tecnica: 9, espirito: 9, sanidade: 9 },
  },
  {
    id: 'ranmaru',
    order: 8,
    name: 'Ranmaru Retsu',
    title: 'O Oitavo Irmão',
    epithet: 'Filho da Heresia',
    color: '#ff7043',
    hidden: false,
    goldenJewels: false,
    weapon: {
      name: 'Dogma Partido',
      type: 'Kanabō de escombros',
      description:
        'Um porrete brutal forjado de escombros do mundo antigo — a antítese da lâmina ' +
        'erudita do clã. Força bruta como única verdade.',
    },
    discipline: 'Caos desancorado · poder estabilizado pelo descontrole',
    ultimate: null,
    personality:
      'Inseparável do Nono. A pressão do apocalipse e a carga psíquica da Biblioteca ' +
      'envenenaram seu espírito: concluiu que preservar a história num mundo morto é tolice.',
    lore: [
      'Em um ato de heresia máxima, ele e o irmão arrancaram com as próprias mãos as ' +
        'Joias Douradas dos pulsos. Sobreviver à remoção das âncoras quase fritou seus ' +
        'cérebros, mas estabilizaram o próprio fluxo de poder através do descontrole.',
      'Hoje são párias: forças independentes da natureza, instáveis, rebeldes e ' +
        'impiedosos, aguardando nas sombras a chance de provar que a loucura é mais ' +
        'forte que os livros.',
    ],
    quote: 'A única verdade do apocalipse é o caos.',
    stats: { forca: 8, velocidade: 6, tecnica: 4, espirito: 7, sanidade: 3 },
  },
  {
    id: 'kyoya',
    order: 9,
    name: 'Kyōya Retsu',
    title: 'O Nono Irmão',
    epithet: 'Filho da Heresia',
    color: '#ab47bc',
    hidden: false,
    goldenJewels: false,
    weapon: {
      name: 'Liturgia Rasgada',
      type: 'Kusarigama de corrente herética',
      description:
        'Foice e corrente que se movem como o pensamento de um louco — imprevisíveis, ' +
        'sem forma de escola, sem respeito pelos manuais que o clã jurou preservar.',
    },
    discipline: 'Caos desancorado · liberdade como doutrina',
    ultimate: null,
    personality:
      'A outra metade da heresia. Onde Ranmaru é o peso do caos, Kyōya é seu ' +
      'movimento errático. Rebelde, instável, impiedoso.',
    lore: [
      'Eram irmãos inseparáveis — e juntos chegaram à conclusão de que o Clã Retsu ' +
        'estava errado. Abandonaram a fortaleza e arrancaram as próprias âncoras de sanidade.',
      'Vagam pelo mundo em ruínas odiando a tradição do clã, esperando a oportunidade ' +
        'de queimar a Biblioteca do Fim com tudo o que ela guarda.',
    ],
    quote: 'Livros queimam. A loucura, não.',
    stats: { forca: 7, velocidade: 8, tecnica: 5, espirito: 7, sanidade: 2 },
  },
  {
    id: 'chosen',
    order: 10,
    name: 'Chosen',
    title: 'A Décima Irmã',
    epithet: 'A Criança da Cinza e do Corte',
    color: '#e0e0e0',
    hidden: true,
    goldenJewels: false,
    weapon: {
      name: 'A Sem-Nome',
      type: 'Espada denteada e brutalizada',
      description:
        'Uma lâmina sem escola, sem polimento e sem piedade — denteada pelo uso, ' +
        'cravada na areia fora do círculo do santuário. Quem a encontra, encontrou Chosen.',
    },
    discipline: 'Pressão espiritual bruta · prazer puro do combate',
    ultimate: {
      name: 'Os Portões Abertos',
      description:
        'Quando os exércitos do apocalipse são numerosos demais até para a Hemomancia ' +
        'de Lara ou a fúria de Iwao, o clã abre os portões e a solta. Ela não se ' +
        'defende; ignora a dor e a transforma em adrenalina.',
    },
    personality:
      'O apocalipse encarnado em forma humana. Sem técnica refinada, sem magias, sem ' +
      'silêncio: onde ela pisa, o chão estilhaça, e sua pressão espiritual põe os ' +
      'fracos de joelhos.',
    lore: [
      'Ela não nasceu na segurança do mundo antigo. Nasceu na lama tóxica, sob o céu ' +
        'de chumbo, no exato momento em que o mundo colapsou — encontrada respirando ' +
        'cinzas, viva apenas pela força descomunal do próprio espírito.',
      'O clã a acolheu, mas ela nunca foi uma deles. Não recebeu as Joias Douradas: ' +
        'não havia conhecimento a limitar numa mente vazia de passado. Foram os ' +
        'viajantes das terras desoladas que lhe deram um nome — e, ao batizar um ' +
        'demônio, criaram um vínculo inquebrável.',
      'Ela é o caos que o apocalipse gerou e a única arma que o Clã Retsu teme mais ' +
        'do que respeita. Pois no fundo, todos sabem: Chosen é o apocalipse.',
    ],
    quote: 'Você me deu um nome. Agora aponte.',
    stats: { forca: 10, velocidade: 8, tecnica: 2, espirito: 10, sanidade: 1 },
  },
];
