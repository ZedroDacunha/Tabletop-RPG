# Bugs — índice

Notas de `Bugs e soluções/`, escritas a partir do modelo em [[Bugs e soluçoes]].

Total: **5** notas.

---

- [[BUG-001 - Viagem entre vistas terminava no primeiro quadro]] — resolvido — A transição entre vistas do roteiro parecia um corte seco: a câmera chegava ao destino no primeiro quadro, mesmo com tempo de viagem configurado.
- [[BUG-002 - Abas da biblioteca cortadas em tela estreita]] — resolvido — Com a janela em ~900 px, a primeira aba da biblioteca aparecia cortada ("Bibliot|eca") e as três abas não cabiam no painel de 220 px.
- [[BUG-003 - Ações do topo sem nome acessível]] — resolvido — Abaixo de 950 px os botões do cabeçalho ficam só com ícone e passavam a não ter nome para leitores de tela (nem `title` para o mouse).
- [[BUG-004 - Troca de mapa descartava alterações pendentes]] — resolvido — Trocar de mapa logo depois de editar podia perder as últimas alterações: o salvamento automático é adiado em 850 ms e a troca acontecia antes dele.
- [[BUG-005 - Esc durante a edição do nome fechava a janela]] — resolvido — Ao renomear um mapa, apertar `Esc` para cancelar a edição fechava a janela `Meus mapas` inteira, em vez de só desfazer o que estava sendo digitado.

## Como adicionar uma nota

1. Copie o modelo de `Bugs e soluções/Bugs e soluçoes.md` (o nome do arquivo está assim mesmo).
2. Salve como `BUG-XXX - título curto.md` com o próximo número livre.
3. Preencha o frontmatter, sem `#` nas tags.
4. Acrescente a linha da nota nesta lista: `- [[BUG-XXX - título]] — status — resumo em 1 linha`.
