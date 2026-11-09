# Acesso a documentos e planejamento pessoal

Proposta aprovada e implementada em 09/11/2026. A posição final das abas segue a correção do usuário: **abaixo da saudação e do subtítulo**, antes do conteúdo.

## Organização aprovada

| Destino principal | Conteúdo |
| --- | --- |
| Meu espaço | Visão geral e Quadro de atividades, em abas permanentes. |
| Estudos | Catálogo por assunto; atalhos discretos para Links e vídeos, Todo o acervo. |
| Documentos | Todos os documentos, busca, filtros, envio, leitura e download do original. |
| Biblioteca | Livros e seus espaços individuais. |
| Anotações | Notas, escrita e murais existentes. |
| Sessões | Cronômetro, histórico, Pausa e Puzzle e Evolução. |

A lateral continua com seis destinos. Preferências mantém seu acesso próprio.

## Meu espaço e Quadro de atividades

A saudação personalizada e o subtítulo aparecem primeiro. Imediatamente abaixo, as abas **Visão geral | Quadro de atividades** aparecem nas duas telas e acompanham a rolagem. A seleção da lateral permanece em Meu espaço.

Visão geral conserva compromissos, Para hoje, captura de ideias, retomadas e conteúdos pessoais. Quadro de atividades continua sendo uma tela completa para planejamento geral: atividades e projetos com ou sem prazo, sem data diária obrigatória, colunas personalizadas, pesquisa e filtro por assunto. O quadro não fica subordinado ao bloco Para hoje. Planejar para um dia continua sendo uma escolha independente do prazo.

A rota `#board` foi preservada, assim como criação, edição, exclusão confirmada, arraste, movimentação por seletor e configuração da conclusão. Navegação e novo layout não alteram os registros existentes.

## Estudos e acervo

Antes dos assuntos, uma faixa de links discretos oferece **Links e vídeos** e **Todo o acervo**. Documentos tem acesso direto na lateral, evitando outro cartão repetido no catálogo. Sem assunto continua acessível em Todo o acervo e pela rota existente `#areas/~unassigned`.

A organização de assuntos, grupos e áreas, troca rápida de assunto, filtros por tipo, criação contextual, sugestões e retorno ao estudo de origem continuam funcionando. Não foram criados novos níveis de organização.

## Documentos

Documentos abre diretamente `#documents`, com seleção própria na lateral. A antiga faixa de abas globais de Estudos não é exibida nessa tela. O cabeçalho oferece Adicionar arquivos; a ajuda de formatos pode ser expandida. Busca, filtros e contagens existentes continuam disponíveis.

Cada item permite **Abrir documento** e **Baixar original**. Baixar conserva os bytes e o nome do arquivo, sem abrir o leitor. Arquivo ausente encaminha à recuperação pelo original, preservando os metadados. Voltar do leitor à lista restaura busca, assunto, formato e rolagem, inclusive após recarregar o leitor. Entrar pelo menu global começa sem herdar o assunto de outra tela.

O upload iniciado em uma lista filtrada oferece o assunto preenchido em um formulário explícito e permite alterá-lo ou organizar depois. Sem filtro, o acesso direto ao seletor de arquivos permanece. Upload múltiplo, deduplicação, formatos e limites existentes são mantidos. O leitor conserva prévias, retomada do PDF, escrita, notas, murais, atividades e download. O retorno contextual ao assunto permanece independente do retorno à lista global.

## Preservação e limites

IDs, chave `hub-lc:v1`, esquema dos backups e arquivos no IndexedDB não mudam. A memória de retorno da lista fica no sessionStorage, separada dos dados pessoais. Biblioteca e anexos exclusivos de livros/notas conservam seus escopos. Exportações Markdown, backups e vínculos existentes são preservados.

A entrega continua local, sem sincronização ou novas integrações. Os conteúdos das imagens de planejamento eram ilustrativos; a aplicação utiliza somente os registros reais do navegador.

## Verificação

- `npm run check`: sintaxe dos módulos.
- `npm test`: regras e dados, incluindo backups e vínculos.
- `node tests/browser.cjs --navigation-only`: seis destinos, ordem visual saudação → abas → conteúdo, teclado, abas durante a rolagem, quadro geral sem data, histórico/recarga, atalhos de Estudos, download byte a byte, recuperação do original e restauração dos filtros.
- `npm run test:browser`: regressões dos fluxos existentes.

A suíte dedicada cobre temas claro/escuro e larguras de 320, 360, 768 e 1440 px, com capturas em `test-results/personal-navigation-*.png` e uma seleção em `docs/verificacao-navegacao/`. Testes usam contextos isolados, sem operar sobre dados pessoais. Verificação automatizada em Chrome; aparelhos físicos, Safari e Firefox não foram validados.
