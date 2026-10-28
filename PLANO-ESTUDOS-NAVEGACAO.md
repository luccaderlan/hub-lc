# Estudos: catálogo e espaço do assunto

Implementado em 28/10/2026. Este arquivo conserva as decisões de planejamento; o estado entregue e a validação estão ao final.

## Posição

Separar a escolha do assunto do consumo do acervo. A entrada de Estudos deve responder “o que quero estudar?”; o espaço do assunto deve responder “com qual material vou trabalhar?”. A troca entre assuntos fica disponível por um navegador temporário, sem uma segunda coluna permanente.

O custo é acrescentar uma escolha antes de ver os materiais ao entrar em Estudos. Busca direta de assuntos e troca contextual reduzem esse custo. Não exigir uma página intermediária para cada nível da organização.

## Diagnóstico da versão atual

- `app.js`, função `areas()`: árvore, contexto do assunto, busca, filtro de coleção e quatro seções de materiais são montados juntos.
- `workspaceTabs()`: Assuntos, Links e vídeos, Documentos e Dicionário aparecem acima desse conjunto. Links e documentos também são categorias dentro do acervo, gerando duas formas de navegação visualmente concorrentes.
- `editorial.css`: a segunda lateral reserva 184,5 px, além de 28,8 px de intervalo, na regra desktop padrão. Retirá-la devolve essa faixa ao conteúdo; o ganho exato depende do breakpoint.
- O cabeçalho de Estudos e o cabeçalho do acervo se acumulam antes dos resultados. A árvore estreita quebra nomes e cria outra área de rolagem.
- O assunto atual é um filtro (`areaFilter`). `workspaceRoute()` identifica livros e anotações individualmente, mas Estudos permanece em `#areas`.
- A estrutura atual é coleção/área (`division`) → grupo opcional (`subgroup`, `studyGroups`) → assunto (`areas`). Não existe uma árvore arbitrária de subtemas com IDs próprios.

## Tela de entrada: catálogo

Manter o menu principal do Hub e dedicar a área central à organização dos assuntos.

1. Cabeçalho compacto: Estudos, busca de assuntos e ação Novo assunto.
2. Áreas como seções; grupos como subtítulos; assuntos como entradas clicáveis. Usar duas ou três colunas quando houver espaço e uma no celular.
3. Mostrar nome do assunto e, quando útil, quantidade de materiais. Evitar grandes capas, descrições repetidas e estatísticas sem relação com a escolha.
4. Expandir e recolher grupos no próprio catálogo; a busca encontra assuntos em grupos recolhidos e mostra o caminho completo.
5. Clicar no assunto abre diretamente seu espaço. Clicar na seta de um grupo apenas expande/recolhe, sem navegar.
6. Oferecer acessos secundários a Todo o acervo, Sem assunto e Dicionário, sem carregar seus conteúdos na entrada.

Exemplo de nomenclatura inicial: **Área: TI → Grupo: Fundamentos e ferramentas → Assunto: Java**. Usar “Área” de forma consistente na interface; hoje Área e Coleção designam o mesmo nível em vários pontos.

Não tratar assunto, matéria e tema como três níveis obrigatórios. Se “subtema” significar um conteúdo independente, como Java → Collections, isso exige uma decisão de modelo: nós com identidade, parentesco e regra para incluir ou não materiais descendentes. Recomendo separar essa evolução da primeira entrega visual; os grupos existentes já podem ser apresentados com clareza.

## Tela do assunto: acervo contextual

- Abrir dentro do Hub, na mesma aba, com endereço próprio e histórico do navegador.
- Exibir caminho compacto: Estudos / TI / Fundamentos e ferramentas / Java. Estudos retorna ao catálogo com busca e posição preservadas.
- Usar Java como título principal; a descrição só aparece se existir. Evitar outro grande título “Estudos” acima.
- Oferecer Trocar assunto, busca “Buscar em Java” e uma ação principal Adicionar material. Novo material herda o assunto, com possibilidade explícita de alteração.
- Reunir Tudo, Referências, Documentos, Links e vídeos e Anotações em uma única linha de filtros locais. Não repetir as abas globais de tipos de material nessa tela.
- Em Tudo, usar uma lista unificada com título, tipo e descrição curta; filtrar mantém a mesma estrutura. Validar essa apresentação antes de adicionar alternância entre lista e grade.
- Retirar o filtro de coleção de dentro do assunto. Trocar o contexto é função da navegação.
- Colocar exportação e edição do assunto em ações secundárias. Manter leitores e editores existentes, com retorno explícito ao assunto de origem.
- Manter a preferência atual do menu principal expandido/recolhido. Não recolher automaticamente a navegação geral ao entrar em um assunto.

Os acervos globais de documentos e links continuam acessíveis pelo caminho secundário Todo o acervo. Dicionário permanece como ferramenta global até haver um vínculo real entre termos e assuntos. Notas exclusivas de livros preservam a regra atual da Biblioteca.

## Navegador de assuntos

A referência fornecida parece mostrar um sumário de página. Aproveitar sua revelação temporária, mas usar este painel para trocar de assunto, deixando sua função explícita.

- Gatilho visível “Trocar assunto”, junto do caminho/título; evitar uma faixa invisível que só possa ser descoberta por acaso.
- Desktop: passar o mouse abre após aproximadamente 200 ms; clicar abre e mantém o painel disponível. Valores de atraso são hipóteses a validar.
- Painel sobreposto, com fundo opaco e largura inicial entre 280 e 320 px; não empurra nem redimensiona o acervo.
- Busca própria, grupos expansíveis, assunto atual destacado e acesso ao catálogo. A busca do painel não muda o filtro dos materiais.
- Manter aberto enquanto o ponteiro ou o foco estiverem no conjunto gatilho/painel. Usar pequena tolerância ao sair com o mouse, sem fechamento durante a travessia.
- Escape e clique fora fecham. Ao fechar pelo teclado, devolver foco ao gatilho; ao navegar, direcionar o foco ao contexto de destino.
- Teclado: botão nativo com Enter/Espaço e `aria-expanded`; navegação sem depender de hover. O foco não provoca troca de assunto.
- Celular: abrir por toque em painel modal, com botão Fechar, foco contido e fundo inerte. Não simular hover.
- Se houver edição pendente, aplicar a proteção existente antes de trocar de assunto. Abrir o painel não deve recriar o editor.

As regras de fechamento, travessia com o ponteiro e permanência seguem a orientação do [W3C sobre conteúdo em hover ou foco](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html). Isso não constitui validação completa de acessibilidade.

## Etapas de implementação propostas

1. **Catálogo e página contextual:** extrair seleção de registros e contagens da renderização; separar catálogo e acervo; reaproveitar IDs, vínculos e componentes de materiais. Definir uma função compartilhada para a inclusão de notas indiretas e impedir contagens duplicadas.
2. **Endereços e retorno:** adotar, por exemplo, `#areas` para catálogo e `#areas/<id>` para assunto, seguindo o padrão atual. Preservar busca, filtros e rolagem por contexto; atualizar atalhos da página inicial, sessões, criação, notas e documentos. Tratar assunto removido com mensagem e retorno seguro ao catálogo.
3. **Troca rápida:** implementar abertura por clique/teclado primeiro, depois hover no desktop e apresentação modal no celular. Fechar estado transitório ao navegar sem perder estado do acervo.
4. **Revisão visual e regressões:** ajustar densidade, títulos e espaçamentos; validar fluxos e atualizar os documentos de design somente após a implementação.

Na primeira entrega, evitar migração de dados. Se uma hierarquia real de subtemas for escolhida, planejar separadamente migração, backup/importação, mudança de parentesco e remoção de grupos. Sugestões automáticas de vínculo já aparecem em alguns resultados atuais: não convertê-las silenciosamente em associações confirmadas.

## Critérios de aceite

- Entrar em Estudos mostra organização de assuntos, sem renderizar o acervo abaixo.
- Um clique num assunto visível abre seu acervo; trocar para outro não exige voltar ao catálogo.
- O acervo tem um título principal e nenhuma árvore lateral permanente; abrir o painel não move o conteúdo.
- Busca do catálogo, busca do painel e busca dos materiais têm escopos independentes e estados vazios claros.
- Materiais sem assunto continuam alcançáveis. Uma busca sem resultado não sugere que o acervo foi apagado.
- IDs, arquivos locais, notas com vínculos indiretos, exportações e backups preservados; contagens e resultados usam a mesma regra.
- Recarregar, copiar endereço, Voltar e Avançar recuperam o assunto correto. Retorno de leitores/editores preserva o contexto e o rascunho.
- Validar mouse, teclado, toque, Escape, foco, abertura acidental e travessia do gatilho para o painel.
- Conferir temas claro/escuro e larguras de 320, 360, 768 e 1440 px, incluindo nomes longos e muitos assuntos.
- Rodar checagem de sintaxe, testes de dados/exportação e regressões de navegador de estudos, documentos, notas, captura e espaços após implementar.

## Prévia de planejamento

A prévia na conversa usa assuntos conhecidos do projeto e materiais ilustrativos para demonstrar catálogo → assunto → troca rápida. Ela não lê dados pessoais nem implementa os fluxos completos de cadastro, leitura, persistência ou navegação global.

## Entrega — 28/10/2026

- Catálogo e assunto separados, lista unificada, filtros locais, criação contextual e ações secundárias implementados.
- Rotas `#areas`, `#areas/<id>`, `#areas/~all`, `#areas/~unassigned` e `#areas/~division/<área>`; a última mantém atalhos de áreas da página inicial. Documentos e links também têm IDs em seus endereços.
- Histórico, recarga e retorno preservam contexto em sessionStorage. Assunto ausente/removido retorna ao catálogo com aviso.
- Painel por hover (200 ms), clique e teclado, fechamento tolerante (260 ms), Escape, clique fora e modal nativo no celular.
- Pertencimento de notas indiretas compartilhado com exportação; sem migração ou alteração do esquema de backup. Sugestões continuam explícitas.
- Testes dedicados e regressões descritos em README.md; resultados e limites da validação em AVALIACAO-UI-UX.md.

A prévia forneceu organização e interações; os conteúdos entregues vêm dos registros reais. Não foram introduzidos subtemas arbitrários, sincronização ou visualizadores de formatos que antes só permitiam download.
