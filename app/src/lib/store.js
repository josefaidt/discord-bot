import { writable } from 'svelte/store'

export const notifications = writable([])
export const commands = writable([])
export const user = writable({
  isLoggedIn: false,
})
