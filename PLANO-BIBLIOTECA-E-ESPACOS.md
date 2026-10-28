# Biblioteca e espaços individuais — plano de evolução

Data: 28/10/2026. Status: implementado localmente e verificado. Este documento registra o escopo aprovado, as decisões técnicas da entrega e o alcance da validação.

## Objetivo e decisões

Cada livro e cada anotação deve funcionar como um espaço individual para escrever, organizar ideias, construir quadros e reunir conteúdo relacionado. A prioridade é organização rigorosa, previsibilidade e liberdade dentro de cada espaço. Imagens agregam conhecimento em uma seção própria; não devem ser inseridas entre os parágrafos nem ocupar o editor de texto.

Biblioteca é um destino principal da barra lateral, independente de Estudos. Livros saíram das abas, listagens agregadas, filtros e ações de cadastro de Estudos. A Biblioteca concentra o acervo, o progresso, os registros e os materiais relacionados a livros. Vínculos opcionais com assuntos, anotações e sessões continuam possíveis, sem duplicar livros nem recolocá-los no catálogo de Estudos. Notas de leitura são acessíveis no livro; referências em listas globais devem levar ao mesmo registro e preservar seu contexto.

Esta decisão substitui a proposta anterior de inserir imagens no texto e a decisão de navegação de 23/10/2026 que agrupou Livros em Estudos. Não altera as demais abas de Estudos nem inicia hospedagem ou sincronização.

## Navegação implementada

Ordem do menu: Meu espaço → Estudos → Biblioteca → Quadro → Anotações → Sessões. Preferências preserva seu acesso atual. Biblioteca funciona no menu expandido, recolhido e móvel, com nome acessível e indicação de seleção.

A lista da Biblioteca é a entrada para os livros; a lista de Anotações é a entrada para espaços de escrita independentes. O trabalho acontece dentro do item aberto. Usar caminhos visíveis como Biblioteca › Livro › Anotação, com retorno à lista preservando busca e filtros. A navegação antiga de livros deve continuar abrindo a Biblioteca. Livros e anotações têm links por registro e seção; Voltar/Avançar preservam conteúdo salvo. Rascunhos de formulários mantêm a proteção existente.

## Estrutura dos espaços

Mostrar apenas uma aba por vez, com ordem e controles consistentes. Cabeçalho compacto identifica o registro e seu contexto. As seções permanecem acessíveis quando vazias, com convite discreto para adicionar conteúdo.

| Seção | Livro | Anotação independente ou vinculada |
| --- | --- | --- |
| Visão geral | Título, autor, capa opcional, descrição e ponto de retomada | Título, descrição e vínculos de origem |
| Escrita | Caderno de leitura e reflexão geral | Texto principal, preservando destaques existentes |
| Anotações / Tópicos | Anotações separadas por capítulo ou assunto | Tópicos para desdobramentos, sem hierarquia infinita |
| Quadro visual | Mapas, cartões e relações do livro | Construção visual própria da anotação |
| Imagens | Galeria de prints, fotos e diagramas do livro | Galeria exclusiva da anotação |
| Materiais | Arquivos, PDFs, links e vídeos complementares | Referências e anexos da anotação |

As seções vazias não exigem preenchimento nem geram grandes painéis. Nenhum conteúdo será inventado ou preenchido automaticamente. Não criar recursão de tópicos dentro de tópicos na primeira versão. A modelagem precisa preservar a diferença entre anotações vinculadas a livros e tópicos internos de uma anotação.

## Capas e imagens

- Capa opcional por livro, com adicionar, trocar e remover. Sem capa, manter o formato atual, sem moldura vazia obrigatória. Não transformar toda a Biblioteca em uma estante de capas obrigatórias.
- Galeria própria com inclusão por arquivo, arraste e colagem dentro da aba Imagens. Colar uma imagem no editor de escrita não deve inseri-la no texto; oferecer encaminhamento explícito para a galeria.
- Miniaturas em molduras uniformes; abertura mostra a imagem inteira, com ampliação para leitura de prints. Não recortar ou comprimir trechos a ponto de prejudicar sua legibilidade.
- Título, legenda, descrição acessível, origem/página e comentário pessoal opcionais. Distinguir o trecho da fonte da interpretação do usuário.
- Ordem manual e grupos opcionais por assunto ou capítulo, com alternativa por teclado para reorganização. Identificadores das imagens devem ser estáveis mesmo após reordenar.
- Referência textual pode abrir a imagem correspondente na galeria, preservando a posição de escrita. Não exigir duplicação do arquivo para referenciá-lo.
- Uso de imagens no quadro visual será explícito e opcional, a partir da galeria. Nunca distribuir anexos automaticamente pelo mural ou pelo texto.
- PNG, JPEG e WebP são a base já suportada por Documentos. Limites implementados para capas e galerias: 12 MB e 40 milhões de pixels por imagem, informados antes da seleção/colagem. Miniaturas enquadram o original completo em molduras uniformes, sem criar uma cópia comprimida no estado. Materiais mantêm o limite de 25 MB de Documentos.

## Materiais e pertencimento

Adicionar um arquivo ou link diretamente no espaço em que será usado, sem exigir cadastro manual prévio em Documentos. Avaliar reaproveitamento de registros existentes de Documentos e Descobertas por referência, mantendo uma única fonte e seus vínculos. Anexos de um livro não devem surgir em Estudos apenas por terem sido anexados ao livro; a exposição em outros acervos precisa de associação explícita.

Cada item deve ter pertencimento inequívoco ao livro ou à anotação. Um vínculo com outro espaço não transfere nem duplica o conteúdo. Separar remover uma referência de excluir o arquivo. Antes de excluir um livro ou anotação, informar o destino dos conteúdos internos e preservar itens compartilhados; oferecer preservação dos registros, em continuidade com os fluxos existentes.

## Persistência, migração e exportação

A base atual guarda registros no localStorage e arquivos no IndexedDB; Documentos já aceita imagens. Planejar referências de arquivos nos registros e bytes no IndexedDB, evitando imagens em base64 dentro do estado cotidiano. Avaliar reuso do armazenamento atual sem renomeações ou mudanças destrutivas presumidas.

Preservar IDs, livros, cadernos, retomadas, notas, destaques, murais, coordenadas, conexões, sessões e vínculos existentes. Campos novos começam ausentes ou vazios. Migrar formatos atuais de texto e mural sem exigir recriação pelo usuário, mantendo a natureza e o conteúdo de cada registro.

Backup completo deve incluir capas, galerias, materiais, organização e referências; backup só de registros deve informar a ausência dos arquivos e permitir recuperá-los. Validar formatos, tamanho e integridade antes de substituir dados. Não excluir bytes ainda referenciados por outros espaços. Falhas e cancelamentos de upload não devem produzir itens quebrados nem apagar escrita.

Revisar exportação Markdown contextual: incluir legendas, origens e referências; definir entrega dos arquivos associados, pois Markdown sozinho não incorpora imagens locais. Não prometer imagens portáveis em uma exportação somente textual. Busca cobre títulos, legendas e comentários; OCR e leitura automática de prints ficam fora desta etapa.

## Etapas executadas

1. Biblioteca separada de Estudos, com menu próprio, atalhos compatíveis e listas sem livros em Estudos.
2. Espaços individuais consolidados com seis seções, caminhos, links e preservação da escrita, destaques e murais.
3. Capas e galerias entregues com validação, armazenamento por SHA-256, migração aditiva, backup completo e recuperação de arquivos ausentes.
4. Materiais locais e referências existentes, ordem manual por botões acessíveis, grupos opcionais, referências textuais e imagens adicionadas explicitamente ao quadro.
5. Testes de dados, restauração em navegador vazio, falhas, navegação e capturas de todas as seções nos dois temas e tamanhos desktop/móvel.

Extensão dessa estrutura a Descobertas, Dicionário, sessões e tarefas é uma possibilidade posterior. Não faz parte da primeira entrega aprovada de livros e anotações.

## Critérios de aceite da entrega

- Biblioteca aparece na lateral; Livros não aparece nas abas, filtros ou resultados de Estudos. Atalhos antigos continuam funcionando.
- Livro sem capa mantém apresentação adequada; adicionar, trocar e remover capa não afeta registros.
- Cada livro e anotação abre seu próprio espaço; trocar de item não mistura escrita, imagens, materiais ou quadro visual.
- Imagens ficam separadas do editor, inclusive no fluxo de colagem. Galeria é ordenável, acessível e permite ler o original ampliado.
- Notas vinculadas podem ser abertas dentro do livro e por referências globais sem duplicação; o caminho de retorno é claro.
- Recarregar, trocar abas, voltar e avançar preservam conteúdo e contexto; falhas de armazenamento são informadas com meios de recuperação.
- Backup antigo importa sem perda; backup completo novo restaura capas, anexos e relações em navegador vazio; arquivo ausente tem estado recuperável.
- Exclusão de vínculo ou registro não remove arquivo utilizado em outro espaço.
- Teclado, foco, temas claro/escuro e telas de 320 a 1440 px mantêm acesso a abas e ações, com alvos móveis de pelo menos 44 px.

Os fluxos estão cobertos por `tests/spaces.test.js` e `tests/spaces.browser.cjs`, além das regressões existentes. As seções seguintes registram as escolhas efetivamente implementadas e as limitações da verificação.


## Decisões técnicas efetivas

- O esquema continua na versão 1, com campos opcionais e validação adicional em `spaces.js`. Backups antigos mantêm livros, notas e murais sem preencher conteúdo novo. Não foram alterados os nomes da chave `hub-lc:v1` ou do IndexedDB `hub-lc:pdfs` / store `files`.
- `book.space` e `note.space` reúnem `description`, `images`, `materials` e `topics`. `book.cover` referencia a capa. Os arquivos guardam nome, formato, tamanho e SHA-256; os bytes ficam apenas no IndexedDB. Imagens têm IDs próprios estáveis, metadados opcionais e ordem definida pela coleção. Tópicos internos não são notas vinculadas ao livro e não aceitam subníveis.
- O caderno continua em `book.journal`; texto e marcações continuam em `note.body` / `highlights`. Uma nota de texto pode ter um quadro em `note.visual`, com ID próprio, dimensões, cartões e conexões; não é convertida em mural nem perde sua escrita. Murais antigos continuam como notas `kind: canvas`, sem recriação ou mudança de coordenadas.
- Livros mantêm os murais já vinculados na seção Quadro visual. Adicionar uma imagem ao quadro do livro usa o primeiro mural existente ou cria um mural quando ainda não há nenhum, apenas após a ação explícita **No quadro**. Quadros aceitam até 200 cartões; novas inserções procuram uma posição livre. As seções Imagens, Materiais e Tópicos aceitam até 1000 itens cada.
- Galerias aceitam seleção múltipla, arraste e colagem na área indicada. Colar/soltar arquivos na escrita oferece encaminhamento explícito; cancelar deixa o texto intacto. Referências `[[imagem:ID]]` são exibidas como ações junto da escrita, sem embutir a imagem. Ao voltar, recuperam posição de seleção e rolagem. Reordenar não troca os IDs.
- Materiais próprios ficam exclusivamente no dono. Referências a Documentos/Descobertas usam o ID da fonte. Remover a referência conserva a fonte. Ao excluir uma fonte global ainda referenciada, o material passa a conservar a referência ao arquivo por SHA-256 ou à URL, evitando perda ou vínculo quebrado.
- A exclusão de livro oferece preservar seu caderno, retomada, capa, galeria e materiais como anotação independente. Notas, murais e sessões vinculados ficam independentes. Imagens utilizadas pelos murais preservados recebem referências na galeria do próprio registro. Excluir uma anotação informa a remoção do texto, destaques, tópicos, galeria, materiais e quadro. Bytes compartilhados são preservados; a remoção de anexos dos espaços não faz coleta automática de órfãos.
- O backup completo reutiliza `documentFiles` para todos os arquivos, com deduplicação por SHA-256 e lista de ausentes. A importação valida registros, assinaturas de formato, tamanho, hash, decodificação e limite de pixels das imagens antes de pedir a confirmação de substituição. Os bytes são guardados antes dos registros; falhas deixam os registros atuais intactos. Arquivos ausentes podem ser recuperados pelo original, sem recriar seus IDs. Uploads validam o lote antes de criar referências e não anunciam sucesso quando a gravação falha.
- A exportação Markdown inclui descrições, tópicos, quadros, metadados de imagens e materiais, referências e hashes. Os bytes não acompanham o Markdown; o próprio arquivo informa que os originais exigem backup completo ou download individual.
- URLs de livros usam `#books/ID/SEÇÃO`; notas independentes usam `#notes/ID/SEÇÃO`; notas vinculadas usam `#books/LIVRO/topics/NOTA/SEÇÃO`. O alias `#books` continua válido; `#library` e `#biblioteca` também abrem o catálogo. O retorno ao catálogo conserva busca/status; entradas globais de notas vinculadas abrem o mesmo registro no livro. A seleção das abas permanece visível no celular.

## Validação e limites

`npm run check` e `npm test`: sintaxe válida e 53 testes de dados/regras aprovados. `tests/spaces.browser.cjs` verifica capas opcionais, galerias isoladas, metadados, ordem, referências, quadros, tópicos, colagem, materiais diretos/compartilhados, histórico, recarga, preservação na exclusão, backup completo restaurado em navegador vazio, recuperação só de registros, arquivo inválido e falha de IndexedDB sem perda da escrita. A suíte usa contextos isolados de Chrome com Playwright; não opera sobre dados pessoais.

Todas as seis seções de livro e anotação foram verificadas em 320, 360 e 1440 px, nos temas claro e escuro, sem transbordamento da página. Capturas para inspeção em 1440 e 320 px estão em `test-results/spaces-*.png`; relatório em `test-results/spaces-report.json`. As regressões mantêm cobertura de estudos, criação vinculada, fontes, anotações/destaques, mural, cronômetro/pausas, jogos, documentos, descobertas, foco, filtros e backups. Alvos móveis das ações e abas dos espaços têm pelo menos 44 px.

Limitações: armazenamento continua local, sem hospedagem/sincronização; Markdown é textual; não há OCR, edição de imagem ou coleta automática de bytes órfãos ao remover anexos. Verificação feita no Chrome em viewports simuladas; Safari, Firefox, leitores de tela e aparelhos físicos não foram validados. Essas extensões não fazem parte do escopo entregue.
