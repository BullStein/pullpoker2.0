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

Virar host (admin):
- Clique em "sou o host da mesa" (embaixo, na barra lateral) e use a
  senha: vip777
- Troque essa senha no arquivo index.html procurando por ADMIN_PIN.

O que o host pode fazer:
- Dar pontos ilimitados ou zerar o saldo de qualquer jogador
- Definir o saldo inicial dos novos jogadores
- Enviar anuncios no chat como "A Casa"
- Banir/desbanir jogadores pelo nome
- Limpar o chat inteiro
- Cancelar todas as apostas abertas de uma vez (devolve os pontos)
- Adicionar ou remover itens da loja (cores de nome, tags e brasoes),
  incluindo escolher um emoji para novos brasoes

Loja:
- Cada jogador pode comprar cores de nome, tags e brasoes com os
  proprios pontos e equipar o que quiser. Aparece no chat, no ranking
  e em toda a mesa.
- Ja vem com uma leva de itens pre-cadastrados; o host pode adicionar
  mais a qualquer momento pelo painel.

Arquivos:
- server.py           -> servidor (so biblioteca padrao do Python,
                          detecta e mostra o IP da rede automaticamente)
- index.html           -> o jogo
- casino_state.json     -> dados salvos (usuarios, apostas, chat,
                            loja, banidos, saldo inicial) - ja vem com
                            uma aposta de exemplo, uma mensagem de
                            boas-vindas e a loja com itens prontos.
                            Pode apagar este arquivo para zerar tudo.
