SALAO DE APOSTAS
================

Como rodar:
1. Tenha Python 3 instalado (nao precisa instalar nada mais).
2. Nesta pasta, execute:
       python3 server.py
3. O terminal vai mostrar dois enderecos:
   - http://localhost:8000            -> so neste computador
   - http://SEU_IP_NA_REDE:8000       -> para outras pessoas na mesma
                                          rede Wi-Fi/LAN abrirem no
                                          navegador delas

Para outra porta:
       PORT=5050 python3 server.py

Se ninguem mais conseguir acessar:
- Confirme que todos estao na MESMA rede (mesmo Wi-Fi/roteador).
- O firewall do seu sistema pode estar bloqueando a porta 8000:
  - Windows: se aparecer um aviso pedindo permissao para o Python na
    rede, escolha "Permitir" (redes privadas).
  - Mac: Preferencias do Sistema > Rede > Firewall > permitir Python.
  - Linux: se usar ufw, rode "sudo ufw allow 8000".

CONTAS E SENHAS
---------------
- Todo mundo cria uma conta com nome + senha (aba "Criar conta" na
  tela inicial). Login fica salvo no navegador de cada pessoa.
- A conta do host (admin) ja vem pronta:
       usuario: Casa
       senha:   vip777
  Essa conta fica FORA do ranking (nao aparece no placar) e o nome
  dela aparece com um efeito dourado brilhante no chat.
  TROQUE ESSA SENHA assim que possivel — ou entre como "Casa" e va em
  Perfil > Trocar senha, ou troque pelo proprio Painel (ve abaixo).

PAGINAS
-------
- index.html  -> Mesa: apostas, chat, pontos gratis, caca-niquel,
                 cartazes e um resumo da Roleta automatica
- jogos.html  -> Jogos: Corrida de Cavalos e Roleta
- loja.html   -> Loja: cores, tags, brasoes, fotos de perfil e fundos
                 de nome
- perfil.html -> Perfil: itens comprados, avatar, foto propria,
                 trocar senha
- eventos.html-> Log de eventos (contas, apostas, corridas, roleta,
                 acoes do host)
- painel.html -> Painel do host (so aparece/funciona para a conta
                 admin)

O QUE O HOST PODE FAZER (painel.html)
--------------------------------------
- Ver TODAS as contas criadas, cada uma com sua propria caixa de
  controle: dar pontos, tirar pontos, zerar saldo, definir uma nova
  senha na mao, banir/desbanir, e EXCLUIR a conta de vez — sem
  precisar digitar o nome, tem um campo de busca pra achar rapido
  numa mesa com muita gente.
- Definir o saldo inicial dos novos jogadores.
- Enviar anuncios no chat como "A Casa".
- Publicar cartazes/eventos que aparecem no topo da Mesa (com ou sem
  data de validade).
- Limpar o chat inteiro / cancelar todas as apostas abertas.
- Fechar (trancar) loja, apostas, caca-niquel, corrida de cavalos e
  roleta, um por um ou tudo de uma vez com o botao "Fechar tudo".
  Fechar nao cancela nada em andamento, so impede coisa nova de
  comecar.
- Adicionar ou remover itens da loja (cores, tags, brasoes, fotos de
  perfil e fundos de nome), escolhendo emoji para os que usam icone.
- Ajustar as REGRAS DO CASSINO (casino_config.json): custo da aposta,
  valor/intervalo dos pontos gratis, tempo de espera do caca-niquel e
  quanto cada resultado paga, aposta minima/duracao da roleta, e
  aposta minima da corrida de cavalos.
- Baixar um BACKUP completo (.json) com contas, saldos, apostas,
  chat, loja e configs — e restaurar a mesa inteira a partir de um
  arquivo desses.
- Baixar/restaurar um backup SO DAS CONTAS (o casino_users.json —
  usuarios, senhas, saldos e banidos), sem mexer em apostas, loja ou
  chat. Bom pra mandar so as contas pra alguem, ou pra guardar um
  backup leve.

LOG DE EVENTOS (eventos.html)
------------------------------
Uma pagina com o historico do que aconteceu na mesa: contas criadas,
apostas abertas/travadas/encerradas, corridas de cavalo, giros da
roleta, banimentos, mudancas de trava, restauracoes de backup etc.
Da pra filtrar por tipo. Funciona como um "log de bugs/eventos" pra
saber o que rolou mesmo se voce nao estava olhando na hora.

APOSTAS DA MESA
----------------
- Custam pontos para abrir (valor definido pelo host).
- Mostram quem criou e a data/hora em que travam (o criador escolhe
  o prazo ao abrir: de 1 hora ate sem expiracao).
- Quando o prazo acaba, a aposta TRAVA — ninguem mais consegue
  apostar nela, mas ela continua na mesa esperando o host (ou quem
  criou) escolher o resultado e pagar. Os pontos ja apostados NAO sao
  devolvidos automaticamente; so voltam se alguem cancelar a aposta
  na mao.
- Cada opcao mostra a porcentagem do pote (numero + barrinha dourada)
  e, embaixo, quem apostou nela: aparece o avatar de quem tem uma
  foto de perfil equipada, e o nome de quem nao tem.
  - O valor do pote fica mais dourado e MAIOR conforme mais gente
    aposta — pote grande chama mais atencao.
- Apostas de "opcoes fixas" NAO podem mais ganhar opcoes novas depois
  de abertas — a lista fica travada no que foi criado.
- O criador da aposta (ou o host) pode excluir uma aposta ja
  encerrada da mesa (botao "Excluir postagem").
- Mensagens do chat tambem podem ser excluidas: cada um apaga as
  suas, e o host pode apagar qualquer uma.

JOGOS (jogos.html)
-------------------
Agora Corrida de Cavalos e Roleta ficam em ABAS SEPARADAS dentro de
Jogos (um botao pra trocar entre as duas, cada uma na sua).

CORRIDA DE CAVALOS
-------------------
Fica isolada da Mesa — so avanca enquanto alguem esta na pagina
Jogos, sem misturar aviso nenhum no chat da Mesa (so entra no Log de
Eventos). O host escolhe quantos cavalos (4/6/8) e por quanto tempo
as apostas ficam abertas (15s a 3min). Cada jogador aposta pontos
num UNICO cavalo por corrida (nao da mais pra espalhar aposta em
varios); quando o tempo acaba, a corrida roda sozinha (~8s, com
largada e tudo) e o pote e dividido, proporcional ao valor apostado,
entre quem apostou no cavalo vencedor. Cada cavalo tem uma bolinha
colorida ("jóquei") propria pra dar pra distinguir de longe, e
embaixo de cada um aparece quem ja apostou nele (com avatar de quem
tem foto de perfil, ou o nome de quem nao tem) e quanto apostou.
Aposta minima e ajustavel pelo Painel.

ROLETA
-------
Gira sozinha, sem o host precisar fazer nada: abre apostas, fecha,
gira e paga automaticamente, num ciclo configuravel (padrao ~5
minutos) — a Mesa mostra um resuminho dela (fase atual + ultimos
numeros) com um link pra apostar. Tem uma RODA DE VERDADE que gira
na tela (na ordem real de uma roleta europeia) ate parar no numero
sorteado, com ponteiro e tudo. Cada numero e cada aposta externa
(vermelho/preto/par/impar/1-18/19-36) mostra uma fichinha com o
total apostado ali, que aparece com uma animacao quando entra
aposta nova — e as apostas externas ainda mostram embaixo quem
apostou (avatar/nome + quanto). Aceita aposta em numero cheio (paga
35x), cor vermelho/preto, par/impar, ou 1-18/19-36 (essas tres pagam
o dobro). Aposta minima, duracao do ciclo e duracao do giro sao
ajustaveis pelo Painel.

FOTO DE PERFIL
--------------
Duas opcoes na loja, aba "Foto de perfil":
- icones prontos (emoji), como antes; ou
- "Foto personalizada" por 10.000 pontos: depois de comprada, o
  jogador sobe a propria foto em Perfil (e recortada em quadrado e
  comprimida antes de salvar).
So quem tem uma dessas equipada aparece com avatar na lista de quem
apostou em cada opcao — quem nao tem aparece so pelo nome.

ARQUIVOS
--------
- server.py            -> servidor (so biblioteca padrao do Python,
                           detecta e mostra o IP da rede automaticamente)
- app.js                -> logica compartilhada por todas as paginas
                           (login, estado, loja, jogos, formatacao)
- styles.css            -> visual (tema cassino oxblood + latao)
- index.html, jogos.html, loja.html, perfil.html, painel.html,
  eventos.html           -> as 6 paginas
- casino_state.json      -> dados do jogo: apostas, chat, loja,
                            corrida, roleta, cartazes, travas e o
                            log de eventos.
- casino_users.json      -> contas separadas: usuarios, senhas (com
                            hash) e banidos. Fica num arquivo a parte
                            de proposito, pra dar pra fazer backup ou
                            restaurar so as contas (pelo Painel), sem
                            mexer no resto do jogo.
- casino_config.json     -> as regras ajustaveis do cassino (custo de
                            aposta, pontos gratis, caca-niquel).
                            Editavel pelo painel do host, ou na mao.

Se voce ja tinha uma instalacao ANTIGA (de antes do casino_users.json
existir), pode ficar tranquilo: na primeira vez que rodar
"python3 server.py" nessa pasta, o servidor migra sozinho as contas
que estavam dentro do casino_state.json pro casino_users.json novo —
ninguem perde conta nem pontos.
