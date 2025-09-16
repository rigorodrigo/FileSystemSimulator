# Simulador do Sistema de Arquivos 

O sistema de arquivos é uma implementação em recurso de  software feita pelo Sistema Operacional, para que o usuário possa manipular seus dados, em formato de **arquivos** e **diretórios**, de maneira simples e intuitiva. Este projeto tem como objetivo principal demonstrar visualmente um sistema de arquivos de um sistema operacional,através de uma interface Web, na qual é possível visualizar desde aspectos em software, como também  perspectivas do ponto de vista do disco.

## Ferramentas Utilizadas

- HTML 5  
- CSS (DaisyUI)
- JavaScript  


## Funcionalidades

- **Visualização gráfica dos blocos do disco:** Veja uma representação dos blocos do disco, e observe em tempo real suas modificações conforme eles são alocados, liberados e organizados.  
- **Criação e exclusão de partições:** Crie, configure e exclua partições, definindo tamanho, bloco inicial, bloco final e métodos de gerenciamento específicos para cada uma.    
- **Simulação de métodos de alocação:**  Experimente e compare visualmente diferentes algoritmos de alocação de arquivos:
    - Alocação Contígua;  
    - Alocação Encadeada;  
    - Alocação Indexada.  
- **Manipulação de arquivos e diretórios:**  Crie arquivos e diretórios dentro das partições e veja como o espaço em disco é gerenciado de acordo com o método de alocação selecionado.  
- **Gerenciamento de Espaço Livre:** Entenda como o sistema operacional rastreia o espaço livre em disco utilizando técnicas como Mapa de Bits (Bitmap) ou Lista de Blocos Livres.  

## Como executar

Para usar o simulador, basta acessar o link [Simulador Sistema De Arquivos](https://filesystemsimulator.pages.dev/). Ao entrar no site, você se deparará com uma tela mais ou menos assim:

![alt text](/imgs/image.png)

Nela, você definirá quantos blocos terá o seu disco e qual o tamanho de cada bloco. Por óbvio, o tamanho em Mb do disco será a multiplicação destes dois valores.Observe que que há uma recomendação de quantidade de blocos e tamanho de cada bloco do disco. No exemplo, eu adicionei 128 blocos de 4 Kb , totalizando por volta de 500 kb. Para inicializar um disco, deve-se criar uma partição inicial para ele. Defina o nome que desejar e os métodos de gerenciamento que preferir.

![alt text](/imgs/image1.png)

Disco criado! Agora você pode gerenciar suas partições, diretórios e arquivos. 

![alt text](/imgs/image2.png)

Ao selecionar uma partição específica, o usuário pode verificar o método de gerenciamento de espaço livre da mesma e mais alguns detalhes.

## Autores

- **Nomes :** Artur Ricieri Tretini Benedetti, Rodrigo Rigo
- **Curso :** Ciência da Computação  
- **Universidade :** Universidade de Passo Fundo, UPF  