<!-- PWAPrompt.vue -->
<template>
  <q-dialog v-model="shown" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar :icon="($q.platform.is.mobile ? 'install_mobile' : 'install_desktop')" color="primary"
          text-color="white" />
        <span class="q-ml-sm">{{ $t('Add app to home screen?') }}</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn class="text-capitalize" flat :label="$t('Install!')" color="primary" @click="installPWA" />
        <q-btn class="text-capitalize" flat :label="$t('No, thanks')" color="primary" @click="dismissPrompt" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
  
<script>
/**
 * Prompt to install the PWA.
 * 
 * @component
 * @name PWAPrompt
 * @example
 * <PWAPrompt />
 * 
 */

export default {
  data: () => ({
    shown: false,
    installEvent: null
  }),

  /**
   * Initializes the prompt to install the PWA.
   */
  beforeMount() {
    // if (this.$q.localStorage.getItem('pwa-install-selected') == true) return;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installEvent = e;
      if (!this.$q.localStorage.getItem('pwa-install-selected')) this.shown = true;
    })
  },

  methods: {

    /**
     * Dismisses the prompt.
     */
    dismissPrompt() {
      this.shown = false;
      this.$q.localStorage.set('pwa-install-selected', true); // Remember that user had selected option to not bother  in future
    },

    /**
     * Installs the PWA.
     */
    installPWA() {
      this.installEvent.prompt()
      this.installEvent.userChoice.then((choice) => {
        this.dismissPrompt() // Hide the prompt once the user's clicked
      })
    },

    /**
     * Allows manually triggering the prompt if needed.
     */
    triggerPrompt() {
      if (this.installEvent) {
        this.shown = true;
      }
    },
  }
}
</script>