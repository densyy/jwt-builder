# JWT Generator (Client-side)

Pequeno web app para gerar JSON Web Tokens (JWT) no navegador usando HMAC SHA-256.

Arquivos:
- `index.html` — interface principal.
- `styles.css` — estilos modernos e responsivos.
- `script.js` — lógica de geração de JWT e cópia para clipboard.

Como usar:
1. Abra `index.html` no navegador (duplo-clique ou sirva com um servidor estático).
2. Insira a `Key` (obrigatório) que será usada para assinar o token.
3. Insira um `Payload` em JSON (opcional). Se deixar vazio, será usado `{}`.
4. Clique em "Gerar Token". O token aparecerá no campo abaixo.
5. Clique no botão de copiar para copiar o token (aparecerá o aviso "Copiado!").

Observações de segurança:
- A key e o payload nunca deixam seu navegador — tudo é feito localmente.
- Não use essa ferramenta para chaves de produção sensíveis.

Execução rápida com um servidor estático (Python):

```bash
python3 -m http.server 8000
# então abra http://127.0.0.1:8000 no navegador
```

Licença: MIT
