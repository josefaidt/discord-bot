<script>
  import { Content, Grid, Row, Column, Button } from 'carbon-components-svelte'
  import * as store from '$lib/store'
  import Command from '$lib/Command.svelte'

  export let list

  let isSyncing = false
  async function syncCommands() {
    isSyncing = true
    let data
    try {
      const response = await fetch('/api/commands/sync', { method: 'POST' })
      if (response.ok && response.status === 200) {
        data = await response.json()
      }
    } catch (error) {
      store.notifications.add({
        kind: 'error',
        title: 'Error syncing commands',
        subtitle: error.message,
      })
      console.error('Unable to sync commands', error)
    }
    isSyncing = false
    if (data) {
      store.notifications.add({
        kind: 'success',
        title: 'Successfully synced commands',
        subtitle: '',
      })
    }
    return data
  }

  async function unregisterCommand({ id, name }) {
    let data
    try {
      const response = await fetch(`/api/commands/unregister`, {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      })
      if (response.ok && response.status === 200) {
        data = await response.json()
        // TODO: improve popping command from list without reload
        // location.reload()
      }
      store.notifications.add({
        kind: 'success',
        title: `Successfully unregistered ${name}`,
        subtitle: '',
      })
    } catch (error) {
      console.error('Unable to delete command', error)
      store.notifications.add({
        kind: 'error',
        title: `Error unregistering ${name}`,
        subtitle: '',
      })
    }
    return data
  }
</script>

<Content>
  <Grid noGutter>
    <Row>
      <Column>
        <section>
          <header>
            <h2>Commands:</h2>
            <Button disabled="{isSyncing}" on:click="{syncCommands}">
              Sync Commands
            </Button>
          </header>
          {#each list as command (command)}
            {@const tags = [command.registration && 'Registered'].filter(
              Boolean
            )}
            <Command
              {...command}
              tags="{tags}"
              handleUnregisterCommand="{unregisterCommand}"
            />
          {/each}
        </section>
      </Column>
    </Row>
  </Grid>
</Content>

<style>
  section {
    display: grid;
    grid-auto-flow: row;
    grid-row-gap: var(--cds-spacing-05);
  }

  section header {
    display: flex;
    justify-content: space-between;
  }
</style>
