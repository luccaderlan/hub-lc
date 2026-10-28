# Retomada: Hub LC online em duas máquinas

## Estado de produto atualizado em 28/10/2026

O [plano de Biblioteca e espaços individuais](PLANO-BIBLIOTECA-E-ESPACOS.md) foi implementado localmente: Biblioteca independente, espaços próprios, capas opcionais, galerias separadas da escrita, tópicos, quadros e materiais. Registros continuam em `hub-lc:v1`; todos os bytes reutilizam o IndexedDB `hub-lc:pdfs` / `files`, identificados por SHA-256. Não renomear ou apagar essas bases em uma futura migração.

Os objetos `book.space` / `note.space` guardam descrição, imagens, materiais e tópicos; `book.cover` referencia a capa; `note.visual` preserva o quadro de uma nota de texto sem alterar seu corpo, destaques ou ID. Murais existentes continuam como registros `kind: canvas`. Arquivos adicionados em um espaço não pertencem automaticamente ao catálogo de Estudos. Uma referência não transfere o pertencimento da fonte.

O backup completo inclui os novos arquivos e referências; o backup só de registros conserva referências recuperáveis pelo original. A restauração valida registros, formatos, tamanho, hash e decodificação/dimensões de imagens antes da substituição. A importação substitui, não mescla. Remover anexos dos espaços conserva os bytes; considerar esse comportamento na futura política de armazenamento.

Arquivos públicos incluem o novo módulo `spaces.js`. Reinicie `server.cjs` após atualizar a lista permitida. A CSP permite `blob:` nas imagens locais. Nenhuma publicação, autenticação ou sincronização foi iniciada nesta entrega. Os registros abaixo continuam como contexto de hospedagem de 14/10.

Registrado em 14/10/2026 a pedido do usuário, para continuar em outro chat.

## Objetivo

Usar o mesmo Hub LC na máquina pessoal e na máquina do estágio, com anotações, progresso, conteúdos e PDFs sincronizados, por um endereço HTTPS com login pessoal.

## Domínio e proposta

O usuário possui o domínio g8creative.com na Hostinger. A captura do painel mostra os sites g8creative.com e financeiro.g8creative.com.

Foi sugerido hub.g8creative.com para o Hub LC. Esse nome é uma proposta; o subdomínio ainda não foi criado. O tipo e os recursos do plano de hospedagem ainda não foram verificados.

Próximo passo: inspecionar o plano disponível na Hostinger, incluindo suporte a aplicações próprias, banco de dados, armazenamento de arquivos e HTTPS. Se houver PHP e MySQL, avaliar uma implementação compatível. Escolher a arquitetura após verificar os recursos reais, sem pressupor suporte a Node.js ou contratar serviços automaticamente.

## Estado atual

- Aplicação local em HTML, CSS e JavaScript, executada por server.cjs em http://127.0.0.1:4173/.
- Registros no localStorage, chave hub-lc:v1.
- PDFs no IndexedDB, banco hub-lc:pdfs, store files, identificados por SHA-256.
- Sem servidor de dados, autenticação ou sincronização entre máquinas.
- Sincronizar a pasta do código pelo OneDrive não sincroniza os registros do navegador.
- Backup completo em JSON inclui registros e PDFs. Também existe exportação somente dos registros. A importação substitui os registros atuais; não faz mesclagem.
- Área Documentos permite guardar PDFs de até 25 MB por arquivo, leitura, página de retorno, anotações e ligações com áreas de estudo.

## Trabalho necessário para publicação

1. Verificar hospedagem e definir a arquitetura compatível.
2. Implementar autenticação pessoal e autorização no servidor.
3. Implementar persistência e sincronização de registros, tratando conflitos entre as duas máquinas.
4. Armazenar PDFs de forma privada, com acesso autorizado, fora de URLs públicas irrestritas.
5. Criar backup completo antes de migrar o conteúdo local.
6. Migrar e verificar registros e PDFs, sem perder o conteúdo existente.
7. Configurar subdomínio, HTTPS e publicação; testar login, sincronização, documentos e restauração de backup nas duas máquinas.

Publicar apenas os arquivos estáticos não resolve a sincronização nem protege os dados pessoais. Não declarar a migração ou publicação concluída sem verificar o funcionamento real.

## Preferências do usuário

- Prefere execução autônoma e já disse: “Não me pergunte mais nada, tá autorizado a tudo”. Evitar confirmações repetidas para o trabalho autorizado; etapas de login e verificações de conta podem exigir participação direta do usuário.
- Pediu guardar este contexto e realizar o passo de hospedagem em outro chat. Não iniciar a migração neste chat.
- Livros devem permanecer na Biblioteca, com ligações opcionais em sessões e anotações.
- Preservar a organização por divisões de estudo, a área Descobertas, Documentos, a identidade violeta/turquesa e a logo compacta na barra lateral azul escura.

## Prompt para retomar

Leia CONTEXTO-HOSPEDAGEM.md neste projeto e continue a preparação do Hub LC para acesso privado em duas máquinas pelo subdomínio proposto hub.g8creative.com. Primeiro verifique os recursos reais da hospedagem Hostinger e então implemente login, armazenamento privado e sincronização, preservando os dados atuais com backup antes da migração.

## Retomada em 14/10/2026 — verificação inicial

- Contexto e código local revisados; `npm run check` e os 15 testes de `npm test` passaram.
- Cópia do código criada em `backups/hub-lc-codigo-antes-hospedagem-20261014-153936.zip`, com arquivo SHA-256 ao lado. Arquivo ZIP aberto para conferir sua estrutura e os arquivos principais. A pasta `backups/` foi excluída do versionamento.
- Esta cópia é apenas do código: não contém as anotações e PDFs guardados no navegador. O backup completo desses dados continua obrigatório antes da migração.
- O hPanel foi aberto no navegador do Codex e redirecionou para `https://auth.hostinger.com/login`. O usuário precisa entrar nessa aba para permitir a inspeção do plano. Nenhum recurso da conta foi confirmado.
- Próxima ação: após o login, verificar o plano associado a `g8creative.com`, as opções para subdomínios, PHP/Node.js, banco de dados, armazenamento privado, limites de upload e HTTPS. Só então escolher e implementar a arquitetura. Ainda não houve publicação ou migração.

## Reformulação de Estudos — 28/10/2026

Incluir `study-catalog.js` entre os arquivos públicos na hospedagem; o servidor local já permite o módulo. Não é necessário reescrever rotas no servidor: os destinos continuam usando fragmentos (`#areas/<id>`). Reinicie o servidor de desenvolvimento se sua instância anterior ainda usar a lista antiga de módulos. A entrega não altera localStorage/IndexedDB nem o esquema de backup; preferências transitórias de catálogo, filtros, retorno e rolagem ficam em `hub-lc:studies` no sessionStorage.

Preservar os arquivos e alterações locais dos espaços de livros/anotações. O plano implementado está em PLANO-ESTUDOS-NAVEGACAO.md; a evolução de subtemas não faz parte desta versão.
