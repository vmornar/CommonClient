<template>
    <div class="json-editor" @focusout="handleComponentBlur">
        <q-btn id="stringifyButton" class="stringifyButton" size="sm" round flat icon="format_align_right"
            @click.stop="stringify">
            <q-tooltip>{{ $t("Format JSON (alt-f)") }}</q-tooltip>
        </q-btn>
        <textarea ref="jsonTextarea" v-model="jsonString" @focus="stringify" @input="updateJson" :style="style"
            @keydown.tab="alignWithPreviousIndentation" />
        <autocomplete v-if="iconPicker" ref="picker" outlined popup-content-class="text-h6" v-model="chosenIcon"
            :options="$store.icons" dense options-dense clearable searchable map-options emit-value
            @update:model-value="updateIcon"></autocomplete>
        <!-- <icon-picker @update:model-value="updateIcon" label="icon" /> -->
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
        };
    },
    computed: {
        /**
         * Sets style of the component
         */
        style() {
            return {
                backgroundColor: this.error ? 'lightcoral' : 'white',
                height: this.height
            }
        },
    },
    methods: {

        /**
         * Handles the blur event of the component.
         * @param {Event} event - The blur event.
        */
        handleComponentBlur(event) {
            if (event.relatedTarget &&
                (event.relatedTarget.className === 'q-focus-helper'
                    || event.relatedTarget.id == 'stringifyButton'
                    || event.relatedTarget === this.$refs.jsonTextareas)) {
                return;
            }
            this.$emit('blur', event);
        },

        /**
         * Focuses the JSON editor.
         */
        focus() {
            this.$refs.jsonTextarea.focus();
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
            this.parse()
            this.$emit('update:modelValue', this.jsonString);
        },

        /**
         * Updates the icon.
         * @param {string} value - The value to update.
         */
        updateIcon(value) {
            this.jsonString = this.jsonString.slice(0, this.$refs.jsonTextarea.selectionStart) + value + this.jsonString.slice(this.$refs.jsonTextarea.selectionStart);
            this.updateJson();
        },

        alignWithPreviousIndentation(event) {
            // Prevent the default tab key behavior
            event.preventDefault();

            const textarea = this.$refs.jsonTextarea;
            const pos = textarea.selectionStart;
            const text = textarea.value;
            const currentLineStart = text.lastIndexOf('\n', pos - 1) + 1;
            const previousLineStart = text.lastIndexOf('\n', currentLineStart - 2) + 1;
            const previousLineIndentation = text.slice(previousLineStart).match(/^ */)[0].length;
            // Insert the indentation
            textarea.value = text.slice(0, currentLineStart) + ' '.repeat(previousLineIndentation) + text.slice(currentLineStart);
            textarea.selectionStart = textarea.selectionEnd = currentLineStart + previousLineIndentation;
        },
    },

    /**
     * Initializes the component.
     */
    async created() {
        this.stringify();
        if (this.iconPicker) {
            await this.getIcons();
        }
        window.addEventListener('keydown', this.onKeyDown);
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
</style>