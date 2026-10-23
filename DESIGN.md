# Direção visual — Hub LC

A interface usa uma composição discreta, com superfícies claras, violeta como cor de ação e turquesa/coral em contextos de conteúdo. O tema escuro tem os mesmos componentes e hierarquia. A tela inicial reúne a entrada para estudos, a retomada da sessão, atalhos e os registros reais do usuário.

## Tipografia e ícones

- **Sora:** títulos, números de destaque e marca textual.
- **DM Sans:** navegação, formulários e leitura das anotações.
- As fontes variáveis estão em `assets/fonts/`, com subconjuntos latino e latino estendido. São servidas pelo próprio aplicativo, sem requisições a serviços externos. As licenças OFL acompanham os arquivos.
- Os ícones da navegação são SVGs locais, com espessura consistente e sem dependência de caracteres do sistema.

## Movimento e referência

O destaque inicial adapta o comportamento de luz radial de [Card Spotlight, da Aceternity UI no 21st.dev](https://21st.dev/aceternity/card-spotlight/default). A implementação é própria, em CSS e JavaScript nativos, adequada à estrutura atual da aplicação; não instala React ou bibliotecas de animação.

A luz acompanha o ponteiro apenas no destaque inicial. Entradas de tela, diálogos e estados de interação têm transições curtas. A preferência `prefers-reduced-motion` desativa animações e luz interativa. A arte orbital usa CSS e SVG, é decorativa e não entra na árvore de acessibilidade.

## Organização

`styles.css` preserva as regras estruturais e os componentes existentes. `redesign.css` concentra a nova identidade, os componentes da tela inicial, as adaptações das telas internas e os estados responsivos. O servidor mantém uma lista explícita dos arquivos públicos, incluindo as fontes.

## Validação

```sh
npm run check
npm test
npm run dev
npm run test:browser
```

A suíte de navegador cobre navegação, teclado/foco, estudos, documentos, anotações e murais, cronômetro, backup, temas e tamanhos de tela. As expectativas de cor da suíte foram atualizadas para a nova paleta.
