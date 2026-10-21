# ▶️ Prompt de continuidade (se a execução parar)

Cole o bloco abaixo numa nova sessão do Claude Code (web ou local) com os 3 repositórios
(`leilometro`, `leilometro-api`, `leilometro-extensao`) abertos na branch `claude/practical-edison-pg0c1c`.

```text
Contexto: sou o Paul, dono do Leilômetro (extensão Chrome que analisa lotes de leilão de veículos,
hoje só no leilo.com.br). Numa sessão anterior pedi, nos 3 repositórios (branch
claude/practical-edison-pg0c1c em cada um):

1. leilometro (site): plano de marketing e de negócios em marketing/PLANO_MARKETING_E_NEGOCIOS.md
   (+ marketing/plano.html visual), 10+ posts para Facebook/Instagram/LinkedIn com imagens e GIFs
   em marketing/posts/ (textos em POSTS.md, artes geradas por script em marketing/posts/gerar/),
   e roteiro de comentários para vídeos de YouTube sobre carro de leilão (marketing/YOUTUBE.md).
2. leilometro-extensao: (a) IA sem chave para leigos — botão que copia o prompt do lote e abre
   ChatGPT/Gemini/Claude no navegador (modo padrão), mantendo o BYOK como opção avançada e
   um provedor "Leilômetro (grátis, cota diária)" que chama a leilometro-api; (b) arquitetura
   de adaptadores de site (lib/sites.js) para rodar em outras leiloeiras (Copart, VIP, Sodré
   Santoro, Freitas, Mega Leilões...) via optional_host_permissions + chrome.scripting
   (para NÃO desativar a extensão de quem já instalou); plano em docs/PLANO_MULTI_LEILOEIRAS.md.
3. leilometro-api: endpoint POST /ia/analisar com cota grátis por instalação (Gemini Flash-Lite
   por padrão, OpenAI opcional), limite diário global, testes e docs/IA_GERENCIADA.md.

Tarefa: leia CONTINUAR.md, o git log e `git status` de cada repo, veja o que já foi feito
(commits) e o que falta da lista acima. Termine o que faltar seguindo o estilo do código
(sem ponto e vírgula no JS, pt-BR, sem build), rode `node --test "tests/*.test.js"` na extensão
e `python -m pytest` na API, faça commits pequenos por assunto, dê push na branch
claude/practical-edison-pg0c1c e abra/atualize 1 PR por repositório com checklist do que eu
preciso fazer manualmente (chaves, deploy, Chrome Web Store, publicar posts).
Seja didático e objetivo comigo.
```

## Estado (21/10, manhã)

- [x] Site: plano de marketing e negócios (`marketing/PLANO_MARKETING_E_NEGOCIOS.md`)
- [x] Site: 12 posts + artes PNG/GIF/MP4 (`marketing/posts/`)
- [x] Site: roteiro YouTube (`marketing/YOUTUBE.md`)
- [x] Site: calculadora web (`calculadora.html`)
- [x] Extensão: IA sem chave no painel (`lib/prompt.js`, `content/assistant.js`) + base do modo servidor em `lib/ai.js`
- [ ] Extensão: seletor de modo de IA em `options/` (externo | leilometro | chave). Hoje o modo padrão já é "externo"
- [ ] Extensão: comparador (`compare/`) e relatório (`report/`) no modo sem chave
- [ ] Extensão: multi-leiloeiras beta (`lib/sites.js`, `optional_host_permissions` + `chrome.scripting.registerContentScripts`) + `docs/PLANO_MULTI_LEILOEIRAS.md`
- [ ] API: `POST /ia/analisar` (contrato esperado pela extensão: body `{instalacao, versao, tarefa, contexto, pergunta, historico}` → `{texto, json?, modelo, restantes}`; 429 com `{detail:{mensagem}}` quando acabar a cota) + `docs/IA_GERENCIADA.md` + testes
- [ ] `marketing/plano.html` visual (opcional)
- PRs: site e extensão abertos para `main`; a API ainda não tem commits nesta branch

Dica de economia: as tarefas de opções, comparador/relatório e o endpoint da API são bem definidas e podem rodar no Sonnet.
