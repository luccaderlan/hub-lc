# Componentes de terceiros

## chess.js 1.4.0

- Origem: [jhlywa/chess.js, v1.4.0](https://github.com/jhlywa/chess.js/tree/v1.4.0), pacote oficial `chess.js@1.4.0` do npm.
- Arquivo: `vendor/chess.js`, distribuição ESM original, 107.052 bytes; sem dependências de execução, bundler ou CDN.
- Licença: BSD-2-Clause, texto integral em [vendor/chess.LICENSE](vendor/chess.LICENSE).
- Uso: geração e validação de jogadas, histórico e reconhecimento de finais. O bot é próprio do Hub, em `game-bot.js` e `game-worker.js`.
- Integração: importação local no navegador e Node; incluído na lista pública de `server.cjs`. O source map de desenvolvimento não é necessário para a execução e não é distribuído.

Regras de dama brasileira: [IDF / seção 64 da FMJD](https://fmjd64.org/rules-of-the-game/), especialmente 4.16 e 7. A implementação local não contém código desse site.

As licenças das fontes existentes permanecem em `assets/fonts/`.
