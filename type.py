import pyautogui
txt = """Meu nome é Arthur Bueno Steinbach, nasci em 2009 e, desde 2018, tenho interesse por Tecnologia da Informação. O que começou como curiosidade foi se transformando em um objetivo de vida: entender como a tecnologia funciona, criar soluções e utilizar a computação para resolver problemas reais.

Atualmente, curso o 3º ano do Ensino Médio Técnico em Informática na Fundação Bradesco, onde desenvolvi conhecimentos em programação, lógica, Python, Programação Orientada a Objetos, HTML, CSS e JavaScript, além de informática e ferramentas como Excel, Word e PowerPoint. Também busquei aprendizado além da escola, realizando cursos da Escola Virtual da Fundação Bradesco e estudando Inteligência Artificial por meio do CS50’s Introduction to Artificial Intelligence with Python, da Harvard University. Meu interesse por tecnologia também me levou a participar de atividades acadêmicas, como atuar como jurado em uma banca de projetos de robótica, avaliando aspectos de lógica, funcionamento e criatividade.

Escolhi Engenharia de Computação porque quero construir uma formação ampla e aprofundada, unindo programação, computação, engenharia e resolução de problemas. O Insper me atrai pela proposta de ensino aplicado, pelo ambiente de excelência acadêmica e pela oportunidade de aprender por meio de projetos e desafios próximos da realidade profissional.

A bolsa é fundamental para que eu possa transformar esse objetivo em uma possibilidade concreta. Quero aproveitar a oportunidade para me desenvolver academicamente, participar de projetos, ampliar meus conhecimentos e construir uma carreira em tecnologia, especialmente nas áreas de desenvolvimento, inteligência artificial e sistemas computacionais. Meu projeto de vida é tornar-me um profissional capaz de criar soluções relevantes por meio da tecnologia, e acredito que a formação em Engenharia de Computação será uma etapa essencial para alcançar esse objetivo.
"""

pyautogui.hotkey('alt', 'tab')  # Simulates pressing Alt+Tab to switch windows
pyautogui.write(txt)