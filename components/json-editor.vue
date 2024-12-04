<template>
    <div class="json-editor" @focusout="handleComponentBlur">
        <q-btn id="stringifyButton" class="stringifyButton" size="sm" round flat icon="format_align_right"
            @click.stop="stringify">
            <q-tooltip>{{ $t("Format JSON (alt-f)") }}</q-tooltip>
        </q-btn>
        <textarea id="jsonTextarea" ref="jsonTextarea" v-model="jsonString" @focus="stringify" @input="inputHandler"
            :style="style" @keydown.tab="alignWithPreviousIndentation" />
        <autocomplete v-if="iconPicker" ref="picker" outlined popup-content-class="text-h6" v-model="chosenIcon"
            :options="$store.icons" dense options-dense clearable searchable map-options emit-value
            @update:model-value="updateIcon"></autocomplete>
        <!-- <icon-picker @update:model-value="updateIcon" label="icon" /> -->
        <!-- <q-select ref="suggestionsBox" v-model="suggestion" :options="filteredSuggestions" options-dense
            label="Select a suggestion" style="position: absolute; top: 25px; right: 5px" dense
            @update:model-value="insertSuggestion(suggestion)" /> -->
        <q-list dense bordered
            style="font-size: small; position:absolute; top: 30px; right: 0px; max-height: 300px; overflow-y: auto">
            <q-item class="q-pa-none q-ma-none" v-for="suggestion in filteredSuggestions" :key="suggestion" clickable
                @click="insertSuggestion(suggestion)" dense>
                <q-item-section class="q-pa-none q-ma-none">{{ suggestion }}</q-item-section>
            </q-item>
        </q-list>
    </div>
</template>

<script>

/**
 * Simple JSON editor component.
 * 
 * @component
 * @name JsonEditor
 * @example
 * <JsonEditor />
 */

//import iconPicker from './icon-picker.vue';
import { loadComponent } from '@/common/component-loader';
export default {
    name: "JsonEditor",
    components: {
        // iconPicker
        autocomplete: loadComponent('autocomplete'),
    },
    props: {
        modelValue: {
            type: String
        },
        height: {
            type: String,
            default: "500px"
        },
        width: {
            type: String,
            default: "100%"
        },
        indent: {
            type: Number,
            default: 2
        },
        iconPicker: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            chosenIcon: '',
            jsonString: '',
            error: false,
            parsedJson: null,
            suggestionsShown: false,
            jsonTextarea: null,
            // suggestionsBox: null,
            keys: [],
            currentWord: '',
            filteredSuggestions: [],
            suggestion: null,
            // & denotes the cursor position after the suggestion is inserted
            // keys without values by default have value of "key" : "&"
            suggestions: [{ key: "allowDelete", value: '"allowDelete" : false&' },
            { key: "allowEdit", value: '"allowEdit" : false&' },
            { key: "colAtts", value: '"colAtts" : { "&" : { "" : ""} } ' },
            { key: "component" },
            { key: "conditionalConfirmationMessage", value: '"conditionalConfirmationMessage" : { "condition" : "return exp(row,columns)&", "message" : "" }}' },
            { key: "confirmationMessage" },
            { key: "contextValues", value: '"contextValues" : [ {"label" : "", "name" : "", "lookup" : "", "width" : "" } ]' },
            { key: "customFunction" },
                { key: "dbFunction" },
                        { key: "details", value: '"popup" : "default", "component" : "details", "masterKey": "&", "masterValue": "{{id}}", "asForm": false, "details": [ "title": "", { "name": "", "tableAPI": "", "tableAPIKey": "{{id}}"}]' },
            { key: "deleteInStore", value: '"deleteInStore" : true&' },
            { key: "details", value: '"details": [ { "name": "&", "tableAPI": "" } ]' },
            { key: "disabled", value: '"disabled" : true&' },
            { key: "enabled", value: '"enabled" : true&'},
            { key: "doNotMaximize", value: '"doNotMaximize" : true&' },
            { key: "defaultPrevious", value: '"defaultPrevious" : true&' },            
            { key: "exportPreprocess" },
            { key: "frugal", value: '"frugal" : true&' },
                { key: "icon" },
            { key: "isA", value: '"isA": { "column": "&", "masterKey": "", "specializations": { "1": "schema_table" } }' }, 
            { key: "invisible", value: '"invisible" : true&' },
            { key: "json", value: '"json" :true&' },
                { key: "label" },
                            { key: "maximized", value: '"maximized" : true&' },
            { key: "method" },
            { key: "mustSelectRows", value: '"mustSelectRows" : true&"' },
            { key: "name" },
            { key: "noAdd", value: '"noAdd" : true&' },
            { key: "noDelete", value: '"noDelete" : true&' },
            { key: "noEdit", value: '"noEdit" : true&' },
            { key: "noInlineEditing", value: '"noInlineEditing" : true&' },
            { key: "params", value: '"params" : { "&" : "" }' },
            { key: "reload", value: '"reload" : true&' },
            { key: "restAPI " },
            { key: "route" },
            { key: "rowActions", value: ' "rowActions" : [{ & }] ' },
            { key: "selection", value: '"selection" : "multiple"' },
            { key: "store.globalValues", value: '"store.globalValues" : { "&", "" }' },
            { key: "tableActions", value: ' "tableActions" : [{ & }] ' },
            { key: "title" },
            { key: "toolbar" },
            { key: "toolbarCloseable", value: '"toolbarCloseable" : true&' },
                { key: "tooltip" },
            { key: "upload", value: '"icon": "upload", "tooltip": "Upload...", "component": "file-uploader", "title": "Upload...", "uploadURL": "", "params": { }' },
            { key: "visible", value: '"visible" : true&' },
            { key: "width" }],
        };
    },
    computed: {
        /**
         * Sets style of the component
         */
        style() {
            return {
                backgroundColor: this.error ? 'lightcoral' : 'white',
                height: this.height,
                width: this.width,
                minWidth: '400px',
            }
        },
    },
    methods: {

        /**
         * Handles the blur event of the component.
         * @param {Event} event - The blur event.
        */
        handleComponentBlur(event) {
            if (this.suggestionsShown) return;
            if (event.relatedTarget &&
                (event.relatedTarget.className === 'q-focus-helper'
                    || event.relatedTarget.id == 'stringifyButton'
                    || event.relatedTarget === this.jsonTextarea)) {
                return;
            }
            this.$emit('blur', event);
        },

        /**
         * Focuses the JSON editor.
         */
        focus() {
            this.$nextTick(() => {
                this.jsonTextarea.focus();
            });
            //this.jsonTextarea.focus();
        },

        /**
         * Displays JSON in a formatted way.
         * @param {string} jsonString - The JSON string to format.
         */
        onKeyDown(event) {
            if (event.altKey && event.key === 'f') {
                if (!this.error) {
                    this.stringify();
                    event.preventDefault();
                }
            }
        },

        /**
         * Parses the JSON string.
         */
        parse() {
            try {
                this.parsedJson = JSON.parse(this.jsonString);
                this.error = false;
            } catch (error) {
                this.error = true;
            }
            return !this.error;
        },

        /**
         * Stringifies the JSON string.
         */
        stringify() {
            this.jsonString = this.modelValue?.toString();
            if (this.parse()) {
                this.jsonString = JSON.stringify(this.parsedJson, null, this.indent);
            }
        },

        /**
         * Updates the JSON string.
         * @param {Event} event - The input event.
         */
        updateJson(event) {
            this.parse();
            this.$emit('update:modelValue', this.jsonString);
        },

        /**
         * Updates the icon.
         * @param {string} value - The value to update.
         */
        updateIcon(value) {
            this.jsonString = this.jsonString.slice(0, this.jsonTextarea.selectionStart) + value + this.jsonString.slice(this.jsonTextarea.selectionStart);
            this.updateJson();
        },

        /**
         * Aligns the current line's indentation with the previous line's indentation
         * when the tab key is pressed.
         *
         * @param {Event} event - The keyboard event triggered by pressing the tab key.
         * @returns {void}
         */
        alignWithPreviousIndentation(event) {
            // Prevent the default tab key behavior
            event.preventDefault();
            event.stopPropagation();

            if (this.suggestionsShown) {
                this.insertSuggestion(this.filteredSuggestions[0]);
            } else {
                const text = this.jsonTextarea.value;
                const pos = this.jsonTextarea.selectionStart;
                const currentLineStart = text.lastIndexOf('\n', pos - 1) + 1;
                const previousLineStart = text.lastIndexOf('\n', currentLineStart - 2) + 1;
                const previousLineIndentation = text.slice(previousLineStart).match(/^ */)[0].length;
                // Insert the indentation
                jsonTextarea.value = text.slice(0, currentLineStart) + ' '.repeat(previousLineIndentation) + text.slice(currentLineStart);
                jsonTextarea.selectionStart = jsonTextarea.selectionEnd = currentLineStart + previousLineIndentation;
            }
        },

        // Insert the selected suggestion into the textarea
        insertSuggestion(suggestion) {
            const text = this.jsonTextarea.value;
            const insertion = this.suggestions.filter(x => x.key == suggestion)[0].value;
            this.jsonTextarea.value = text.slice(0, this.cursorPosition - this.currentWord.length) + insertion + text.slice(this.cursorPosition);
            this.cursorPosition = this.jsonTextarea.value.indexOf('&');
            this.jsonTextarea.value = this.jsonTextarea.value.replace('&', '');
            this.jsonTextarea.selectionStart = this.jsonTextarea.selectionEnd = this.cursorPosition;
            this.jsonTextarea.focus();
            this.jsonString = this.jsonTextarea.value;
            this.$emit('update:modelValue', this.jsonString);
            this.suggestionsShown = false;
            this.filteredSuggestions = [];
            this.parse();
        },

        async inputHandler(event) {
            this.cursorPosition = this.jsonTextarea.selectionStart;
            const textBeforeCursor = this.jsonTextarea.value.substring(0, this.cursorPosition);
            const words = textBeforeCursor.split(/[^a-zA-Z\*]+/);
            this.currentWord = words[words.length - 1];
            // Filter suggestions based on the current word
            if (this.currentWord.length < 1) {
                this.filteredSuggestions = [];
            } else if (this.currentWord == "*") {
                this.filteredSuggestions = this.keywords;
            } else {
                this.filteredSuggestions = this.keywords.filter(keyword => keyword.includes(this.currentWord)).sort();
            }

            // Show suggestions near the textarea
            if (this.filteredSuggestions.length > 0) {
                this.suggestionsShown = true;
            } else {
                this.suggestionsShown = false;
            }
            this.parse();
            this.$emit('update:modelValue', this.jsonString);
        }
    },

    /**
     * Initializes the component.
     */
    async mounted() {
        this.stringify();
        if (this.iconPicker) {
            await this.getIcons();
        }
        window.addEventListener('keydown', this.onKeyDown);
        for (let s of this.suggestions) {
            if (!s.value) s.value = `"${s.key}" : "&"`;
        }
        this.keywords = this.suggestions.map(x => x.key);
        await this.$nextTick();
        this.jsonTextarea = this.$refs.jsonTextarea;
        await this.$nextTick();
    }
};
</script>


<style scoped>
.json-editor {
    position: relative;
    width: 100%;
}

textarea {
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 0;
    outline: none;
}

.stringifyButton {
    position: absolute;
    top: 3px;
    right: 13px;
    z-index: 99999;
}

textarea {
    font-family: 'Consolas';
    font-size: 'medium';
}

textarea:focus {
    outline: auto;
    outline-color: rgb(140, 140, 207);
    outline-width: 1px;
    border: 1px solid #ccc;
    border-radius: 0;
    transition: outline-color 0.3s ease;
}

.suggestionsBox {
    position: absolute;
    border: 1px solid #ccc;
    max-height: 150px;
    overflow-y: auto;
    background-color: white;
    display: none;
    cursor: pointer;
}

.suggestionsBox div {
    padding: 8px;
    cursor: pointer;
}

.suggestionsBoxElement:hover {
    background-color: #868585;
}
</style>