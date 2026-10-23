# Histórico de alterações

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
