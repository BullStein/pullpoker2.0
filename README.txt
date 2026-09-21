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
- Agora todo mundo cria uma conta com nome + senha (aba "Criar conta"
  na tela inicial). Login fica salvo no navegador de cada pessoa.
- A conta do host (admin) ja vem pronta:
       usuario: Casa
       senha:   vip777
  Essa conta fica FORA do ranking (nao aparece no placar) e o nome
  dela aparece com um efeito dourado brilhante no chat.
  TROQUE ESSA SENHA assim que possivel: entre como "Casa" e va em
  Perfil > Trocar senha.

PAGINAS
-------
- index.html   -> Mesa: apostas, corridas de cavalo, chat, anuncios
                  no topo, pontos gratis e caca-niquel
- loja.html    -> Loja: cores de nome, tags, brasoes, fundo de nome
                  no chat e fotos de perfil (inclusive customizada)
- perfil.html  -> Perfil: itens comprados, trocar avatar (ou enviar
                  foto propria), trocar senha
- eventos.html -> Log de eventos / bugs / avisos da mesa
- painel.html  -> Painel do host (so aparece/funciona para a conta admin)

O QUE O HOST PODE FAZER (painel.html)
--------------------------------------
- Dar pontos ilimitados ou zerar o saldo de qualquer jogador
- Definir o saldo inicial dos novos jogadores
- Publicar anuncios em destaque no TOPO da Mesa (separado do chat)
  e tambem enviar mensagens no chat como "A Casa"
- Banir/desbanir jogadores pelo nome
- Limpar o chat inteiro / cancelar todas as apostas abertas
- FECHAR/REABRIR, individualmente: a Loja, as Apostas (opcoes fixas
  e palpite livre), o Caca-niquel e as Corridas de cavalo
- Baixar um BACKUP completo (usuarios, saldos, apostas, loja) em
  arquivo .json, e importar um backup depois para restaurar tudo
- Adicionar ou remover itens da loja (cores, tags, brasoes, fundos
  de nome e fotos de perfil), escolhendo emoji/cor para cada um
- Ajustar as REGRAS DO CASSINO (ficam num arquivo separado,
  casino_config.json):
    - custo em pontos para abrir uma aposta (padrao: 20)
    - valor e intervalo dos pontos gratis
    - tempo de espera do caca-niquel e o quanto cada resultado paga
      (tres 7, tres iguais, duas iguais, nada)

APOSTAS
-------
- Custam pontos para abrir (valor definido pelo host).
- Tres tipos: "opcoes fixas" (o criador define as opcoes na hora e
  elas ficam travadas — ninguem pode mais adicionar opcoes depois),
  "palpite livre" (cada um escreve o proprio palpite) e "corrida de
  cavalos" (ver abaixo).
- Mostram quem criou e a data/hora de expiracao (o criador escolhe
  o prazo ao abrir: de 1 hora ate sem expiracao, exceto corrida de
  cavalos que sempre precisa de um horario).
- Opcionalmente, apostas de opcoes fixas/palpite livre podem ter um
  "limite para apostar" (tempo de voto): depois dele ninguem mais
  aposta, mas a aposta continua aberta ate o anfitriao encerrar.
- Se a aposta expirar sem ser encerrada, os pontos apostados sao
  devolvidos automaticamente a todos.
- O criador da aposta (ou o host) pode excluir uma aposta ja
  encerrada/expirada da mesa (botao "Excluir postagem").
- Mensagens do chat tambem podem ser excluidas: cada um apaga as
  suas, e o host pode apagar qualquer uma.

CORRIDA DE CAVALOS
------------------
- Qualquer jogador pode abrir uma corrida na Mesa (tipo "Corrida de
  cavalos" ao abrir aposta), definindo os nomes dos cavalos (minimo
  2) e o horario em que a corrida acontece.
- Ate esse horario todo mundo aposta em um cavalo. Quando o horario
  chega, um cavalo e sorteado automaticamente e quem apostou nele
  divide o pote — nao precisa de ninguem clicar em nada.
- O host pode fechar as corridas de cavalo pelo Painel a qualquer
  momento (impede novas corridas e novas apostas nas existentes).

FOTO DE PERFIL
--------------
A "foto de perfil" padrao e um icone/emoji comprado na loja (aba
"Foto de perfil") e equipado em Perfil. Aparece no chat, no ranking
e no cabecalho.
Tambem existe uma opcao de FOTO CUSTOMIZADA (10.000 pontos): depois
de comprar esse item na loja, va em Perfil e envie sua propria
imagem — ela e redimensionada automaticamente e guardada no
casino_state.json (nao sai da sua maquina/rede).

FUNDO DE NOME NO CHAT
----------------------
Na loja, aba "Fundo de nome", da pra comprar um fundo colorido que
aparece atras do seu nome no chat, no ranking e nas apostas.

EVENTOS / LOG DE BUGS
----------------------
A pagina eventos.html e um mural separado do chat para registrar
bugs, avisos e melhorias encontradas na mesa. Qualquer jogador pode
registrar um evento; cada um apaga o que registrou, e o host pode
apagar qualquer um.

BACKUP
------
No Painel, em "Backup de dados", da pra baixar um arquivo .json com
tudo (usuarios, saldos, apostas, loja, config de fechamento) e
importar esse arquivo depois para restaurar exatamente esse estado
(por exemplo, ao trocar de computador ou depois de testar algo).

ARQUIVOS
--------
- server.py           -> servidor (so biblioteca padrao do Python,
                          detecta e mostra o IP da rede automaticamente)
- app.js               -> logica compartilhada por todas as paginas
                          (login, estado, loja, formatacao)
- styles.css           -> visual (tema cassino oxblood + latao)
- index.html, loja.html, perfil.html, painel.html -> as 4 paginas
- casino_state.json     -> dados salvos (contas, senhas com hash,
                            apostas, chat, banidos, loja). Ja vem com
                            a conta "Casa", uma aposta de exemplo e a
                            loja com itens prontos. Pode apagar para
                            zerar tudo (menos a conta Casa, que e
                            recriada se o arquivo nao existir).
- casino_config.json    -> as regras ajustaveis do cassino (custo de
                            aposta, pontos gratis, caca-niquel).
                            Editavel pelo painel do host, ou na mao.
