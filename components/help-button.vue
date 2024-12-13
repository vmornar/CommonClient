<template>
    <div>
        <q-btn class="q-ml-lg" round padding="xs" size="sm" color="primary" @click.stop="onClick" icon="question_mark">
            <q-tooltip>{{ $t("Help") }}</q-tooltip>
        </q-btn>
    </div>
</template>
<script>
export default {
    /**
     * Represents the help button component.
     * 
     * @component
     * @name HelpButton
     * @example
     * <HelpButton :name="name" :options="options" :titleToShow="titleToShow" />
     */
    name: "HelpButton",
    props: {
        name: String,
        options: {},
        titleToShow: String,
    },
    methods: {

        /**
         * Handles the click event for the help button.
         * @async
         * @returns {Promise<void>}
         */
        async onClick() {
            let name = this.name ?? this.$route.name;
            let response = await this.get("CommonAnon/GetHelp/" + name.replaceAll("/", ""));
            if (response && response.help) {
                this.$store.popups.help.text = response.help;
            } else {
                this.$store.popups.help.text = this.$t("No help yet");
            }
            this.$store.popups.help.name = name.replaceAll("/", "");
            this.$store.popups.help.caption = this.titleToShow;
            this.$store.popups.help.show = true;
        },
    },
};
</script>
