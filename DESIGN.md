# Direção visual — Hub LC

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
