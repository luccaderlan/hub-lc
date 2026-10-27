# Histórico de alterações

## 27/10/2026 — jogos contra bots em Pausa e Puzzle

- Escolha entre Desvio, jogo da velha, dama brasileira e xadrez, com três dificuldades e uma partida salva por jogo. O acesso e o resultado preservam o estado da sessão.
- Regras locais separadas da interface: maior captura e sequências na dama; xadrez com roque, en passant, promoção escolhida e finais, usando chess.js 1.4.0 sob BSD-2-Clause. O jogo da velha difícil joga de forma ótima.
- Bots em Web Workers com limites de busca, cancelamento ao sair/reiniciar/restaurar e rejeição de respostas antigas. Interface por clique, toque e teclado, com destinos e resultados acessíveis, em ambos os temas.
- Backups completos e só de registros incluem as partidas. Validação reexecuta as jogadas e rejeita dados ilegais antes de substituir registros; backups antigos recebem jogos sem partidas. A proteção de pausa ao importar continua ativa.
- Testes de regras, persistência, promoção, sequências de captura, três níveis, bots atrasados, teclado/toque e layout de 320 a 1440 px, além das regressões existentes.

## 27/10/2026 — escala compacta e barra lateral recolhível

- Tipografia, dimensões e espaçamentos do desktop reduzidos em aproximadamente 10%, preservando campos de 16 px e alvos de toque móveis. A página não usa zoom ou transformação que altere as coordenadas do mural e da seleção de texto.
- Barra lateral com alternância entre menu completo e faixa de 64 px com ícones, rótulos acessíveis e tooltips, inspirada nas referências do ChatGPT. No celular, a faixa horizontal também alterna para ícones.
- A escolha persiste ao trocar de seção e recarregar, sem modificar o backup dos registros. Alternar não recria o editor, preservando o texto e o estado dos espaços de trabalho.
- Verificação de teclado, foco, persistência e navegação em 12 telas, temas claro/escuro e larguras entre 320 e 1440 px nos dois estados da barra.

## 27/10/2026 — caderno digital editorial

- Visual das referências aplicado à navegação, estudos, documentos, links, livros, dicionário, quadro, anotações, murais, sessões, puzzle e preferências: papel claro, títulos serifados, linhas finas e menos caixas; versão escura correspondente.
- Página inicial com saudação, assuntos e coleções reais, retomada da sessão ou assunto, anotações recentes, ideia amarela e atividades em andamento. Banner e frases promocionais removidos.
- Captura rápida salva como anotação normal. Retomada abre o assunto ou a sessão ativa; anotações podem ser filtradas pelo assunto, incluindo vínculos via referências, arquivos e descobertas. Concluir na página inicial move a atividade para a coluna Concluído do quadro.
- Nome Lucca centralizado no perfil e editável nas preferências, com compatibilidade com backups antigos. Preparação do campo de nome para integração futura com conta.
- Camada `editorial.css` servida e carregada em todas as telas, com controles móveis, teclado e foco preservados. Testes de integração dos novos atalhos e regressão do acervo existente.

## 27/10/2026 — Pausa e Puzzle

- Desvio reúne seis tabuleiros 3 × 3 com entrada/saída, pistas sem penalidade, giro por clique/toque/teclado e conclusão discreta. Outra rodada depende de escolha; o tabuleiro é preservado ao sair, recarregar ou retomar o estudo.
- Acesso apenas dentro de Sessões, sem exigir ou criar registros de estudo. Uma sessão ativa permanece contando até a pessoa pausá-la explicitamente.
- Pausas livres com lembrete opcional, editável e removível. Durações começam vazias; os avisos de estudo/pausa não trocam de etapa, não fecham o jogo e não se repetem a cada atualização.
- Lembretes usam horário de término persistido, incluindo retorno de aba inativa ou fechada. Descanso nunca aumenta o tempo estudado. No celular, o estado e o lembrete aparecem também junto do tabuleiro.
- Backup inclui tabuleiro e novos campos do cronômetro; migração mantém o esquema e os registros existentes. O módulo local `puzzle.js` não usa bibliotecas, rede ou conteúdo do dicionário.
- Testes de lógica, solução/pistas, migração, persistência, backup e acessibilidade; revisão do puzzle em dois temas entre 320 e 1440 px e execução da suíte de regressão dos demais espaços.

## 26/10/2026 — estudos organizados e espaço de leitura

- A opção Tudo em Estudos apresenta Referências, Documentos, Links e vídeos e Anotações em seções consecutivas, com títulos, contadores e separadores. Os filtros individuais continuam disponíveis.
- Cards de estudo compartilham espaçamento, hierarquia de metadados, títulos e resumos limitados na listagem e rodapés alinhados. A grade se adapta a três, duas ou uma coluna e mantém botões de toque de 44 px no celular.
- Documentos permite filtrar pela extensão dos arquivos cadastrados, em conjunto com busca e assunto. A seleção permanece após recarregar e pode ser removida em Limpar filtros.
- O Dicionário DEV permite adicionar palavras com categoria, significado, comparação, exemplo e fonte opcional, além de excluir termos locais ou importados. As mudanças participam das conexões com descobertas e são preservadas no backup, sem alterar o Notion.
- Cada livro abre um espaço próprio com capa tipográfica, progresso, retomada por página e capítulo, próximo passo, caderno livre com salvamento automático, anotações por página e murais de post-its com cores, vínculos, zoom e tela ampliada.
- O espaço de leitura mantém registros separados por livro; notas abertas pela área geral oferecem um caminho de volta ao livro. Backup e exportação Markdown preservam o caderno e a retomada, com compatibilidade com registros antigos.
- Novos testes verificam persistência, isolamento entre livros, inclusão e exclusão de palavras, filtros e os layouts de leitura nos temas claro/escuro entre 320 e 1440 px.

## 23/10/2026 — atualização após a versão inicial

Esta atualização reúne as alterações locais que ainda não estavam no GitHub. A base de comparação é o commit `c5c235e` (`Initial Hub LC local application`).

### Organização dos estudos e navegação

- O menu passou de dez destinos principais para cinco: Meu espaço, Estudos, Quadro, Anotações e Sessões. Preferências continua acessível.
- Estudos reúne Assuntos, Links e vídeos, Documentos, Livros e Dicionário; Evolução passou a ser uma aba de Sessões. Os endereços anteriores continuam funcionando.
- Áreas e divisões passaram a aparecer como assuntos e coleções, preservando IDs e vínculos. A tela reúne referências, documentos, links confirmados ou sugeridos e anotações do assunto selecionado.
- Coleções são opcionais. É possível renomeá-las ou uni-las, além de mover assuntos pelo formulário de edição.
- O menu Adicionar centraliza os cadastros; busca, filtros por formato, contagem de resultados e limpeza de filtros facilitam encontrar materiais.

### Documentos e backup

- Além de PDF, agora é possível guardar TXT, MD, CSV, DOC/DOCX, XLS/XLSX, PPT/PPTX, ODT, RTF, EPUB, PNG, JPG/JPEG e WebP, individualmente ou em lote, com limite de 25 MB por arquivo.
- PDF, texto UTF-8 e imagens têm prévia local. Markdown aparece como texto; HTML não é executado. Office, ODT, RTF e EPUB podem ser baixados para abertura em aplicativo compatível.
- O módulo `documents.js` identifica os formatos, verifica assinaturas básicas e tamanho e calcula SHA-256 para identificar duplicatas.
- O backup completo passou a incluir os novos formatos e a verificar assinatura, tamanho e hash ao restaurar os arquivos. PDFs e backups anteriores continuam compatíveis.
- Originais permanecem no IndexedDB; metadados, vínculos e anotações permanecem nos registros locais.

### Exportação Markdown e vídeos

- Novo módulo `study-export.js` e ações Exportar MD na barra superior e nas anotações.
- Exportação de todo o acervo ou por assunto, coleção, anotação, documento, link/vídeo ou livro; filtros opcionais por período e por materiais com registros de estudo.
- Versão completa ou síntese por trechos dos textos pessoais, com indicação de abreviação. O arquivo reúne fontes, notas, pontos de vídeos, post-its, conexões e sessões conforme o recorte.
- Anotações podem receber uma URL de vídeo e um momento diretamente, sem exigir cadastro prévio em Links e vídeos. YouTube abre no momento informado; os campos acompanham backup e Markdown.
- A síntese não usa IA, não interpreta nem transcreve os arquivos ou vídeos e não envia registros a terceiros.

### Anotações e murais

- Selecionar texto abre um menu contextual para destacar em amarelo, verde ou rosa e remover destaques. As marcações acompanham a edição e são preservadas no backup.
- Murais ganharam dimensões ajustáveis, zoom, enquadramento, navegação pelo fundo e modo ampliado, com saída por Escape.
- Post-its podem ser redimensionados por arraste, por medidas ou pelo teclado. Dimensões e posições são preservadas.
- Conexões podem ser criadas por arraste, com prévia da linha e destaque do destino, ou pela alternativa de seleção por clique. Vínculos duplicados e referências inválidas são rejeitados.
- Exclusão direta com confirmação em anotações, post-its e demais registros; excluir um post-it remove também suas conexões.

### Interface, sessões e acessibilidade

- Nova composição da tela inicial, ícones SVG, temas claro/escuro e estilos em `redesign.css`.
- Fontes Sora e DM Sans servidas localmente, com licenças OFL incluídas. O servidor passou a permitir explicitamente os novos módulos, estilos e fontes.
- Destaque radial acompanha o ponteiro na tela inicial; a preferência de movimento reduzido desativa os efeitos animados.
- Sessões passou a mostrar campos à esquerda, relógio analógico sincronizado com o contador e controles à direita, com histórico abaixo e disposição empilhada no celular.
- Link para pular ao conteúdo, indicação da seção atual, histórico Voltar/Avançar, foco preservado em filtros e navegação e avisos para tecnologias assistivas.
- Formulários abrem no primeiro campo, direcionam o foco aos erros, protegem rascunhos ao cancelar e bloqueiam envio repetido ou fechamento durante a gravação. Confirmações de exclusão começam em Cancelar.
- Navegação móvel com rolagem própria, campos de pelo menos 16 px e botões principais com altura mínima de 44 px.
- Falhas de armazenamento mantêm aviso persistente, proteção ao sair e possibilidade de exportar os dados ainda na memória.

### Verificação e documentação

- `npm run check`: checagem de sintaxe de `app.js`, `data.js`, `documents.js`, `study-export.js` e `server.cjs`.
- `npm test`: 22 testes de dados, validação, compatibilidade de backups, destaques, murais, formatos e exportação Markdown.
- `npm run test:browser`: executor integrado para fluxos gerais, interface, usabilidade, anotações, descobertas, documentos e estudos, usando Playwright e Chrome em contextos isolados.
- Cobertura de temas claro/escuro, desktop e telas menores, teclado, foco, histórico, persistência e falhas de armazenamento. O relatório local fica em `test-results/browser-report.json`, fora do versionamento.
- README atualizado; decisões visuais em [DESIGN.md](DESIGN.md) e avaliações da interface em [AVALIACAO-UI-UX.md](AVALIACAO-UI-UX.md).

### Recursos que continuam pendentes

- Autenticação pessoal, persistência no servidor e sincronização entre máquinas ainda não estão implementadas. Os dados continuam no navegador, com transferência por backup.
- Inspeção da hospedagem, armazenamento privado remoto, configuração de domínio/HTTPS e migração continuam descritos em [CONTEXTO-HOSPEDAGEM.md](CONTEXTO-HOSPEDAGEM.md).
- Não há prévia local dos formatos Office/ODT/RTF/EPUB, transcrição automática, interpretação por IA ou sincronização automática com o Notion.
- A validação automatizada usa Chrome; não constitui certificação de acessibilidade nem verificação em Safari, Firefox ou dispositivos físicos.
