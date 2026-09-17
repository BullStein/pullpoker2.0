O SALAO — casa de apostas entre amigos
======================================

Como rodar
----------
1. Tenha Python 3 (nao precisa instalar mais nada).
2. Coloque TODOS os arquivos desta pasta juntos e rode:
       python3 server.py
3. O terminal mostra dois enderecos:
   - http://localhost:8000            -> so neste computador
   - http://SEU_IP_NA_REDE:8000       -> para o pessoal na mesma rede

Outra porta:  PORT=5050 python3 server.py

Se ninguem mais acessar: confirme que estao no mesmo Wi-Fi e libere a
porta 8000 no firewall (Windows pergunta na primeira vez; no Linux com
ufw: sudo ufw allow 8000).

Arquivos
--------
server.py            -> servidor (so biblioteca padrao)
login.html           -> entrar / criar conta
index.html           -> Mesa (apostas)
loja.html            -> Loja
perfil.html          -> Perfil (visual, senha, sair)
admin.html           -> Painel da casa
app.js / style.css   -> codigo e visual, compartilhados pelas paginas

casino_state.json    -> o jogo (contas, apostas, chat, loja)
casino_config.json   -> AS REGRAS, em arquivo separado (ver abaixo)
casino_auth.json     -> senhas e sessoes; nunca vai para o navegador

PRIMEIRO PASSO: crie a conta da casa
------------------------------------
A conta que manda se chama "Casa" (veja adminUser no
casino_config.json). Crie essa conta antes de todo mundo e guarde a
senha - quem entrar com ela vira o host.

A conta da casa:
- fica FORA do ranking
- aparece no chat com nome dourado brilhante e o selo CASA
- e a unica que abre admin.html e muda as regras

Para usar outro nome de host, edite "adminUser" no
casino_config.json e reinicie o servidor.

casino_config.json — as regras
------------------------------
Da para editar pelo painel da casa ou direto no arquivo (reinicie o
servidor se editar com o jogo parado):

  startBalance       saldo de quem cria conta
  betCost            custo para abrir uma aposta (padrao 20)
  defaultExpireMin   prazo sugerido nas apostas novas
  bonusAmount        quanto vale o "pontos gratis"
  bonusCooldownMin   de quantos em quantos minutos pode pegar
  spinCooldownSec    intervalo entre giros do caca-niquel
  slot.seteTriplo    premio de tres 7
  slot.trio          premio de qualquer trinca
  slot.par           premio de um par
  slot.nada          consolacao quando nao sai nada
  betsLocked / chatOn / shopOn / announcement

Apostas
-------
- Abrir custa betCost pontos (padrao 20), descontado de quem abre.
- Toda aposta mostra QUEM abriu, quando foi criada e o PRAZO.
  Passou do prazo, ninguem mais aposta; o dono (ou a casa) so precisa
  escolher o resultado e pagar.
- Opcoes fixas: o dono da aposta e a casa podem ACRESCENTAR opcoes
  depois, enquanto ela estiver aberta.
- Excluir postagem: quem abriu a aposta e a casa podem excluir - os
  pontos apostados voltam para todo mundo. No chat, cada um apaga as
  proprias mensagens (o X ao lado da hora) e a casa apaga qualquer uma.

Loja
----
Cinco tipos de item, todos criados pela casa: cor do nome (solida ou
degrade), tag, brasao (emoji OU imagem que voce envia), moldura e
efeito no chat. A imagem do brasao vira 96px e fica guardada dentro do
jogo, entao funciona sem internet.

O botao "Carregar pacote inicial" cria 29 itens prontos. Cada item tem
preco, liga/desliga e a opcao "so a casa entrega", util para premio.

Contas e senhas
---------------
Cada um cria a propria conta com senha, guardada com sha256 + sal em
casino_auth.json - esse arquivo nunca vai para o navegador. Trocar a
senha fica em Perfil; a casa pode definir senha nova para qualquer
jogador no painel.

Isso segura o basico entre amigos, mas nao e sistema bancario: quem
estiver logado consegue mandar o estado do jogo para o servidor. Jogue
com gente conhecida.
