# Hub LC

Primeira versão local do hub pessoal de estudos, leituras e reflexões. Interface em português com temas claro, escuro e automático; identidade violeta, turquesa e coral conforme a paleta P3 / Dobra enviada pelo usuário.

## Executar

Com Node.js instalado, abra um terminal nesta pasta e execute:

```powershell
npm run dev
```

Abra http://127.0.0.1:4173. Mantenha o terminal aberto durante o uso. Não é necessário instalar dependências. A porta pode ser alterada pela variável `HUB_LC_PORT`; cada endereço tem seu próprio armazenamento no navegador.

## O que funciona

- Identidade visual: logo atualizada, fundos de leitura claros/escuros, violeta nas ações e no foco de teclado, turquesa no progresso e coral em Descobertas. Sucesso, aviso, erro e informação usam cores próprias acompanhadas de texto. As antigas opções de cores são migradas para a identidade LC, preservando o tema e os registros.

- Divisões de assuntos (TI, Filosofia, Neurociência e Espiritualidade): cada divisão reúne suas áreas e referências. TI agrupa Java, Maven, Spring Boot, APIs e PostgreSQL. Ao criar ou editar uma área, é possível escolher outra divisão ou escrever o nome de uma nova. Busca e filtros mantêm os conteúdos agrupados.
- Documentos: guardar um ou vários PDFs de até 25 MB cada, visualizar, abrir em outra aba, baixar e guardar página de retomada. Cada documento tem título editável, área opcional e espaço para objetivos, perguntas e ideias. PDFs aparecem na área escolhida, podem originar notas/trechos com página, murais e atividades com caminho de volta ao arquivo. Uploads repetidos são identificados pelo conteúdo e reutilizam o cadastro. Excluir o documento preserva notas e atividades, removendo seus vínculos.
- Descobertas: captura rápida de links de vídeos, artigos, podcasts e outros materiais. Título e primeira ideia opcionais; identificação do formato para plataformas de vídeo conhecidas. Cada descoberta reúne texto com salvamento ao escrever, palavras-chave, situação, pontos importantes com momento ou referência, anotações, murais e atividades vinculadas. Marcações como 08:42 e 1:02:10 abrem o YouTube naquele momento. Links repetidos abrem o cadastro existente.
- Conexões de descobertas: vincular várias áreas sem duplicar o conteúdo; sugestões por palavras completas do título, palavras-chave, pontos e anotações próprias. Descobertas aparecem nas áreas relacionadas com distinção entre vínculos confirmados e possíveis conexões. Termos encontrados podem ser consultados no Dicionário DEV, que também mostra as descobertas relacionadas. Não há leitura automática do vídeo, transcrição ou classificação semântica por IA nesta versão.
- Quadro: criar e editar atividades, arrastar entre colunas ou usar o seletor; personalizar colunas. Duração e prazo opcionais, vazios por padrão.
- Biblioteca de livros físicos: título, autor, status opcional, página, capítulo e total opcional; notas vinculadas. Os dois títulos informados estão cadastrados sem status imposto. Livros ficam exclusivos da Biblioteca, com vínculos opcionais em Anotações e Sessões para registrar leituras. Não aparecem como destaques na tela inicial nem como estatísticas na Evolução.
- Anotações: texto com salvamento ao escrever, trechos com página, dúvidas, reflexões e murais com post-its editáveis, cores e movimentação por arraste ou botões.
- Sessões: cronômetro opcional, pausa, retomada após recarregar, registro manual, edição e exclusão. Uma duração escolhida informa quando foi alcançada, sem interromper a sessão.
- Evolução: dedicação às áreas de estudo, distribuição de tempo e registros pessoais; métricas ocultáveis. Sessões e anotações vinculadas a livros ficam fora desses resumos.
- Preferências e backup: exportar JSON, importar após validação e confirmação, ajustar aparência.
- Dicionário DEV: cópia dos 330 registros consultados no Notion em 13/10/2026, com Palavra, Categoria, Significado, Comparação e Exemplo. Busca em todos esses campos, filtro por categoria, exibição gradual e link de cada registro para o original. Campos vazios e entradas parecidas são preservados. Não há sincronização automática; futuras alterações no Notion exigem uma nova atualização da cópia.

## Dados

Os registros ficam no `localStorage` e os arquivos PDF no IndexedDB deste navegador e endereço. Não há servidor de dados, conta, sincronização entre computadores ou envio dos arquivos/anotações a terceiros. O leitor usa a visualização PDF do navegador, com opção de abrir em outra aba ou baixar. Para transferir registros e PDFs, exporte o backup completo e importe no outro navegador. Limpar os dados do navegador remove o armazenamento local. Falhas de gravação são sinalizadas na interface, com acesso à exportação.

O backup completo inclui os PDFs disponíveis e pode ter até 256 MB para importação. Para acervos maiores, use “Só registros, sem PDFs” e baixe os documentos individualmente. Quando um arquivo não está disponível, o backup avisa que ele foi omitido; as notas e metadados continuam incluídos. O leitor oferece recuperar o PDF original sem perder seus registros. Backups anteriores sem documentos continuam compatíveis. A importação verifica o conteúdo dos PDFs antes de substituir os registros existentes.

Cadastros e backups anteriores recebem as divisões sem alterar IDs ou vínculos. As áreas técnicas iniciais passam para TI, Filosofia/Neurociência/Espiritualidade ficam em suas divisões correspondentes e outras áreas ficam em Outros até serem organizadas pelo usuário. O dicionário consultado no Notion está incluído no código local, em `data.js`; ele não substitui os registros pessoais nem faz parte do backup em JSON.

Descobertas e seus vínculos entram no backup JSON. Backups anteriores sem esse acervo continuam compatíveis. Excluir uma descoberta preserva as anotações e atividades, removendo apenas o vínculo; excluir uma área preserva as descobertas e seus demais temas.

Não há conteúdo remoto importado automaticamente. As referências iniciais são links oficiais; o Bora na Tech é apenas uma referência interna de concepção e não aparece na aplicação. A biblioteca não fornece textos completos dos livros.

## Verificar

```powershell
npm run check
npm test
```

Os testes cobrem dados iniciais sem metas, cálculo de pausas, distribuição de tempo, URLs, backups, migração das divisões, integridade da cópia do Notion, descoberta de conexões, marcações de vídeo e preservação de registros em falhas de validação. `tests/browser.cjs` verifica os fluxos, a separação de livros, as divisões, a consulta ao dicionário e o layout em desktop e telas menores; inclui `tests/discoveries.browser.cjs` para captura, notas, atividades, vínculos, duplicatas, backups e exclusões. Requer Playwright e Chrome instalados. Ajuste `HUB_LC_PLAYWRIGHT` e `HUB_LC_CHROME` se as dependências não estiverem nos caminhos indicados no arquivo.

As logos originais estão em `assets/`. A marca no menu segue a referência compacta: símbolo colorido de 48 px sobre o menu azul profundo, nome “Hub LC” abaixo em branco e sem cartão ou fundo branco. O símbolo usa a versão transparente horizontal enviada pelo usuário, com enquadramento por CSS e sem alterar os pixels originais. Em telas pequenas, a marca fica em uma linha com símbolo de 40 px. O template em `index.html` embute a imagem para funcionar no servidor local já existente, sem buscar arquivos externos. Ao substituir `assets/hub-lc-logo-horizontal.png`, execute `node embed-brand.cjs` para atualizar o template. As pilhas tipográficas priorizam Manrope/Inter e usam Segoe UI quando essas fontes não estão instaladas.
