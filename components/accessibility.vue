<template>
    <q-fab padding="xs" direction="down" persistent v-model="fab" flat vertical-actions-align="left"
        :icon="fab ? 'close' : 'accessibility_new'">
        <div v-if="fab">
            <q-fab-action color="primary" padding="xs" :icon="dark ? 'visibility_off' : 'visibility'"
                @click="dark = !dark">
                <q-tooltip>{{ dark ? $t('Normal color scheme') : $t('Color scheme for visually impaired') }}</q-tooltip>
            </q-fab-action>
            <q-fab-action class="rounded-fab" color="primary" padding="xs" @click="dyslexia = !dyslexia">&nbsp;
                <span v-if="dyslexia" style="font-size: 22px; font-family:Helvetica">a</span>
                <span v-else style="font-size: 22px; font-family: OpenDyslexic">a</span>&nbsp;
                <q-tooltip>{{ dyslexia ? 'Normal font' : 'Dyslexic font' }}</q-tooltip>
            </q-fab-action>
            <q-fab-action color="primary" padding="xs" v-if="zoomlevel < 4" icon="text_increase" @click="zoomlevel++">
                <q-tooltip>{{ $t('Larger font') }}</q-tooltip>
            </q-fab-action>
            <q-fab-action color="primary" padding="xs" v-if="zoomlevel > 1" icon="text_decrease" @click="zoomlevel--">
                <q-tooltip>{{ $t('Smaller font') }}</q-tooltip>
            </q-fab-action>
        </div>

    </q-fab>
    <!-- <q-tooltip>{{$t('Adjustment')}}</q-tooltip> -->
</template>

<script>
/**
 * Component for accessibility settings.
 *
 * This component provides options for adjusting the accessibility settings of the application, such as color scheme, font type, and font size.
 *
 * @component
 * @example
<accessibility></accessibility>
 */
export default {
    name: "Accessibility",
    data: () => ({
        //direction: 'top',
        fab: false,
        dyslexia: false,
        dark: false,
        zoomlevel: 1,
    }),

    /**
     * Mounts the component and initializes the accessibility settings.
     * - Adds "zoom-1" class to the <html> element.
     * - Retrieves the dyslexia and dark mode settings from the local storage.
     * - Sets the zoom level to the value stored in the local storage, or defaults to 1.
     */
    mounted() {
        document.getElementsByTagName("html")[0].classList.add("zoom-1");
        this.dyslexia = localStorage.getItem("dyslexia") == "true";
        this.dark = localStorage.getItem("dark") == "true";
        this.zoomlevel = localStorage.getItem("zoomlevel") ?? 1;
    },

    watch: {
        /**
         * Function to handle dyslexia accessibility feature.
         * @param {boolean} val - The value indicating whether dyslexia mode is enabled or disabled.
         */
        dyslexia(val) {
            if (val) document.querySelector("body").classList.add("dyslexic");
            else document.querySelector("body").classList.remove("dyslexic");
            localStorage.setItem("dyslexia", val);
        },

        /**
         * Sets the dark mode for the component.
         * 
         * @param {boolean} val - The value indicating whether dark mode is enabled or disabled.
         */
        dark(val) {
            // change quasar theme to dark
            this.$q.dark.set(val);
            localStorage.setItem("dark", val);
        },

        /**
         * Updates the zoom level of the component.
         * @param {number} newv - The new zoom level.
         * @param {number} oldv - The previous zoom level.
         */
        zoomlevel(newv, oldv) {
            document.getElementsByTagName("html")[0].classList.replace(`zoom-${oldv}`, `zoom-${newv}`);
            localStorage.setItem("zoomlevel", newv);
        },
    },

    methods: {
    },
};
</script>

<style lang="scss">
@import "@/assets/styles/accessibility.scss";

.rounded-fab {
    border-radius: 50% !important;
    width: 32px !important;
}
</style>