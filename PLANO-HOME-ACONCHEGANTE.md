# Plano — Home acolhedora e planejamento do dia

**Situação:** primeira entrega implementada localmente em 04/11/2026. Ver [registro de verificação](AVALIACAO-UI-UX.md) e [uso e dados](README.md). A [imagem aprovada](docs/referencias/home-aconchegante-aprovada.png) é a referência visual principal. Os dados, textos e horários nela são exemplos, não conteúdo inicial a ser cadastrado.

## Intenção

Evoluir Meu espaço para acolher a organização do dia e a retomada dos estudos, mantendo a sensação de calma e a identidade do Hub LC. Reunir informações já existentes sempre que possível: a home é uma visão integrada, não um segundo cadastro de atividades ou anotações. Não impor metas, indicadores de desempenho ou uma rotina ideal.

## Direção visual aprovada

Reproduzir com fidelidade a composição da imagem no desktop: menu lateral escuro com a marca e navegação existentes; saudação ampla em fonte serifada, com sublinhado violeta, seguida de “Seu dia, no seu ritmo.”; fundo carvão quente com iluminação suave e detalhe orgânico discreto; seção **Hoje** organizada em três colunas separadas por linhas sutis; e, abaixo, **De onde você parou**, com uma retomada horizontal e ação clara. Preservar as proporções, respiro, hierarquia, alinhamentos e contraste da referência. Usar as fontes, a marca e os ícones do projeto quando compatíveis. O efeito aconchegante deve acompanhar a interface, sem prejudicar a legibilidade.

A imagem é um conceito visual, não uma tela funcional: não usar a captura inteira como fundo nem transformar textos em imagem. Controles, textos e estados devem ser reais, acessíveis e adaptáveis. O detalhe orgânico pode ser recriado como elemento leve e discreto, sem comprometer desempenho ou legibilidade. No tema claro, criar uma interpretação coerente e acolhedora; a referência aprovada representa o tema escuro. Em telas pequenas, empilhar as três áreas na mesma ordem, com espaçamento e alvos de toque confortáveis, sem rolagem horizontal da página.

## Primeira entrega

### Saudação e navegação

- Manter a navegação atual e as preferências de nome, tema e data. A saudação deve refletir o horário local, sem fixar o nome ou a data do protótipo.
- Preservar o acesso às funções hoje disponíveis na home, incluindo filtros por assunto, anotações recentes e atalhos, reorganizando-os de forma discreta abaixo da área principal ou em acesso contextual existente. Não excluir conteúdo, filtros ou fluxos para reproduzir o recorte da imagem.

### Hoje: compromissos

- Criar, editar e excluir compromissos com título e data; horário, local e observação são opcionais. A home mostra os do dia local, em ordem de horário, com os sem horário em seguida.
- Permitir registrar compromissos para outras datas por meio do formulário, sem exigir um calendário completo. A home continua mostrando o dia atual.
- Oferecer uma ação discreta para adicionar e uma forma acessível de editar ou remover. Com nenhum compromisso, apresentar mensagem breve e ação de criação, sem exemplos fictícios.
- Não prometer avisos com a página fechada, sincronização ou integração com agendas externas.

### Hoje: atividades e foco

- Reutilizar as atividades do Quadro como fonte única. Permitir criar uma atividade para hoje e selecionar atividades existentes para o dia, sem duplicação. Marcar ou desmarcar a conclusão na home deve refletir o Quadro e vice-versa, respeitando suas colunas e regras atuais; definir uma associação explícita e reversível para as colunas de conclusão, sem presumir nomes personalizados. A programação para hoje não deve mudar automaticamente o prazo existente.
- Manter a data de planejamento separada do prazo, caso ambos existam. Atividades não concluídas permanecem registradas, sem reagendamento automático. Possibilitar retirar uma atividade do dia sem excluí-la do Quadro.
- Uma intenção livre ou foco diário pode ser opcional e discreto; não criar um sistema separado de metas, pontuações ou sequências. Priorizar o fluxo de atividades se houver conflito com a simplicidade da tela.

### Hoje: ideia para guardar

- Aproveitar a captura rápida existente: registrar uma ideia deve criar uma anotação normal, disponível em Anotações e no backup, sem duplicar conteúdo. Deixar claro como salvar e preservar rascunhos e tratamento de falhas já existentes.
- Vínculos com assunto, livro ou outros registros podem ser feitos posteriormente pelos fluxos existentes. Não exigir organização antes da captura.

### De onde você parou

- Reaproveitar a lógica atual de retomada e suas informações reais, sem simular estudo nem assumir que existe uma sessão. A ação principal abre o destino apropriado; quando não houver histórico, oferecer um caminho para explorar Estudos.

## Dados e compatibilidade

- O app armazena registros no navegador e arquivos no IndexedDB; não introduzir servidor, conta, sincronização ou serviço externo. As novas informações devem persistir após recarregar e integrar os dois tipos de backup, com validação e migração compatível com backups antigos, sem perda de IDs, vínculos, arquivos ou registros existentes.
- Reaproveitar os mecanismos existentes para falhas de armazenamento, confirmação de exclusão, rascunhos e recuperação. Não anunciar sucesso antes da gravação efetiva.
- Usar datas locais de calendário, evitando deslocamentos por UTC e tratando corretamente a mudança de dia. Compromissos sem horário não devem receber horário fictício.

## Fora da primeira entrega

Calendário mensal completo, recorrência, hábitos, notificações em segundo plano, integrações externas, finanças, IA, placares e metas obrigatórias. Revisitar essas funções apenas se a experiência real justificar. Não incluir configurações complexas de painéis nesta etapa.

## Critérios de aceite e verificação

1. Comparar capturas da implementação com a imagem aprovada no desktop, verificando composição, cores, hierarquia, tipografia e espaçamento; ajustar diferenças materiais. Não se limitar a adotar a paleta.
2. Verificar layout e uso em 320, 360, 768 e desktop, nos dois temas, com dados vazios, textos longos e listas maiores; garantir que a interface continue leve, legível e navegável.
3. Exercitar criação, edição e exclusão de compromissos; atividades criadas ou selecionadas, conclusão e retirada do dia refletidas no Quadro; captura e recuperação de anotações; retomada real de estudo; persistência e virada de data.
4. Testar restauração de backups antigos e novos, inclusive arquivos, e falhas de armazenamento. Preservar os fluxos existentes e rodar as verificações relevantes do projeto, inclusive `npm run check`, `npm test` e os testes de navegador pertinentes.
5. Verificar teclado, foco, nomes acessíveis, contraste, mensagens de erro, estados vazios e alvos de toque. Não depender apenas de cor para transmitir estado.

O [prompt de implementação](PROMPT-IMPLEMENTACAO-HOME.md) resume a solicitação e aponta para este plano e a referência aprovada.
