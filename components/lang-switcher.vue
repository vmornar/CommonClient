<template>
    <div>
        <q-select class="text-body2 nomy" dark color="white" v-model="$store.locale" :options="$store.localeOptions"
            dense borderless emit-value map-options options-dense
            :option-label="this.$q.screen.width >= 1024 ? 'label' : 'short_tag'"
            @update:model-value="localeChanged()" />
    </div>
</template>

<script lang='js'>
/**
 * Language switcher component.
 * 
 * @component
 * @name LangSwitcher
 * @example
 * <LangSwitcher />
 */

export default {
    name: "LangSwitcher",
    /**
     * Lifecycle hook: Called after the component has been created.
     * Sets the locale in the store to the value in local storage or 'en-US'.
     * Sets the language in Quasar to English.
     * Retrieves the locale options from the server and sets the locale in the store to the value in local storage or 'en-US'.
     * Calls the localeChanged method.
     */
    async created() {
        this.$store.locale = localStorage.getItem('locale') || 'en-US';
        this.$q.lang.set(this.$q.lang['en-us']);
        this.$store.locale = localStorage.getItem('locale') || 'en-US';
    },
    methods: {
        /**
         * Reverts the language to English.
         * Sets the locale in the store, local storage, and i18n to 'en-US'.
         * Sets the langId in the store to 1.
         * Sets the language in Quasar to English.
         */
        revertToEnglish() {
            this.$store.locale = 'en-US';
            localStorage.setItem('locale', 'en-US');
            this.$i18n.locale = 'en-US';
            this.$store.langId = 1;
            this.$q.lang.set(this.$q.lang['en-us']);
        },
        /**
         * Asynchronously changes the locale of the application.
         * If the locale options are not available or empty, the function returns early.
         * The function sets the selected locale in the local storage and updates the i18n locale.
         * It also updates the langId in the store and makes API requests to update the localization messages and Quasar language.
         * Finally, it retrieves the routes from the server and updates the store.
         * If an error occurs, it reverts to the English locale and displays the error message.
         */
        async localeChanged() {
            if (!this.$store.localeOptions || this.$store.localeOptions.length == 0) return;
            try {
                let lang = this.$store.localeOptions.find((item) => item.value == this.$store.locale);
                localStorage.setItem('locale', lang.value);
                this.$i18n.locale = lang.value;
                this.$store.langId = lang.id;

                //this.axios.API.defaults.headers["LangId"] = lang.id;
                //this.axios.APIAuth.defaults.headers["LangId"] = lang.id;
                // let langI = await import('../localization/i18n/' + lang.value + '.js'/* @vite-ignore */);
                // this.$i18n.setLocaleMessage(lang.value, langI.default);
                let langI = await this.api(this.axios.API.get, "CommonAnon/GetI18N", null, true);
                this.$i18n.setLocaleMessage(lang.value, langI);

                let langQ = await import(`../../localization/quasar/${lang.value}.mjs`);
                this.$q.lang.set(langQ.default);

                this.getRoutes();

            } catch (error) {
                this.revertToEnglish();
                this.showError(error);
            }
        }
    }
}
</script>
