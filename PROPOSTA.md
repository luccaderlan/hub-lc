# Hub LC — proposta em construção

Atualizado em 13/10/2026. Este documento registra o conceito e as próximas etapas. A primeira versão local foi implementada; o README descreve as funções disponíveis e como executar. Escolhas sugeridas continuam abertas à discussão.

## Estado da primeira implementação

Aplicação local com áreas e conteúdos editáveis, quadro com colunas personalizáveis, biblioteca de livros físicos, anotações de texto e murais com post-its, cronômetro e sessões opcionais, evolução, aparência e backups em JSON. Os livros indicados foram incluídos sem status ou progresso pré-definidos, conforme solicitado.

Os dados ficam no navegador e endereço usados, com exportação e importação para preservação e transferência. Não há publicação nem sincronização entre dispositivos nesta etapa. O Dicionário DEV permite consultar no hub a cópia dos 330 registros importados do Notion em 13/10/2026, pesquisar seus campos, filtrar por categoria e abrir os originais. Sincronização automática, trilhas com sequências de conteúdos e recursos de revisão voluntária permanecem como próximas etapas.

Decisão de organização de 13/10/2026: livros ficam exclusivos da Biblioteca, com vínculos opcionais em Sessões e Anotações para registrar leituras. Destaques, nomes de livros e estatísticas de leitura saem da tela inicial e da Evolução. Áreas e conteúdos usam a hierarquia Divisão → Área → Conteúdo: TI reúne as áreas técnicas; Filosofia, Neurociência e Espiritualidade têm divisões próprias. Divisões adicionais podem ser criadas ao cadastrar ou editar uma área. A migração preserva os cadastros anteriores.

## Objetivo

Manter uma rotina de estudos e desenvolvimento pessoal, incluindo formação técnica, leituras e exploração de outros interesses. Ao abrir o hub, o usuário deve encontrar uma próxima ação possível, acessar suas anotações e retomar de onde parou, com liberdade para mudar de direção.

## Contexto confirmado

- Uso pessoal, principalmente no computador do escritório.
- Disponibilidade de pelo menos quatro horas por dia, em um bloco reservável. Os dias da semana ainda não foram definidos.
- Essa disponibilidade não constitui uma meta. Tempos, proporções por matéria, cronogramas e metas só existem se o usuário decidir defini-los; nenhum valor é preenchido automaticamente.
- Liberdade de escolha e um ambiente pessoal agradável são requisitos centrais. Planejamento e recursos de aprendizagem devem oferecer apoio sem impor uma rotina.
- Nome definido: Hub LC. O usuário aprovou a direção visual clean e direta; a paleta abaixo é uma sugestão em avaliação.
- Durante os próximos ajustes, apresentar no máximo uma imagem por resposta e evitar criar novas versões de protótipos visuais. Após avaliar a imagem, seguir para a construção conforme a orientação do usuário.
- Base atual: Java, Maven, Spring Boot, APIs e PostgreSQL.
- Interesse em ampliar a formação técnica e estudar Neurociência, Filosofia, Espiritualidade e Despertar espiritual.
- “Despertar” significa, para o usuário, despertar espiritual e “atingir conhecimentos guardados dentro de nós”. Essa descrição orienta uma área de leituras e reflexões pessoais; autores, tradições e caminhos permanecem abertos à escolha.
- Livros físicos: organizar leituras e estudar, com status, ponto de retomada, anotações, trechos e reflexões.
- Método anterior: videoaulas, anotações no caderno e exercícios de revisão.
- Dicionário existente no Notion, identificado como Dicionário DEV.
- Bora na Tech é apenas uma referência interna para o projeto. Não exibir sua marca, links, chamadas ou direcionamentos na interface.

## Estrutura proposta

### Hoje

Tela inicial com entradas para continuar, explorar e anotar, materiais e ponto de retomada de estudos. Livros e seus registros de leitura ficam fora dos painéis iniciais. O usuário pode escolher e reorganizar os painéis que deseja ver. Foco semanal, revisões agendadas, sugestões e resumo do tempo só aparecem quando houver dados ou quando forem ativados. Sugestões devem explicar seu motivo e permitir escolher outra atividade, dispensar ou ocultar. Deve ser possível começar sem configurar um planejamento.

### Trilhas e catálogo de interesses

Trilhas organizam conteúdos em uma sequência que pode incluir pré-requisitos. Cada conteúdo pode participar de mais de uma trilha, preservando seu histórico e evitando duplicações.

Estados sugeridos para trilhas: ativa, próxima, interesse futuro, pausada e concluída. O catálogo comporta muitos interesses e o usuário decide quantas trilhas acompanha. Agrupar alguns focos pode ser oferecido como organização opcional, sem limite, quantidade inicial imposta ou bloqueio de outros conteúdos. Pré-requisitos informam conexões e possíveis dificuldades, sem impedir a exploração.

Divisões agrupam áreas, que agrupam conteúdos: TI → Java → Collections; TI → PostgreSQL → Transações. Filosofia, Neurociência e Espiritualidade são divisões separadas. Nomes, agrupamentos e novos interesses são editáveis. Despertar espiritual pode ser um tema dentro de Espiritualidade, sem impor uma tradição ou uma sequência de estudos. Trilhas futuras podem combinar várias áreas, como Desenvolvimento de APIs com Java.

### Descobertas e conexões — primeira versão

Espaço próprio para capturar vídeos, artigos, podcasts e links que despertaram curiosidade. O fluxo começa com um link; título, primeira ideia e organização podem vir depois. Cada descoberta tem uma página para guardar o que chamou atenção, registrar pontos importantes com um momento ou referência, escrever anotações e murais e criar uma atividade no quadro quando houver uma ação a experimentar.

Uma descoberta pode se conectar a várias áreas, preservando um único cadastro e seus registros. Conexões confirmadas são escolhidas pelo usuário. Possíveis conexões são sugeridas por palavras do título, palavras-chave, pontos importantes e anotações: “memória” pode sugerir Neurociência; “API” pode sugerir APIs e oferecer o termo do Dicionário DEV. As áreas mostram essas descobertas com o rótulo de possível conexão enquanto o vínculo não foi confirmado. O dicionário também oferece o caminho de volta às descobertas em que um termo aparece.

Exemplo de uso: salvar um vídeo sobre aprendizado, registrar “08:42 — uma ideia que quero experimentar”, desenvolver uma reflexão em Anotações, confirmar a ligação com Neurociência e criar uma atividade no Quadro. Em vídeos do YouTube, o ponto abre a fonte no momento registrado. Capturas duplicadas abrem a descoberta já existente.

Nesta versão as sugestões usam regras de palavras completas aplicadas ao que a pessoa registrou. Não há leitura automática do vídeo, transcrição, resumo gerado ou classificação semântica por IA. Esse passo pode ser avaliado depois do uso da captura e das conexões. O acervo entra nos backups locais; excluir uma descoberta preserva as notas e atividades vinculadas.

### Documentos PDF — implementação em 14/10/2026

Seção própria para arquivos de estudo, conectada às áreas e conteúdos. A Biblioteca continua dedicada aos livros e Descobertas à captura de links. Artigos, apostilas, relatórios e materiais de análise entram em Documentos com upload local de até 25 MB por arquivo, título, assunto opcional e um espaço de objetivos, perguntas e ideias.

O leitor coloca o PDF ao lado dos registros de estudo, com página de retomada, anotações e trechos com referência de página, murais e atividades vinculadas. O documento também aparece na área escolhida. Arquivos ficam no navegador, em IndexedDB; os registros e vínculos ficam no armazenamento local já usado pelo Hub. O backup completo inclui os PDFs disponíveis e verifica o conteúdo na importação, inclusive para restaurar em um navegador vazio. A seção organiza a análise e o estudo pessoal; não realiza análise automática por IA ou OCR.

### Biblioteca e leituras

Área própria para livros físicos, ligada às áreas de interesse e às anotações. Cadastrar título e autor; edição, número total de páginas e temas são opcionais. O hub acompanha a leitura do exemplar físico e os registros pessoais.

Primeiros livros indicados pelo usuário:

- O espírito do guerreiro — Steven Pressfield.
- A arte da Guerra — Sun Tzu.

Preservar os títulos informados. Status de leitura, edição, total de páginas e ponto de retomada ainda não foram informados; não preencher esses dados por suposição. Usar esses livros como ponto de partida da biblioteca na implementação, sem gerar trechos, resumos ou interpretações atribuídos às obras sem consultar uma fonte. Cada exemplar terá seus próprios registros e poderá ser conectado a temas escolhidos pelo usuário.

Status sugeridos e editáveis: Quero ler, Lendo, Pausado e Lido. É possível acompanhar vários livros, retomar uma leitura ou encerrar sem obrigação de concluir. Página, capítulo e uma nota de retomada podem ser registrados separadamente; nenhum campo exige cronômetro, meta de páginas ou prazo. Percentual de leitura só aparece quando houver página atual e total informado e não representa domínio do assunto.

Cada livro reúne trechos transcritos com página, anotações, dúvidas e reflexões próprias. Distinguir a citação do autor da interpretação pessoal. Permitir vincular os registros a outras notas e temas, inclusive quando uma leitura atravessa áreas diferentes. O fluxo inicial é cadastrar o livro, guardar o ponto de retomada e registrar o que chamou atenção.

Para Filosofia, Espiritualidade e Despertar espiritual, oferecer escrita livre e perguntas opcionais, como “O que entendi?” e “Como isso se relaciona com minha experiência?”. Reflexões não precisam ter resposta certa, pontuação ou critério de domínio. Perguntas científicas, interpretações filosóficas e experiências pessoais preservam seu contexto e sua autoria.

### Quadro de atividades

Inspirado em um Issue Board, com colunas sugeridas e editáveis: Ideias, Em andamento, Para revisar e Concluído. A coluna Nesta semana pode ser adicionada se o usuário quiser planejamento semanal. Colunas, etiquetas e ordem podem ser personalizadas.

Cada cartão representa uma ação concreta, com objetivo, conteúdo, tipo (aula, leitura, exercício, projeto ou revisão), materiais e critério de conclusão. Estimativa de duração e prazo são opcionais, inicialmente vazios. Concluir uma atividade não implica dominar o conteúdo.

### Anotações

Documentos para texto, código, links e imagens e um espaço livre para post-its e conexões. O primeiro protótipo deve representar os dois formatos para avaliar sua importância na experiência; não é necessário reproduzir todas as funções do Miro. Notas podem se vincular a conteúdos, atividades, projetos e termos do dicionário, ou existir soltas e ser organizadas depois. A possibilidade de manter o caderno como parte do fluxo ainda deve ser discutida.

### Sessões e planejamento

O usuário pode estudar livremente, usar um cronômetro crescente ou definir uma duração por conta própria. Registro de tempo, duração desejada, alarmes e lembretes são opcionais. Não há duração, distribuição diária, proporção por matéria ou ciclo de pausas previamente preenchido. Configurações pessoais podem ser salvas, alteradas e removidas.

Quando houver registro de tempo, oferecer pausa, encerramento e edição manual. Uma sessão pode registrar matéria, conteúdo e tipo de atividade; o mesmo intervalo não deve ser contado duas vezes. Em atividades que cruzem matérias, escolher uma matéria principal ou distribuir explicitamente o tempo.

Ao encerrar: oferecer um registro breve do que foi feito, dúvidas e próximo passo, que pode ser ignorado. Salvar as anotações e permitir retomada mesmo sem preencher um formulário final. Metas só aparecem quando criadas pelo usuário, podem ser desativadas e não condicionam o acesso ao hub.

Pausas registradas não contam como tempo estudado. Não haverá sugestão automática de dividir as quatro horas disponíveis entre tipos de estudo. O planejamento pode ser usado somente como uma lista de intenções, sem horários.

### Evolução

Separar dedicação (tempo e distribuição por matéria, quando registrados), execução (atividades planejadas e realizadas, quando houver planejamento) e aprendizagem (exercícios, implementações e explicações produzidas). O usuário pode ocultar métricas e selecionar quais evidências considera úteis. Não exigir sequências de dias nem aplicar penalidades por ausência.

Porcentagem de tempo por matéria = minutos registrados nessa matéria / total de minutos estudados no período. Essa porcentagem descreve o histórico, sem impor uma proporção desejada. Sem registros suficientes, indicar ausência de dados; sem total positivo, não calcular a porcentagem. Progresso de uma trilha considera seu escopo definido e muda quando conteúdos são acrescentados. Domínio pode ter uma autoavaliação acompanhada de evidências, sem ser inferido automaticamente do cronômetro.

### Ambiente pessoal e liberdade

Permitir escolher tema claro ou escuro, cores, tamanho do texto, densidade, ordem dos painéis e formato de trabalho. Personalização pode acontecer aos poucos, sem um questionário obrigatório antes de estudar.

Oferecer modo de foco acionado pelo usuário para ocultar navegação, gráficos e outros painéis durante leitura, escrita ou exercícios. Não interromper uma sessão com animações ou notificações não solicitadas. As preferências visuais são hipóteses de design a validar com o usuário; não são prescrições de neurociência.

Engajamento deve vir da curiosidade, da facilidade de começar e da percepção de evolução. Ranking, recompensas aleatórias e penalidades por quebrar sequências não fazem parte da proposta. Eventuais conquistas só devem existir como recurso opcional, ligado a realizações compreensíveis.

### Identidade visual adotada — P3 / Dobra

Paleta fornecida pelo usuário: violeta LC #7554F6 nas ações principais, #6542E0 no hover, #5B35D5 no estado pressionado e #EEE9FF nas seleções. Turquesa #20C9BE no progresso, #087F78 para texto em fundo claro e #E1F8F5 nos apoios. Coral #FF8664 e #FFF0EA em detalhes de novidades e Descobertas.

Modo claro: fundo #F7F8FC, cards #FFFFFF, superfícies secundárias #EEF1F7, títulos/menu #18233B, texto #24324A, texto secundário #526079, legendas #627089 e bordas #DCE2ED. Modo escuro: fundo #101827, cards/menu #18233B, superfície elevada #22304A, texto #F3F5FC, secundário #B8C2D8, bordas #2D3A52, ações #A78BFA e progresso #35D9CC. Os estados de sucesso, aviso, erro e informação usam as cores da referência no modo claro e pares adaptados para leitura no escuro, sempre com texto.

A aplicação da marca segue a referência compacta enviada: símbolo colorido pequeno, “Hub LC” abaixo em branco, diretamente sobre o menu azul profundo e sem cartão branco. O símbolo usa o arquivo transparente original, enquadrado por CSS. O foco de teclado tem contorno violeta visível. Verde comunica estados confirmados, enquanto turquesa representa progresso e marca. A escolha de tema permanece livre e os dados existentes são preservados.

## Bases de aprendizagem e decisões de produto

Os estudos abaixo informam o projeto; eles não testaram este hub nem garantem um resultado individual. Autonomia e curiosidade possuem evidências experimentais em neurociência cognitiva; recuperação ativa e espaçamento também se apoiam na psicologia cognitiva. As aplicações de interface são inferências de projeto e precisam ser avaliadas no uso.

### Autonomia e escolha

Murty, DuBrow e Davachi (2015) encontraram melhor memória de objetos em uma tarefa que oferecia escolhas, inclusive quando a escolha não alterava o material apresentado. A neuroimagem associou o efeito a atividade antecipatória e interações entre regiões relacionadas à memória e à valoração. É um resultado de laboratório, não uma prova de que aumentar indefinidamente o número de opções melhora o aprendizado.

Aplicação proposta: deixar o usuário escolher conteúdo, formato e organização; permitir ignorar sugestões, remover metas e explorar sem bloqueios. Oferecer opções compreensíveis e personalização gradual.

Fonte: [The Simple Act of Choosing Influences Declarative Memory](https://pmc.ncbi.nlm.nih.gov/articles/PMC4405547/).

### Curiosidade

Gruber, Gelman e Ranganath (2014) encontraram melhor memória para respostas a perguntas de conhecimento geral que despertavam maior curiosidade, com associações em neuroimagem a circuitos de motivação e memória. O estudo não autoriza afirmar que uma cor, animação ou pontuação no aplicativo aumenta dopamina ou garante aprendizagem de programação.

Aplicação proposta: guardar perguntas reais, conectar dúvidas do estágio a conteúdos e explorar temas relacionados. Um exemplo é transformar “por que esta consulta ficou lenta?” em uma investigação com anotação, experimento e conclusão própria.

Fonte: [States of Curiosity Modulate Hippocampus-Dependent Learning via the Dopaminergic Circuit](https://pmc.ncbi.nlm.nih.gov/articles/PMC4252494/).

### Recuperação ativa

Karpicke e Blunt (2011) observaram benefícios de recuperar conhecimento de memória em comparação com outras condições de estudo de textos científicos, inclusive em questões de compreensão e inferência. A extensão para programação é uma aplicação proposta, não um resultado testado nesse estudo.

Aplicação proposta: oferecer perguntas pessoais nas notas, tentativa de explicar antes de revelar a resposta e exercícios escolhidos pelo usuário. No dicionário, permitir ocultar o significado e depois comparar a própria resposta. No quadro visual, permitir reconstruir um mapa de memória e conferir posteriormente. Esses recursos não condicionam o uso normal das notas.

Fonte: [Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping](https://pubmed.ncbi.nlm.nih.gov/21252317/).

### Revisitas espaçadas

Cepeda e colaboradores (2008) mostraram, em aprendizagem de fatos, que o intervalo de revisão mais favorável dependia do tempo até a avaliação. Isso apoia revisitar conteúdos em ocasiões diferentes, sem estabelecer um calendário universal ideal para toda pessoa e matéria.

Aplicação proposta: oferecer revisões voluntárias e histórico da última prática. Agendamento e sugestões de datas só após o usuário ativar esse recurso, com possibilidade de alterar, adiar ou dispensar. Nenhum intervalo de revisão é obrigatório ou configurado antecipadamente.

Fonte: [Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention](https://pubmed.ncbi.nlm.nih.gov/19076480/).

### Avaliação da experiência

No protótipo, verificar se o usuário encontra uma ação que deseja executar, consegue iniciar sem configurar metas, se sente à vontade para mudar de ideia e retoma o estudo com facilidade. Depois, avaliar o que consegue explicar e aplicar. Tempo de permanência no aplicativo, por si só, não demonstra aprendizado.

## Critérios de aceitação da liberdade

- Primeiro acesso sem metas, durações ou proporções por matéria preenchidas.
- É possível explorar, anotar e concluir atividades sem registrar tempo ou criar um plano.
- Quando o usuário define uma configuração de tempo, é possível editar, remover ou optar por não reutilizá-la.
- Sugestões e revisões podem ser ignoradas ou ocultadas sem punição ou bloqueio.
- Preferências visuais e organização dos painéis são preservadas entre acessos.
- Ausência de registros não aparece como fracasso ou como zero aprendizado.
- O espaço visual e o editor de texto podem ser usados sem vínculo obrigatório a uma matéria.

### Dicionário DEV

O banco consultado no Notion possui Palavra, Categoria, Significado, Comparação e Exemplo, além de campos de data e lugar.

Implementado: Notion como origem, com cópia local dos 330 registros consultados em 13/10/2026. É possível pesquisar Palavra, Categoria, Significado, Comparação e Exemplo; filtrar por categoria; abrir comparações e exemplos; e acessar o item original. Campos ausentes e entradas com títulos parecidos são preservados. A atualização desta cópia ocorre sob demanda, sem sincronização automática. Vínculos de termos com conteúdos e notas e uma integração contínua continuam como possibilidades futuras.

## Conteúdos iniciais sugeridos

O hub deve permitir identificar o que já foi estudado no Roadmap e começar por lacunas e aprofundamento, sem exigir reinício do zero.

- Java: orientação a objetos, Collections, Generics, exceções e Streams, conforme lacunas identificadas.
- APIs com Spring Boot: contratos HTTP, validação, tratamento de erros, persistência e testes.
- PostgreSQL: modelagem, consultas, joins e transações; aprofundamento posterior em índices e desempenho.
- Engenharia de software: estruturas de dados, testes, padrões, refatoração e arquitetura, organizados em etapas.
- Entrega e operação: Git, Maven, Linux, Docker, integração contínua e observabilidade, como futuras possibilidades.
- Exploração livre: frontend, Python, dados, IA, segurança ou outros interesses escolhidos pelo usuário.

Exemplo de prática integradora: uma API de tarefas de estudo com Java, Maven, Spring Boot e PostgreSQL, evoluindo por entregas pequenas. É uma atividade de aprendizado sugerida, não uma escolha aprovada de arquitetura do próprio hub.

## Como usar as referências

As referências ao Bora na Tech abaixo são registros internos de pesquisa. A interface do Hub LC não deve oferecer links, menções promocionais ou chamadas para acessar esse site.

- [Bora na Tech — Roadmaps](https://boranatech.com.br/roadmaps): referência para organização por carreira, linguagem, ferramenta e área.
- [Bora na Tech — Tecnologias por área](https://boranatech.com.br/tecnologias/por-area): descoberta de temas relacionados.
- [Bora na Tech — Projetos](https://boranatech.com.br/projetos): referência para atividades com entrega e critério de conclusão.
- [Bora na Tech — Cursos](https://boranatech.com.br/cursos): fonte de descoberta de materiais, sujeitos à avaliação de adequação.
- [Dev.java — Learn Java](https://dev.java/learn/): fonte oficial para conteúdos de Java.
- [Spring — Guides](https://spring.io/guides/): fonte oficial para consultar guias por categoria.
- [PostgreSQL — Tutorial](https://www.postgresql.org/docs/current/tutorial.html): fonte oficial de SQL e conceitos relacionais.
- [Dicionário DEV](https://app.notion.com/p/20cd91979b44489d96ffa4fe7b6c6c79?pvs=204): base pessoal existente.

Foram consultados o catálogo público de roadmaps, o mapa de áreas, as páginas de projetos e cursos. As páginas individuais de backend, engenharia de software e banco de dados não retornaram conteúdo legível pela ferramenta de pesquisa. A sequência de temas acima é uma proposta própria, não uma reprodução dessas trilhas. Não houve importação ou integração automática com o Bora na Tech.

Cada material cadastrado deve preservar sua origem, URL, formato, nível e observações pessoais. Conteúdo de referência não deve marcar assuntos automaticamente como aprendidos.

### Seleção e entrada dos conteúdos

Começar com um catálogo pequeno e curado. Usar o Bora na Tech somente como referência interna de organização e ideias; consultar documentação oficial para o conteúdo técnico, incluindo Dev.java, Spring, Maven e PostgreSQL. Videoaulas em português entram como apoio após verificar autoria, qualidade, acesso e compatibilidade com as versões em uso. Materiais pessoais e dúvidas do estágio têm espaço no mesmo catálogo.

Os livros físicos escolhidos pelo usuário são o ponto de partida da biblioteca. Para novos conteúdos de Neurociência, consultar pesquisas e fontes acadêmicas; para Filosofia, obras dos autores e referências acadêmicas; para Espiritualidade e Despertar espiritual, partir dos autores, tradições e perguntas que o usuário escolher. Identificar o tipo e a origem de cada material. Não preencher automaticamente essas áreas com uma doutrina, autores presumidos ou afirmações científicas sem fontes.

Cada conteúdo deve ligar um objetivo a uma referência consultada e a uma atividade prática. Preservar autor ou organização, URL, idioma, formato, nível, versão quando relevante, pré-requisitos informativos e data da última conferência. Não inventar referências ou atribuir a uma fonte explicações produzidas pelo hub.

Permitir adicionar links manualmente. Uma futura busca assistida sob demanda pode sugerir materiais e preencher metadados verificáveis, mantendo a decisão de incluir ou remover com o usuário. Não pressupor que o Bora na Tech tem uma API pública. Importação automática, acesso ao Notion e atualização de fontes exigem validação na implementação. Os conteúdos do protótipo continuam sendo exemplos, sem busca automática em funcionamento.

Resumos e exercícios elaborados para o hub devem ser identificados como conteúdo próprio e ligados às referências que os embasam. Preservar as notas pessoais quando uma referência externa for atualizada. Revisões e sugestões de próxima ação podem se apoiar no histórico e em dúvidas marcadas pelo usuário, sem criar metas de tempo.

## Etapas de construção sugeridas

1. Protótipo das entradas continuar, explorar e anotar, com quadro de atividades, editor de texto e espaço visual simples. Avaliar aparência, liberdade e retomada com o usuário.
2. Primeira versão utilizável com áreas de interesse, conteúdos, trilhas, biblioteca de livros físicos e retomada de leitura, quadro, anotações, sessões opcionais, planejamento opcional, estatísticas configuráveis e exportação dos dados.
3. Integração de consulta ao Notion, após validar o acesso necessário.
4. Recursos mais avançados do quadro visual, mapa de conhecimentos e revisões voluntárias mais elaboradas, conforme o uso real.

Persistência durável, recuperação dos registros e exportação fazem parte da primeira versão utilizável. Local de armazenamento, tecnologias, hospedagem, dias de estudo e trilha exploratória inicial ainda serão definidos.
