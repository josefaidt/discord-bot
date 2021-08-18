<script>
  import {
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderUtilities,
    SkipToContent,
    Content,
  } from 'carbon-components-svelte'
  import 'carbon-components-svelte/css/all.css'
  import { user } from '$lib/store'

  /** @type {"white" | "g10" | "g80" | "g90" | "g100"} */
  let theme = 'g100'

  let isSideNavOpen = false
</script>

<Header company="" platformName="AWS Amplify Discord Bot" bind:isSideNavOpen>
  <div slot="skip-to-content">
    <SkipToContent />
  </div>

  <HeaderUtilities>
    <HeaderNav>
      {#if $user.isLoggedIn}
        <HeaderNavItem href="/api/logout" text="Logout" />
      {:else}
        <HeaderNavItem href="/api/login" text="Login" />
      {/if}
    </HeaderNav>
  </HeaderUtilities>
</Header>

<Content>
  <slot />
</Content>

<style>
  :global(.bx--content) {
    background: 0 0;
  }

  /* @media (max-width: 1056px) {
    :global(.bx--side-nav ~ .bx--content) {
      margin-left: 0;
      padding-left: 1rem;
      padding-right: 1rem;
    }
  } */
</style>
