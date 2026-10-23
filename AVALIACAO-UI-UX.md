# Avaliação de UI/UX — Hub LC

## Simplificação e organização — 23/10/2026

A avaliação identificou três fontes de atrito: dez destinos principais com funções do mesmo contexto, vários níveis de cartões antes de chegar ao material e separação entre referências, arquivos e ideias do mesmo assunto. A reformulação aplicada concentra os estudos e mantém as ferramentas de escrita e execução acessíveis.

| Antes | Aplicado | Benefício |
| --- | --- | --- |
| Áreas & conteúdos, Documentos, Descobertas, Biblioteca e Dicionário competindo no menu | Estudos com abas Assuntos, Links e vídeos, Documentos, Livros e Dicionário | Cinco destinos principais, além das preferências |
| Escolher divisão e percorrer cartões de áreas e conteúdos | Assuntos na lateral e fontes reunidas no painel | Acesso direto ao assunto e busca no contexto |
| Divisão obrigatória na criação da área | Coleção opcional, renomeável e possibilidade de unir coleções | Organizar quando fizer sentido e mover assuntos sem recriar vínculos |
| Botões de criação espalhados na tela | Menu Adicionar com assunto, referência, arquivo, link e anotação | Uma entrada para os materiais do estudo |
| Documentos limitados a PDF | Texto, Markdown, CSV, Office, OpenDocument, EPUB e imagens, com original preservado | Guardar fontes em diferentes formatos; prévia conforme o suporte local |
| Anotação de vídeo dependia de descoberta previamente cadastrada | URL e momento opcionais diretamente na anotação | Registrar uma ideia com acesso ao trecho de origem |
| Evolução separada de Sessões | Aba interna de Sessões | Histórico e dedicação no mesmo contexto |
| Somente backup JSON | Markdown completo ou síntese por trechos, com recortes e período | Reutilizar registros em IA ou produção de conteúdo |

A síntese exporta trechos dos registros pessoais, com indicação de abreviação; não inventa uma interpretação do conteúdo. Office e EPUB não têm prévia local nesta versão: ficam disponíveis para download e preservação no backup. Endereços antigos, IDs, vínculos e PDFs anteriores permanecem compatíveis.

Verificação: testes de dados e exportação, fluxos reais de arquivos/vídeos/Markdown/backup no Chrome, regressões de notas, mural, sessões e descoberta, temas claro/escuro e larguras de 320 a 1440 px. As seções abaixo registram a avaliação anterior de 21/10.


Revisão de 21/10/2026, com as referências visuais fornecidas. Foram avaliadas as 11 telas principais nos temas claro e escuro, em desktop e celular. A revisão considera hierarquia visual, distribuição do espaço, clareza das ações, edição direta, navegação, foco de teclado e prevenção de perda de dados.

## Principais problemas e ajustes

| Ponto observado | Efeito no uso | Ajuste aplicado |
| --- | --- | --- |
| Barra de rolagem com trilho e controles muito evidentes | Elementos de navegação competiam com o conteúdo | Barra fina, trilho transparente e contraste discreto em ambos os temas, mantendo a rolagem disponível |
| Borda colorida em “Liberdade para começar” | Destaque sem uma função diferente dos demais blocos | Removida a faixa lateral; mantidos o fundo e o contorno sutil do cartão |
| Cronômetro junto do formulário à esquerda | Coluna carregada e espaço pouco aproveitado à direita | Campos à esquerda; relógio analógico, números e controles à direita; histórico logo abaixo do relógio. No celular, os blocos ficam em sequência |
| Cores do marcador expostas permanentemente | A ferramenta ganhava mais destaque que a escrita | Ferramentas aparecem após selecionar e soltar o mouse; ícone de marcador abre a paleta; escolher a cor aplica a marcação e fecha o menu |
| Mural limitado à largura da página | Pouco espaço para organizar e relacionar ideias | Área independente com dimensões ajustáveis, rolagem interna, navegação por arraste, zoom, enquadramento e modo ampliado |
| Post-its com dimensões fixas | Ideias maiores exigiam rolagem ou ficavam apertadas | Redimensionamento pelo canto, medidas pelo clique e ajuste pelas setas do teclado na alça |
| Vinculação exigia abrir um seletor | Ação interrompia a organização visual | Arrastar ↔ até outro post-it mostra uma linha de prévia e destaca o destino. Soltar cria o vínculo. Também é possível soltar o post-it sobre outra ideia para vincular, preservando sua posição original |
| Lixeiras com cor de alerta permanente | Ações destrutivas competiam com leitura e edição | Ícones discretos em repouso; destaque de perigo ao apontar ou focar; confirmação preservada |
| Botão “+ Anotação” quebrava em duas linhas em telas pequenas | Cabeçalho desalinhado | Espaçamentos e largura do texto ajustados no celular |

## Aplicação transversal — segunda revisão

A avaliação foi aplicada aos componentes e comportamentos compartilhados das 11 telas, além dos ajustes visuais da primeira rodada.

| Problema encontrado | Correção aplicada |
| --- | --- |
| Foco perdido ao atualizar filtros, preferências, cartões e listas | Restauração do controle e da posição do cursor; mudanças de tela direcionam o foco ao título; iniciar e pausar mantêm o foco no controle correspondente |
| Fechamento de formulário descartava um rascunho sem aviso | Cancelar, fechar ou pressionar Escape oferece continuar editando ou descartar quando há alterações; sair da página com formulário alterado também aciona a proteção do navegador |
| Foco inicial de formulários no botão de fechar | Entrada pelo primeiro campo; confirmações começam em Cancelar; mensagens de erro recebem foco; ao fechar, o foco retorna à ação de origem |
| Fechamento assíncrono de diálogo podia interromper a digitação seguinte | Restauração de foco realizada junto do fechamento, sem uma segunda mudança tardia |
| Ações durante uma gravação poderiam interromper a operação | Formulário informa processamento, bloqueia envio repetido e impede fechamento enquanto a gravação está em andamento |
| Voltar e Avançar não acompanhavam a navegação principal | Mudanças de seção entram no histórico; Voltar, Avançar e links diretos, inclusive Preferências, abrem a seção correspondente |
| Resultados filtrados sem caminho claro para recuperação | Contagem de resultados, ação “Limpar filtros” e estados vazios específicos; uma busca sem resultado não sugere cadastrar novamente o mesmo acervo |
| Busca interrompia composição de texto | Atualização aguarda a conclusão da composição, preservando foco e seleção |
| Paginação do dicionário devolvia o foco ao início | “Mostrar mais termos” leva ao primeiro termo recém-exibido |
| Navegação ocupava várias linhas no celular | Menu de seções em uma faixa com rolagem própria, mantendo visível a seção atual; cabeçalho reorganizado em telas estreitas |
| Campos e alvos pequenos nas telas menores | Campos com texto de pelo menos 16 px; botões principais com pelo menos 44 px de altura; bordas dos campos e foco de escrita mais visíveis |
| Mural ampliado deixava o fundo acessível | Conteúdo de fundo fica inerte enquanto o mural está ampliado; Escape fecha e o foco permanece no controle do mural |
| Falha de gravação podia ser seguida de feedback de sucesso | Aviso persistente com exportação, mensagens de texto honestas e proteção ao sair; exclusão só anuncia sucesso após persistência |
| Contagens com formas como “anotação(ões)” | Singular e plural adequados nas contagens do acervo, sessões, dicionário e backup |

O link “Pular para o conteúdo” permite chegar ao conteúdo pelo teclado sem percorrer o menu. Os avisos de resultados e falhas são identificados para tecnologias assistivas. A faixa de erro de salvamento continua disponível ao rolar a página e o backup inclui o texto que ainda está na memória.

## Revisão por área

| Área | Resultado da revisão |
| --- | --- |
| Meu espaço | Hierarquia entre início, retomada e ideias recentes preservada; faixa colorida removida do bloco inicial |
| Áreas & conteúdos | Agrupamentos por divisão, busca e filtros mantidos; ações secundárias e exclusão com menor peso visual |
| Documentos | Upload, recuperação de arquivo, leitor e vínculo com notas mantidos; exclusão continua preservando os registros associados |
| Descobertas | Captura rápida, acervo, fonte e conexões mantidos; filtros e cartões adaptam-se ao celular |
| Quadro | Movimentação por arraste e alternativa por seletor preservadas; exclusão direta mantém confirmação |
| Biblioteca | Informações de retomada, progresso e registros continuam agrupadas por livro |
| Anotações | Escrita com menos distrações; ferramentas contextuais; mural com interação direta e área própria |
| Sessões | Melhor uso da coluna direita; representação convencional de relógio e controles reunidos; histórico separado dos campos |
| Evolução | Métricas opcionais, filtros e estados vazios mantidos, sem impor metas |
| Dicionário | Busca, categorias, detalhes expansíveis e exibição gradual preservados |
| Preferências & backup | Aparência e exportação/importação continuam centralizadas; novas dimensões, vínculos e marcações entram no backup |

## Verificação

- Capturas das 11 telas em 1440 px e 360 px, nos dois temas; verificações adicionais de layout, tamanho dos campos e alvos de toque em 320, 360 e 768 px; fluxos do mural em 1024, 360 e 320 px.
- Seleção real com mouse seguida de abertura do marcador, escolha da cor e aplicação; alternativa por seleção de teclado; fechamento por Escape e clique fora.
- Ampliação e redução de post-its e do mural; conexão por arraste; rejeição de vínculos duplicados; zoom, enquadramento e navegação pelo fundo.
- Persistência após recarregar, compatibilidade com backups anteriores e validação das novas dimensões.
- Fluxos existentes de áreas, quadro, livros, sessões, documentos, descobertas e backup cobertos pela suíte do navegador.
- Teclado, histórico de navegação, links diretos, foco ao abrir e fechar formulários, cancelamento de rascunhos, confirmações e paginação do dicionário.
- Falha de armazenamento simulada: o texto continua na memória, a interface informa a falha, a saída é protegida e o backup exportado contém o texto não persistido.
- 22 testes de dados, formatos e exportação Markdown, checagem de sintaxe e suíte completa no Chrome com Playwright; relatório gerado em `test-results/browser-report.json`.

A verificação automatizada de layout e teclado foi feita no Chrome, com contextos isolados e dados de teste. Não equivale a uma certificação de acessibilidade nem a testes manuais com leitores de tela, Safari, Firefox ou dispositivos físicos. O histórico cobre a navegação entre seções; escolhas internas de uma seção continuam no estado de trabalho, sem uma URL própria para cada registro.

O mural usa uma área finita ajustável entre 480–8000 px de largura e 360–8000 px de altura. Cada post-it pode medir de 180 × 160 até 1000 × 1000 px. O zoom muda a visualização; alterar as dimensões muda o espaço de trabalho. As duas ações ficam separadas para tornar o resultado previsível.

As capturas e o relatório dos testes ficam em `test-results/`, sem entrar no backup dos dados pessoais.
