# Direção visual — Hub LC

## Acesso e planejamento — aplicado em 09/11/2026

Acabamento das abas revisto: fundo transparente integrado à iluminação da home, seleção por sublinhado fino e hover por cor, com tipografia de 16 px no desktop. Ao fixar no topo durante a rolagem, um degradê com bordas suaves mantém a leitura; o fundo da página permanece contínuo na posição inicial.

A lateral mantém seis destinos: Meu espaço, Estudos, Documentos, Biblioteca, Anotações e Sessões. Meu espaço reúne Visão geral e Quadro de atividades; suas abas ficam **abaixo da saudação e do subtítulo**, antes do conteúdo, e permanecem visíveis ao rolar. Ambas as telas conservam o mesmo cabeçalho. O Quadro mantém colunas personalizadas, filtros, prazos opcionais e atividades sem data, com `#board` preservado; Meu espaço fica selecionado na lateral.

Estudos dá prioridade aos assuntos, com Links e vídeos e Todo o acervo em uma faixa discreta antes da busca. Sem assunto fica acessível na visão global do acervo. Documentos tem seleção própria na lateral e lista com Abrir documento e Baixar original. A ajuda de formatos é recolhível. A lista restaura filtros e rolagem ao retornar do leitor.

Esta decisão substitui a organização anterior que mantinha Quadro na lateral e documentos subordinados a Estudos. [Escopo e critérios](PLANO-ACESSO-DOCUMENTOS.md).

## Identidade compartilhada — aplicado em 09/11/2026

Todas as telas seguem a home: paleta neutra clara/escura, luz violeta com reflexo turquesa, lateral de mesma largura, marca, perfil e cabeçalho na mesma escala. Os tokens globais de `editorial.css` centralizam cores, contraste e ações; a classe `cozy-home` reúne a saudação de Meu espaço e a composição específica da Visão geral. Botões principais, campos, diálogos e abas compartilham tipografia, foco e acabamento. Estudos deriva suas superfícies desses tokens, mantendo a hierarquia entre fundo, seção e material. O destaque da última jogada nos jogos usa violeta suave.

A saudação pertence a Meu espaço e aparece nas duas abas; as três colunas continuam exclusivas da Visão geral. Catálogo, leitura, escrita, quadro, cronômetro e jogos mantêm suas estruturas próprias, com a mesma identidade visual. A regressão de identidade compara as cores, a iluminação e a navegação de cada tela com a home nos dois temas e em desktop/mobile.

## Luz central e base neutra — aplicado em 09/11/2026

A luz radial central mantém sua posição, tamanho e suavidade, agora em violeta dessaturado, com um reflexo turquesa discreto à direita. A home usa grafite no escuro e branco suave no claro; superfícies, divisórias e textos secundários acompanham essa base neutra, removendo o viés marrom da versão anterior. A composição aprovada e os detalhes verdes da marca continuam presentes.

## Verde da marca — aplicado em 09/11/2026

O verde turquesa da logo aparece como cor secundária, reutilizando `--progress`, `--progress-ink` e `--progress-soft` nos dois temas. Ele marca a linha de seleção da navegação, as folhas decorativas da home, o ícone e a ação de guardar ideias e as atividades concluídas. O campo de ideia recebe apenas 7% de verde no fundo, com borda e foco coordenados. O violeta continua nas ações principais, na seleção textual e na retomada.

## Meu espaço acolhedor — aplicado em 04/11/2026

A [referência aprovada](docs/referencias/home-aconchegante-aprovada.png) orienta esta home e prevalece sobre a escala compacta anterior: lateral de aproximadamente 282 px em 1672 px, conteúdo começando em x≈340, saudação serifada de até 80 px, “Hoje” e três colunas com divisórias em x≈738 e x≈1188. A retomada horizontal fica abaixo de uma linha em y≈664. As ações secundárias e registros antigos continuam após a área principal.

Os estilos novos são restritos a `body.cozy-home` e componentes `day-*`. Carvão quente, texto marfim, violeta suave e luz radial em CSS substituem o cinza frio somente na home. O ramo é um SVG decorativo leve, oculto da árvore acessível; não usa a captura como fundo nem contém texto. A ilustração é uma interpretação vetorial, não uma reprodução fotográfica das folhas. Georgia e DM Sans locais, marca original e ícones existentes foram preservados.

Até 780 px, as três áreas se empilham na ordem compromissos, atividades e ideia, com data local visível, campos de 16 px e controles de 44 px. Entre 781 e 1100 px, a captura ocupa uma segunda linha. Textos longos quebram e listas crescem naturalmente. Menus nativos `details` concentram ações auxiliares; o formulário da anotação sempre mostra uma ação explícita de salvar. Os dados de exemplo existem apenas nas fixtures de teste.

## Biblioteca e espaços individuais — aplicado em 28/10/2026

Biblioteca ocupa a terceira posição da lateral, com seleção, ícone próprio e acesso nos menus expandido, recolhido e móvel. Estudos abre o catálogo; assuntos usam filtros locais, e os acervos globais são acessos secundários. Cada espaço usa uma seção por vez; abas com rolagem própria mantêm a seleção visível no celular e o foco após a troca. Caminhos visíveis preservam o contexto ao abrir uma anotação pelo livro ou pela lista global.

A escrita preserva destaques e fica separada das imagens. Capas são opcionais, sem moldura vazia ou capa sintética no livro sem imagem. Miniaturas usam molduras uniformes com `object-fit: contain`; a ampliação permite consultar o original inteiro ou em tamanho natural. Legenda da fonte e comentário pessoal têm rótulos distintos. Grupos são rótulos opcionais; setas acessíveis definem a ordem manual.

`editorial.css` contém os estilos compartilhados dos espaços. O armazenamento e a validação complementar ficam em `spaces.js`, carregado pelo servidor local. A política de imagens permite URLs `blob:` locais para exibir os arquivos do IndexedDB. [Plano e decisões técnicas](PLANO-BIBLIOTECA-E-ESPACOS.md).

A aplicação segue as referências editoriais fornecidas em 27/10/2026: um caderno digital com fundo de papel, títulos serifados, divisores finos e espaço para o conteúdo. Violeta identifica ações; turquesa indica continuidade e salvamento; amarelo destaca uma ideia. O tema escuro preserva a mesma composição, com papel amarelo adaptado ao contraste.

## Tipografia e componentes

- Georgia, com alternativas serifadas do sistema, nos títulos e destaques. Não depende de uma fonte remota.
- DM Sans local para navegação, formulários, metadados e escrita. As fontes e suas licenças ficam em `assets/fonts/`.
- Ícones SVG locais, logo original e sublinhado irregular em CSS na saudação.
- Seções abertas substituem as caixas nos acervos e nas áreas de leitura e escrita. Cartões continuam delimitados onde a interação exige uma unidade: atividades arrastáveis, post-its e puzzle.
- Abas internas usam um sublinhado; formulários, diálogos, filtros, foco e áreas de toque compartilham os mesmos padrões.

## Conteúdo e conexões

A página inicial usa exclusivamente registros reais. Mostra a sessão ativa ou pausada antes do último registro, abre o assunto correspondente, filtra anotações por assunto e reúne atividades em andamento do quadro. A conclusão usa a associação explícita de colunas guardada em `dayPlanning`, sem interpretar nomes personalizados. Sem associação, a primeira marcação solicita a escolha.

Uma ideia solta exibe uma anotação recente. A captura rápida cria uma anotação normal, disponível na lista, na edição e nos backups. As notas vinculadas a referências, documentos ou descobertas também aparecem ao filtrar pelo assunto. As notas de livros permanecem fora da página inicial.

O nome fica em `prefs.displayName`, com Lucca como padrão compatível com backups anteriores. Uma conta futura poderá fornecer o nome ao perfil. O visual não implementa autenticação ou sincronização.

## Arquivos e responsividade

`styles.css` e `redesign.css` preservam a estrutura e os comportamentos dos espaços existentes, inclusive leitura, mural e puzzle. `editorial.css` aplica a identidade compartilhada e a composição da página inicial. `index.html` carrega essa camada depois dos estilos base; `games.css` vem a seguir e fica restrito aos jogos. `server.cjs` inclui os estilos na lista de arquivos públicos.

A escala de tipografia e espaçamento foi reduzida em aproximadamente 10% no desktop, mantendo as coordenadas nativas dos elementos, sem transformar a página. Campos e áreas de toque móveis preservam seus tamanhos.

A barra lateral alterna entre o menu completo e uma faixa de 64 px com ícones, nomes acessíveis e tooltips. A preferência fica na chave local `hub-lc:sidebar-collapsed`, separada dos registros. Alternar muda apenas o layout: não recria editores nem descarta o estado de trabalho. No celular, a navegação vira uma faixa horizontal, que também pode ficar só com ícones. A página inicial passa a uma coluna; a nota amarela e as atividades ficam lado a lado em larguras intermediárias. Campos mantêm pelo menos 16 px no celular e botões, inclusive a conclusão de atividades, têm alvos de pelo menos 44 px. Animações respeitam `prefers-reduced-motion`.

## Validação

```sh
npm run check
npm test
npm run dev
npm run test:browser
```

A suíte cobre a nova captura rápida, retomada, filtros por assunto e coleção, vínculos indiretos, nome, conclusão no quadro e persistência. As regressões verificam estudos, documentos, descobertas, livros, murais, marcações, cronômetro, puzzle, backup, teclado e foco, nos temas claro/escuro e em larguras de 320 a 1586 px. Capturas e relatórios são gravados em `test-results/` com dados isolados de teste.

## Jogos de pausa

Desvio, jogo da velha, dama e xadrez compartilham uma escolha discreta dentro de Pausa e Puzzle. Tabuleiros usam tons suaves, peças claras/escuras, contornos, pontos e rótulos de destinos legais. Não há pontuação, ranking ou avanço automático. As setas percorrem o tabuleiro; Enter escolhe a casa. O foco e os avisos acompanham cada jogada, e o estado da sessão permanece disponível junto ao jogo no celular. Os tabuleiros 8 × 8 se ajustam à largura disponível sem rolagem horizontal.

## Estudos: catálogo e assunto — 28/10/2026

`#areas` é o catálogo, organizado por área → grupo opcional → assunto. Grupos ocupam três colunas no desktop amplo, duas em larguras intermediárias e uma no celular. A busca por nome, área ou grupo ignora acentos e encontra assuntos recolhidos, mostrando seu caminho. Setas apenas expandem/recolhem; cada assunto é um link com destino próprio.

`#areas/<id>` abre o assunto com um título principal, caminho de retorno, busca contextual e uma lista contínua. Tudo, Referências, Documentos, Links e vídeos e Anotações filtram essa mesma estrutura. O cabeçalho concentra Adicionar material; edição e exportação ficam em ações secundárias. Não há árvore permanente, seletor de área ou abas globais de formatos no assunto. A preferência do menu principal permanece intacta. Todo o acervo e Sem assunto são acessos secundários; Documentos e Links e vídeos globais ficam em Todo o acervo.

Trocar assunto abre um painel opaco de 320 px, sobreposto ao conteúdo. Mouse abre após 200 ms e permite travessia com tolerância de 260 ms. Clique fixa o painel; Enter/Espaço abrem e focam a busca. Escape, Fechar e clique fora fecham; Escape e Fechar restauram o foco ao gatilho. Até 780 px, toque/clique abre um `dialog` modal nativo, que contém o foco e torna o fundo inerte. A busca do painel só atualiza seu conteúdo. Navegar fecha o painel e foca o título de destino. O assunto atual abre com seus ancestrais expandidos; a expansão temporária do painel não altera os grupos recolhidos do catálogo.

Busca, tipo e rolagem ficam por contexto em `hub-lc:studies` no sessionStorage; busca e posição do catálogo são independentes. Leitores de documentos, links e anotações recebem retorno explícito ao estudo de origem, inclusive após recarregar. Formulários mantêm a proteção existente contra descarte, incluindo tentativas de navegação pelo histórico.

`study-catalog.js` centraliza pertencimento e busca, compartilhando com Markdown a regra das notas indiretas. Notas de livro permanecem na Biblioteca. Um registro conta uma vez mesmo com vários vínculos; sugestões de links são identificadas e não viram vínculo salvo nem entram na exportação do assunto sem confirmação. Não há mudança no esquema nem migração dos dados nesta entrega. A hierarquia arbitrária de subtemas continua fora do escopo.
