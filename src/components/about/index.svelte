<script lang="ts">
import { CloseOutline } from 'svelte-ionicons';

export let open = false;

let tabNames = ['Visualização', 'Interpolação', 'Autores'];
let selectedTab = 0;
</script>

<dialog id="about" {open}>
  <div id="about-content">
    <nav>
      <ul>
        {#each tabNames as name, index}
          <li class:selected={index == selectedTab}>
            <button on:click={() => (selectedTab = index)}>{name}</button>
          </li>
        {/each}
        <li>
          <button on:click={() => (open = false)}>
            <CloseOutline />
          </button>
        </li>
      </ul>
    </nav>
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
  }

  nav ul {
    display: grid;
    grid-template-columns: repeat(3, 1fr) 4rem;
    width: 100%;
    margin: 0;

    li {
      padding: 0.25rem 0;

      button {
        background: none;
        margin: 0;

        color: #0007;

        border: none;
        border-bottom: 2px solid #0002;
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
}
</style>
