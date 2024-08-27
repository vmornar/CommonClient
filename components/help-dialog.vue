<template>
    <q-dialog @keydown.native="closeDialog($event)" @hide="closeDialog(null)" v-model="$store.popups.help.show"
        :max-width="computedOptions.width" :style="{ zIndex: computedOptions.zIndex }">
        <q-card class="max-width" v-if="edit">
            <html-editor v-model="helpTextEdit" saveCancel @save="saveHelp" @cancel="edit = false" />
        </q-card>
        <q-card v-else class="max-width">
            <q-toolbar dark :color="computedOptions.color" dense flat>
                <q-toolbar-title class="white--text text-subtitle1">{{ $store.popups.help.caption }}</q-toolbar-title>
                <q-btn v-if="isAdmin" round margin="xs" size="sm" padding="xs" icon="edit" @click="edit = true" />
                <q-btn round margin="xs" size="sm" padding="xs" icon="close" @click="closeDialog(null)" />
            </q-toolbar>
            <q-card-section>
                <div class="text-body2" v-html="replaceIcons($store.popups.help.text)"></div>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>
<script>

/**
 * Represents the help dialog component.
 * 
 * @component
 * @name HelpButton
 * @example
 * <HelpDialog />
 */
import { loadComponent } from '@/common/component-loader';

export default {
    name: "HelpDialog",
    components: {
        HtmlEditor: loadComponent('html-editor'),
    },
    props: {
        name: String,
        options: {},
        titleToShow: String,
    },
    watch: {
        edit: function (val) {
            this.helpTextEdit = this.$store.popups.help.text;  //this.helpText;
        }
    },
    data: () => ({
        //helpText: "",
        helpTextEdit: "",
        caption: null,
        edit: false,
        computedOptions: {
            color: "primary",
            width: "unset",
            zIndex: 9999,
        },
    }),
    mounted() {
        Object.assign(this.computedOptions, this.options);
    },
    methods: {

        /**
         * Saves the help information.
         *
         * @param {Object} help - The help information to be saved.
         * @returns {Promise} - A promise that resolves when the help information is saved successfully.
         */
        async saveHelp(help) {
            await this.put("CommonUser/SetHelp/" + this.$store.popups.help.name, { help: help });
            //this.helpText = this.replaceIcons(help);
            this.$store.popups.help.text = help;
            this.edit = false;
        },

        /**
         * Closes the dialog.
         */
        closeDialog(event) {
            if (event == null || event.key == "Escape") {
                if (event) event.stopPropagation();
                this.$store.popups.help.show = false;
                this.edit = false;
            }
        },
    },
};
</script>
