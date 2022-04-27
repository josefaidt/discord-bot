<script context="module" lang="ts">
  /**
   * @typedef {"initial"} DELETE_STEP_INITIAL
   */
  const DELETE_STEP_INITIAL = 'initial'
  /**
   * @typedef {"confirm"} DELETE_STEP_CONFIRM
   */
  const DELETE_STEP_CONFIRM = 'confirm'
  /**
   * @typedef {"deleting"} DELETE_STEP_DELETING
   */
  const DELETE_STEP_DELETING = 'deleting'
</script>

<script lang="ts">
  import { Button, Tile, Tag } from 'carbon-components-svelte'
  import { TrashCan } from 'carbon-icons-svelte'

  /**
   * @type {(DELETE_STEP_INITIAL|DELETE_STEP_CONFIRM|DELETE_STEP_DELETING)}
   */
  let deleteCommandStep = DELETE_STEP_INITIAL

  /**
   * Command ID
   * @type {Object.<string, any>}
   */
  export let registration
  /**
   * Command name; used to execute command
   * @type {string}
   */
  export let name
  /**
   * Command description
   * @type {string}
   */
  export let description

  export let tags
  export async function handleUnregisterCommand({ id, name }) {}

  const id = registration?.id

  async function onDeleteCommand(event) {
    deleteCommandStep = DELETE_STEP_DELETING
    const response = await handleUnregisterCommand({ id, name })
    deleteCommandStep = DELETE_STEP_INITIAL
    return response
  }
</script>

<Tile>
  <article>
    <div>
      <div>
        <slot name="header">
          <h3>{name}</h3>
        </slot>
        <slot name="tags">
          {#if tags}
            <div>
              {#each tags as tag}
                <Tag>{tag}</Tag>
              {/each}
            </div>
          {/if}
        </slot>
      </div>
      <div>
        {#if id}
          {#if deleteCommandStep === DELETE_STEP_INITIAL}
            <Button
              kind="danger-tertiary"
              iconDescription="Delete"
              icon="{TrashCan}"
              on:click="{() => (deleteCommandStep = DELETE_STEP_CONFIRM)}"
            />
          {:else if deleteCommandStep === DELETE_STEP_CONFIRM}
            <Button
              kind="danger-tertiary"
              iconDescription="Confirm delete"
              on:click="{onDeleteCommand}"
            >
              Are you sure?
            </Button>
          {:else if deleteCommandStep === DELETE_STEP_DELETING}
            <Button
              kind="danger-tertiary"
              iconDescription="Confirm delete"
              disabled
            >
              Are you sure?
            </Button>
          {/if}
        {/if}
      </div>
    </div>
    <!-- command metadata 
          enabled?
          permissions?
          update button
          delete button
  -->
    <!-- <h3>{name}</h3> -->
    <p>{description}</p>
    <!-- command name -->
    <!-- command description -->
    <!-- command options -->
  </article>
</Tile>

<style>
  article {
    display: grid;
    grid-auto-flow: row;
    grid-row-gap: var(--cds-spacing-04);
  }

  article > div {
    display: flex;
    justify-content: space-between;
  }

  article span {
    color: var(--cds-text-03);
  }
</style>
