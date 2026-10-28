# Direção visual — Hub LC

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

A página inicial usa exclusivamente registros reais. Mostra a sessão ativa ou pausada antes do último registro, abre o assunto correspondente, filtra anotações por assunto e reúne atividades em andamento do quadro. A conclusão de uma atividade usa a coluna Concluído; em quadros sem uma coluna de conclusão reconhecida, a atividade continua editável pelo título.

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

`#areas/<id>` abre o assunto com um título principal, caminho de retorno, busca contextual e uma lista contínua. Tudo, Referências, Documentos, Links e vídeos e Anotações filtram essa mesma estrutura. O cabeçalho concentra Adicionar material; edição e exportação ficam em ações secundárias. Não há árvore permanente, seletor de área ou abas globais de formatos no assunto. A preferência do menu principal permanece intacta. Todo o acervo e Sem assunto são acessos secundários; Documentos e Links e vídeos globais ficam em Todo o acervo. Dicionário continua global.

Trocar assunto abre um painel opaco de 320 px, sobreposto ao conteúdo. Mouse abre após 200 ms e permite travessia com tolerância de 260 ms. Clique fixa o painel; Enter/Espaço abrem e focam a busca. Escape, Fechar e clique fora fecham; Escape e Fechar restauram o foco ao gatilho. Até 780 px, toque/clique abre um `dialog` modal nativo, que contém o foco e torna o fundo inerte. A busca do painel só atualiza seu conteúdo. Navegar fecha o painel e foca o título de destino. O assunto atual abre com seus ancestrais expandidos; a expansão temporária do painel não altera os grupos recolhidos do catálogo.

Busca, tipo e rolagem ficam por contexto em `hub-lc:studies` no sessionStorage; busca e posição do catálogo são independentes. Leitores de documentos, links e anotações recebem retorno explícito ao estudo de origem, inclusive após recarregar. Formulários mantêm a proteção existente contra descarte, incluindo tentativas de navegação pelo histórico.

`study-catalog.js` centraliza pertencimento e busca, compartilhando com Markdown a regra das notas indiretas. Notas de livro permanecem na Biblioteca. Um registro conta uma vez mesmo com vários vínculos; sugestões de links são identificadas e não viram vínculo salvo nem entram na exportação do assunto sem confirmação. Não há mudança no esquema nem migração dos dados nesta entrega. A hierarquia arbitrária de subtemas continua fora do escopo.
