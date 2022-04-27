<script lang="ts">
  import { onMount } from 'svelte'
  import { Dropdown } from 'carbon-components-svelte'
  import { user } from './store'

  export let servers = [{ id: '0', text: 'Discord Servers' }]
  export let disabled = true

  async function fetchServers() {
    const response = await fetch('/api/guilds/list')
    if (response.ok) {
      const data = await response.json()

      servers = data.map(({ id, name }) => ({ id, text: name }))
      disabled = false
      return data
    }
  }

  onMount(() => {
    if ($user) {
      fetchServers()
    }
  })
</script>

<Dropdown
  type="inline"
  selectedId="{servers[0].id}"
  size="xl"
  disabled="{disabled}"
  items="{servers}"
/>
