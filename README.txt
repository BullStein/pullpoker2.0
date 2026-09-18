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
- index.html  -> Mesa: apostas, chat, pontos gratis e caca-niquel
- loja.html   -> Loja: cores de nome, tags, brasoes e fotos de perfil
- perfil.html -> Perfil: itens comprados, trocar avatar, trocar senha
- painel.html -> Painel do host (so aparece/funciona para a conta admin)

O QUE O HOST PODE FAZER (painel.html)
--------------------------------------
- Dar pontos ilimitados ou zerar o saldo de qualquer jogador
- Definir o saldo inicial dos novos jogadores
- Enviar anuncios no chat como "A Casa"
- Banir/desbanir jogadores pelo nome
- Limpar o chat inteiro / cancelar todas as apostas abertas
- Adicionar ou remover itens da loja (cores, tags, brasoes e fotos
  de perfil), escolhendo emoji para os que usam icone
- Ajustar as REGRAS DO CASSINO (ficam num arquivo separado,
  casino_config.json):
    - custo em pontos para abrir uma aposta (padrao: 20)
    - valor e intervalo dos pontos gratis
    - tempo de espera do caca-niquel e o quanto cada resultado paga
      (tres 7, tres iguais, duas iguais, nada)

APOSTAS
-------
- Custam pontos para abrir (valor definido pelo host).
- Mostram quem criou e a data/hora de expiracao (o criador escolhe
  o prazo ao abrir: de 1 hora ate sem expiracao).
- Se a aposta expirar sem ser encerrada, os pontos apostados sao
  devolvidos automaticamente a todos.
- Apostas de "opcoes fixas" podem ganhar novas opcoes depois de
  abertas, enquanto ainda estiverem abertas.
- O criador da aposta (ou o host) pode excluir uma aposta ja
  encerrada/expirada da mesa (botao "Excluir postagem").
- Mensagens do chat tambem podem ser excluidas: cada um apaga as
  suas, e o host pode apagar qualquer uma.

FOTO DE PERFIL
--------------
Como o servidor e so um script local (sem upload de imagens), a
"foto de perfil" e um icone/emoji comprado na loja (aba "Foto de
perfil") e equipado em Perfil. Aparece no chat, no ranking e no
cabecalho.

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
