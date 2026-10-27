# Pausas livres e puzzle — proposta

Registrado em 27/10/2026. A implementação inicial está concluída; a ampliação com jogos contra bots, descrita ao final, também foi implementada. O README e o CHANGELOG descrevem o resultado construído.

## Intenção

Oferecer uma brincadeira leve para os intervalos do estudo, conectada de forma opcional ao cronômetro de Sessões. O Hub existe para dar liberdade para aprender: a pessoa escolhe quando estudar, descansar, jogar e retomar.

O recurso deve permitir o uso pessoal do método Pomodoro sem exigir que a pessoa adote um método, configure uma rotina ou siga ciclos. A diversão pode despertar curiosidade e raciocínio, sem transformar o descanso em exercício escolar.

## Princípios confirmados com o usuário

- Toda configuração é livre e opcional, inclusive tempos de estudo e descanso.
- Nenhuma duração vem preenchida e nenhum ciclo é imposto.
- O cronômetro livre continua funcionando sem configuração adicional.
- Avisos informam; a pessoa decide o próximo passo.
- O puzzle é uma possibilidade de lazer, sem vínculo com o Dicionário DEV ou com o conteúdo estudado.
- Jogar não exige uma sessão anterior nem uma quantidade de estudo acumulada.
- A experiência deve ser leve no esforço para entender, na apresentação, no desempenho e na facilidade de sair.
- Não apresentar benefícios cognitivos ou de recuperação como resultados comprovados do jogo.

## Puzzle proposto: Desvio

Nome provisório e mecânica inicial para avaliação na construção.

Um pequeno tabuleiro reúne peças com caminhos retos e curvas. Clicar ou tocar em uma peça gira seu caminho em 90 graus. O objetivo é conectar uma entrada a uma saída. O trecho conectado à entrada recebe destaque visual; ao alcançar a saída, uma animação breve celebra a solução.

Não é necessário usar todas as peças. A pessoa pode pedir uma pista, trocar de tabuleiro ou sair com a rodada incompleta. Não há pontuação, vidas, ranking, sequência diária, recompensa aleatória ou dificuldade crescente obrigatória.

### Escopo inicial sugerido

- Tabuleiros de 3 × 3, com entrada e saída facilmente identificáveis.
- Pequeno conjunto de fases desenhadas e verificadas manualmente, todas solucionáveis.
- Poucas rotações necessárias; intenção de rodadas breves, aproximadamente 30–90 segundos, a validar no uso. Esse intervalo não é um prazo nem uma meta exibida.
- Controles: girar uma peça, pedir uma pista, abrir outro tabuleiro e sair.
- Uma pista orienta uma próxima ação sem penalidade.
- Ao resolver, exibir uma conclusão discreta; outra rodada só abre por escolha da pessoa.
- Preservar o tabuleiro ao sair e voltar, inclusive ao retomar o estudo.

Curiosidade visual e descoberta de uma solução sustentam a experiência. Perguntas, revisões de conteúdo e associações com materiais de estudo ficam fora desta proposta.

## Integração com Sessões

O ponto de entrada principal é a área de Sessões. O cronômetro atual permanece como base, com opções discretas para definir uma duração e, durante o descanso, um lembrete de retomada.

Não é necessário criar um modo separado chamado Pomodoro. Quem quiser praticar o método pode alternar estudo e descanso com os tempos que escolher. O produto não preenche 25/5 minutos, conta blocos, prescreve pausas longas ou inicia etapas automaticamente.

### Estudo

1. A pessoa inicia a sessão quando quiser, com ou sem duração desejada.
2. Se definir uma duração, pode alterá-la ou removê-la.
3. Ao atingir essa duração, o Hub informa discretamente e mantém a contagem do estudo até uma ação explícita. Não abre o jogo nem inicia uma pausa.
4. A pessoa pode continuar, pausar ou encerrar e registrar pelos controles da sessão.

### Pausa

1. Ao pausar a sessão, a contagem de estudo é suspensa.
2. Aparecem as possibilidades de retomar, abrir o puzzle e definir um lembrete de retomada. Nenhuma é obrigatória.
3. Sem lembrete, o descanso é livre e não exige contagem regressiva.
4. Com lembrete definido, a pessoa escolhe a duração e pode alterá-la ou removê-la. O tempo restante fica visível durante o jogo sem ocupar o centro da experiência.
5. Quando o lembrete chega, o Hub informa de forma discreta. O jogo permanece disponível e o estudo continua pausado.
6. Retomar o estudo exige uma ação explícita e preserva o tabuleiro para outra ocasião.

É possível permanecer em pausa sem jogar ou usar qualquer lembrete. O tempo configurado é apenas uma referência escolhida pela pessoa, sem cobrança quando ultrapassado.

### Acesso independente

O puzzle também deve ter uma entrada discreta fora da sessão; sua posição final na navegação será definida na construção. Abrir esse acesso não cria registro de estudo, não começa um cronômetro e não muda silenciosamente uma sessão em andamento.

Se houver estudo em andamento e a pessoa abrir o puzzle, manter o estado da sessão claro e oferecer a ação de pausar. A escolha de jogar, por si só, não autoriza alterar o cronômetro.

## Regras de tempo e preservação

- Descanso não entra no tempo estudado quando a sessão está pausada.
- O puzzle não acrescenta tempo nem produz registros no histórico de estudo.
- Nenhum aviso, solução de puzzle ou fechamento de aba retoma o estudo automaticamente.
- Recarregar a página preserva a sessão em andamento ou pausada, as escolhas de tempo e o tabuleiro.
- Um lembrete usa o horário de término registrado para manter a referência após recarregamento ou aba em segundo plano, sem depender somente de decrementos a cada segundo.
- Se o lembrete vencer com a página fechada, ao retornar a sessão permanece pausada. Não inferir que houve estudo nesse intervalo.
- O aviso da duração de estudo deve respeitar alterações e remoção da configuração, sem disparar repetidamente a cada atualização do relógio.
- Um acesso independente ao jogo não exige cadastro de assunto, livro ou atividade.
- Preservar a compatibilidade dos dados atuais; detalhar migração e inclusão dos novos dados no backup durante a implementação.

## Interface e acessibilidade

Usar a identidade visual existente, com pouco texto, movimento discreto e controles fáceis de alcançar no celular. O tabuleiro deve funcionar com clique, toque e teclado; arrastar não pode ser obrigatório.

Indicar entrada, saída, orientação das peças e resultado sem depender exclusivamente de cor. Cada peça deve comunicar sua posição e conexões para tecnologias assistivas. Respeitar a preferência de movimento reduzido e manter o foco ao atualizar o tabuleiro.

Textos possíveis, sujeitos a ajuste na construção:

- “Definir um tempo”
- “Abrir puzzle”
- “Lembrar de retomar”
- “O tempo que você escolheu passou.”
- “Retomar estudo”
- “Caminho completo”
- “Outro tabuleiro”

Evitar mensagens de obrigação, atraso, perda de desempenho ou necessidade de concluir uma rodada. Som e notificações externas não fazem parte do escopo inicial; nenhum deles deve surgir por padrão.

## Limites da primeira construção

Implementar o puzzle de caminhos e a integração opcional de pausa/lembrete, preservando o cronômetro livre. Priorizar arquivos locais e recursos nativos do projeto, sem IA, serviços externos, bibliotecas pesadas ou chamadas de rede para gerar fases.

Essa primeira construção não incluía outros jogos, geração automática de tabuleiros, coleções temáticas ou personalização visual. A ampliação implementada está descrita ao final deste documento; a liberdade de uso continua sendo requisito.

## Critérios para revisar a implementação

- É possível estudar e registrar uma sessão sem configurar tempo ou abrir o puzzle.
- É possível escolher, alterar e remover durações sem valores impostos.
- Atingir a duração desejada não interrompe o estudo nem inicia descanso.
- É possível pausar sem jogar e sem definir lembrete.
- O lembrete não fecha a rodada nem inicia o estudo.
- Retomar funciona com o puzzle incompleto e preserva o tabuleiro.
- O jogo pode ser aberto sem sessão e não altera uma sessão ativa silenciosamente.
- As fases têm solução, as pistas ajudam e a próxima fase depende de uma escolha.
- Os controles funcionam no teclado e no celular, com movimento reduzido quando solicitado.
- Atualização de página e retorno de uma aba inativa preservam os estados e a contagem correta.
- Pausas não entram no registro de estudo e nenhuma etapa cria estudo automaticamente.

O resultado esperado é uma possibilidade agradável dentro do Hub: fácil de experimentar, ignorar, interromper e retomar, sem conduzir a rotina da pessoa.

## Resultado da primeira implementação — 27/10/2026

Desvio foi implementado com seis tabuleiros fixos de 3 × 3, pistas, outro tabuleiro por escolha, controles de teclado e salvamento da rodada. O acesso fica apenas dentro de Sessões, sem exigir uma sessão iniciada. No celular, o estado da sessão e o lembrete aparecem junto do jogo.

O cronômetro continua livre. Duração desejada e lembrete não têm valores iniciais; avisos não mudam etapas. O estado da pausa, o horário de término do lembrete e o tabuleiro são preservados no navegador e no backup JSON, mantendo o esquema 1 e a chave existentes. Backups antigos recebem apenas os novos campos, sem alterar cadastros ou vínculos. Importar um backup continua pausando uma sessão ativa, conforme a proteção já existente no Hub.

A lógica das fases e pistas foi verificada por testes, incluindo todas as orientações dos caminhos. A validação em navegador cobre teclado, persistência, retorno de aba fechada, tempos escolhidos, backup, temas e telas de 320 a 1440 px. A duração de 30–90 segundos continua sendo uma hipótese para avaliar no uso, sem prazo exibido.

## Ampliação: jogos contra bots

Plano usado na implementação concluída em 27/10/2026. Ampliar Pausa e Puzzle com jogo da velha, dama e xadrez, preservando o Desvio e a integração existente com Sessões. A prioridade é o funcionamento correto dos jogos e a preservação dos dados e recursos atuais.

### Experiência

- Oferecer uma escolha entre Desvio e os três novos jogos dentro da área existente. Cada novo jogo será disputado contra um bot local, com dificuldade fácil, média ou difícil escolhida antes da partida.
- Mostrar a vez, jogadas disponíveis e resultado. Permitir iniciar outra partida e guardar uma partida por jogo para retomada ao sair ou recarregar.
- Controles por clique, toque e teclado; casas e peças identificáveis por tecnologias assistivas, com foco mantido e resultados anunciados sem depender apenas de cor. Adaptar os tabuleiros ao celular e respeitar movimento reduzido.
- Abrir ou terminar um jogo não cria sessão, muda o cronômetro nem retoma o estudo. O estado da sessão e o lembrete continuam disponíveis; o aviso não fecha a partida.

### Jogos e dificuldades

| Jogo | Regras | Comportamento planejado do bot |
| --- | --- | --- |
| Jogo da velha | Tabuleiro 3 × 3; três símbolos em linha vencem; tabuleiro cheio sem vencedor é empate. | Fácil pode errar; médio considera ameaças; difícil joga de forma ótima. |
| Dama | Variante brasileira em tabuleiro 8 × 8, informada na interface: captura obrigatória, maior captura, capturas em sequência e promoção a dama. | Busca de jogadas com profundidade crescente; o nível fácil também pode escolher jogadas menos fortes. |
| Xadrez | Regras completas, incluindo roque, en passant, promoção, xeque, xeque-mate e condições de empate. | Busca com limites de tempo e profundidade crescentes; o nível difícil não promete força de um motor profissional. |

As dificuldades precisam ser perceptíveis e não podem autorizar jogadas ilegais. O resultado deve ser reconhecido também quando o bot faz a última jogada. A promoção no xadrez deve permitir escolher a peça antes de concluir a jogada.

### Implementação e preservação

1. Acrescentar a seleção de jogos à tela existente, mantendo Desvio, controles de sessão e acesso independente.
2. Isolar regras, estado e decisão do bot da interface. Implementar e validar primeiro jogo da velha, depois dama e por fim xadrez.
3. Avaliar uma biblioteca local consolidada para as regras de xadrez, verificando licença, tamanho, integração e operação sem rede antes de adotá-la. Os jogos e bots não devem depender de serviços externos.
4. Executar buscas custosas fora da linha principal, com limite de tempo; descartar respostas antigas se a partida for reiniciada, trocada ou restaurada. Incluir eventuais novos arquivos locais na lista servida por `server.cjs`.
5. Validar os estados antes de persistir e incluir partidas nos backups completos e de registros. Backups antigos devem receber estados iniciais sem alterar cadastros, vínculos, sessão ou Desvio; dados inválidos não podem substituir os registros atuais. Preservar a proteção existente que pausa o cronômetro ao importar.

### Critérios de aceite da ampliação

- Os três jogos podem ser iniciados contra o bot nos três níveis, com apenas jogadas legais e indicação clara do resultado.
- Testes de regras cobrem vitórias, empates e casos especiais, incluindo captura obrigatória, maior captura e sequências na dama; roque, en passant, promoção e finais no xadrez. Testes do jogo da velha verificam que o nível difícil não perde.
- Reinício, troca de jogo e retomada não aplicam jogadas atrasadas do bot. A interface permanece utilizável enquanto ele calcula.
- Partidas sobrevivem a recarregamento e backup; importação antiga e dados inválidos são testados sem perda de registros. O Desvio, a pausa, os lembretes e o cronômetro continuam funcionando como antes.
- Validar os fluxos em navegador com teclado e toque, em telas pequenas e grandes e nos temas existentes; executar as verificações e suítes de regressão do projeto.


## Resultado da ampliação — 27/10/2026

Os três jogos estão disponíveis ao lado do Desvio, com bots locais e seleção explícita da dificuldade antes de cada partida. A pessoa começa com × ou com as brancas. Há uma partida por jogo, preservada em `games` no mesmo esquema e chave de armazenamento. Somente jogadas completas são persistidas; seleções e saltos provisórios podem ser refeitos ao voltar. O histórico é reexecutado e validado antes de aceitar uma restauração, impedindo posições ilegais ou jogadas após um resultado.

A dama usa captura para frente e para trás, lei da maioria sem prioridade para damas, damas voadoras, retirada das capturadas apenas ao fim da sequência e promoção somente na casa final. Empates incluem terceira repetição, 15 lances de cada lado só com damas sem captura e limites dos finais regulamentares (5/15 lances, ou 30/60 sem mudança de material, conforme a posição). A referência das regras é a IDF, seção 64, incluindo os artigos específicos da variante brasileira.

O xadrez usa chess.js 1.4.0 em cópia local (107.052 bytes no módulo ESM), BSD-2-Clause, com licença distribuída junto. Não exige instalação npm nem acesso a CDN para jogar. Roque, en passant, xeque/mate, afogamento, material insuficiente e repetição são tratados pela biblioteca. Terceira repetição e regra dos 50 lances encerram automaticamente a partida nesta experiência casual. A promoção depende da escolha explícita de uma das quatro peças.

As buscas usam Web Workers e aprofundamento progressivo com orçamento de aproximadamente 100/400/1.100 ms (fácil/médio/difícil), limitado também por profundidade. O nível fácil permite escolhas aleatórias legais; o jogo da velha difícil usa busca completa. Troca de jogo, saída, reinício e restauração invalidam e encerram buscas anteriores. Uma falha do worker permite tentar novamente sem perder a partida. Nenhum jogo altera a sessão, cria estudo ou retoma o cronômetro.

Os testes de regras e navegador incluem três dificuldades por jogo, invencibilidade do jogo da velha difícil, capturas e promoção da dama, geração de 8.902 posições de xadrez em três meios-lances, roque/en passant/promoção/finais, resultados do bot, teclado/foco/toque, estados persistidos, importações legadas e inválidas, respostas atrasadas, temas e telas de 320 a 1440 px. Os testes existentes continuam verificando Desvio e os demais espaços do Hub.
