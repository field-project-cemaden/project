<script lang="ts">
import { IconX } from '@tabler/icons-svelte';

export let open = false;

enum Tab {
  about = 'Sobre',
  graph = 'Grafo',
  interpolation = 'Interpolação',
  authors = 'Autores',
}

let selectedTab = Tab.about;
</script>

<dialog id="about" {open}>
  <div id="about-content">
    <nav>
      <ul>
        {#each Object.values(Tab) as tab}
          <li class:selected={tab == selectedTab}>
            <button on:click={() => (selectedTab = tab)}>{tab}</button>
          </li>
        {/each}
        <li>
          <button on:click={() => (open = false)}>
            <IconX />
          </button>
        </li>
      </ul>
    </nav>

    <div class="tab" id="TabAbout" hidden={selectedTab !== Tab.about}>
      <p>
        Desenvolvida por estudantes da graduação em Ciência de Dados da
        <a href="https://emap.fgv.br">FGV/EMAp</a> em parceria com o
        <a href="https://www.gov.br/cemaden/pt-br">Cemaden</a>, a ChoveuRIO é uma plataforma que busca
        proporcionar uma visualização detalhada de informações de chuva na
        cidade do Rio de Janeiro. Através de métodos de interpolação e do uso de
        teoria dos grafos, temos como objetivo exibir estimativas das
        concentrações pluviométricas nos diferentes bairros e regiões
        administrativas do município, contribuindo para o acesso e compreensão
        das condições do tempo na região.
      </p>

      <p>
        Todo o código implementado para este projeto é aberto e está disponível
        no <a href="https://github.com/field-project-cemaden/project"
          >nosso repositório do GitHub</a
        >. Contribuições da comunidade são muito bem-vindas, tanto para a
        melhoria da plataforma quanto para expandi-la para outras regiões do
        Brasil, tornando dados desse tipo mais acessíveis a muitas outras
        pessoas.
      </p>

      <h2>Funcionalidades</h2>
      <p>
        A plataforma oferece flexibilidade na escolha de detalhes da
        visualização, buscando atender às preferências e necessidades de cada
        tipo de usuário, desde leigos até especialista em meteorologia. As
        funcionalidades implementadas incluem a escolha do método de
        interpolação utilizado (mais informações podem ser encontradas na seção
        <a href="#TabInterpolation">Interpolação</a>), a segmentação do mapa do
        Rio de Janeiro em regiões administrativas ou bairros, e a seleção do
        intervalo de tempo desejado para a exibição dos acumulados de chuva.
      </p>

      <p>
        Existe ainda a possibilidade de exibir o grafo da rede viária do
        município, juntamente com métricas de interesse que descrevem, por
        exemplo, a "importância" de cada trecho de rua ou avenida para a região
        administrativa à qual ele pertence (mais detalhes sobre isso podem ser
        acessados na seção <a href="#TabGraph">Grafo</a>).
      </p>
    </div>

    <div class="tab" id="TabGraph" hidden={selectedTab !== Tab.graph}>
      <p>
        Em termos simples, um grafo $G$ é um objeto matemático que consiste em
        um par de conjuntos $V$ e $E$, ou seja, $G = (V,E)$, onde os elementos
        em $V$ são os <strong>vértices</strong> (ou nós) do grafo, e os
        elementos de $E$ são pares de elementos de $V$, sendo denominados
        <strong>arestas</strong>. Grafos podem ser utilizados para modelar uma
        grande variedade de problemas; em especial, para dados geográficos, é
        possível utilizar grafos como uma representação da malha viária de uma
        região, capaz de mostrar como essas vias estão conectadas umas às
        outras. Em nossa modelagem, utilizamos:
      </p>

      <ul>
        <li>
          Nós do grafo: representam pontos de interesse, como cruzamentos,
          interseções e/ou esquinas de ruas.
        </li>
        <li>
          Arestas do grafo: representam as conexões entre os pontos de
          interesse, ou seja, as ruas que ligam as interseções.
        </li>
      </ul>

      <p>
        No bairro do Flamengo, por exemplo, as ruas Marquês de Abrantes e
        Paissandu se interceptam, então no grafo viário modelado existe um nó
        que representa esse cruzamento. Desse vértice, saem arestas
        representando cada uma dessas ruas.
      </p>
    </div>

    <div class="tab" id="TabInterpolation" hidden={selectedTab !== Tab.interpolation}>
      <p>
        A plataforma ChoveuRIO incorpora dois modelos de interpolação distintos:
        IDW e Krigagem. Essa abordagem diversificada permite aos usuários
        comparar e contrastar os resultados obtidos por meio desses métodos,
        oferecendo uma análise mais abrangente e fundamentada das concentrações
        pluviométricas na cidade do Rio de Janeiro. Essa variedade de modelos
        reforça a robustez da plataforma, proporcionando uma ferramenta versátil
        para a compreensão das condições do tempo na região.
      </p>

      <h2>Inverso da potência das distâncias</h2>
      <p>
        O método do Inverso da Potência das Distâncias (Inverse Distance
        Weighting – IDW) é uma técnica determinística amplamente utilizada para
        a interpolação espacial em análises geoespaciais. Essa abordagem assume
        que valores em locais não amostrados podem ser calculados como uma média
        ponderada dos valores conhecidos mais próximos, sendo a ponderação
        determinada pelo inverso de alguma potência das distâncias. Em outras
        palavras, pontos mais próximos têm uma contribuição maior para a
        estimativa do valor em um determinado local. Essa simplicidade torna o
        IDW fácil de entender e implementar, sendo particularmente útil em
        conjuntos de dados espaciais com distribuição regular.
      </p>

      <h2>Krigagem</h2>
      <p>
        A Krigagem, originalmente desenvolvida na geoestatística, é um método
        avançado de interpolação baseado em um processo gaussiano regido por
        covariâncias prévias. Este método oferece uma abordagem sofisticada para
        previsões espaciais, garantindo a melhor previsão linear não viesada
        (BLUE) em locais não amostrados. Com suposições adequadas sobre a
        covariância prévia, a Krigagem destaca-se como uma ferramenta eficaz
        para a interpretação precisa das condições pluviométricas em áreas não
        diretamente observadas.
      </p>
    </div>
    <div class="tab" id="TabAuthors" hidden={selectedTab !== Tab.authors}>
        <ul>
            <li>Amanda Perez</li>
            <li>Juan Belieni</li>
            <li>Eduardo Adame</li>
            <li>Kayo Yokoyama</li>
        </ul>
    </div>
  </div>
</dialog>

<style lang="scss">
dialog {
  visibility: hidden;
  position: absolute;
  z-index: 20000;
  left: 0;
  top: 0;

  pointer-events: all;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 100vw;
  height: 100vh;

  background-color: #0009;

  &[open] {
    visibility: visible;
  }

  #about-content {
    background-color: white;
    border-radius: var(--border-radius);

    width: min(80vw, 40rem);
    height: 80vh;

    display: flex;
    flex-direction: column;

    nav ul {
      display: grid;
      grid-template-columns: repeat(4, 1fr) 4rem;
      width: 100%;
      margin: 0;

      li {
        padding: 0.25rem 0;

        button {
          background: none;
          margin: 0;

          color: #0007;

          border: none;
          border-bottom: 3px solid #0002;
          border-radius: 0;
        }

        &:hover button {
          color: #606c38;
        }

        &.selected button {
          color: #606c38;
          border-color: #606c38;
        }
      }

      li:last-child button {
        padding: 0;
        border: none;
      }
    }

    .tab {
      color: black;
      padding: 1rem 1rem 1rem;

      overflow: auto;

      h2 {
        margin: 0 0 0.5rem;
      }

      p, li {
        color: black;
        font-size: 1rem;
        text-align: justify;
      }
    }
  }
}
</style>
