<template>
    <div class="json-editor" @focusout="handleComponentBlur">
        <q-btn id="stringifyButton" class="stringifyButton" size="sm" round flat icon="format_align_right"
            @click.stop="stringify">
            <q-tooltip>{{ $t("Format JSON (alt-f)") }}</q-tooltip>
        </q-btn>
        <textarea id="jsonTextarea" ref="jsonTextarea" v-model="jsonString" @focus="stringify" @input="updateJson" :style="style"
            @keydown.tab="alignWithPreviousIndentation" />
        <autocomplete v-if="iconPicker" ref="picker" outlined popup-content-class="text-h6" v-model="chosenIcon"
            :options="$store.icons" dense options-dense clearable searchable map-options emit-value
            @update:model-value="updateIcon"></autocomplete>
        <!-- <icon-picker @update:model-value="updateIcon" label="icon" /> -->
    </div>
    <div id="suggestionsBox" ref="suggestionsBox"></div>
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
            suggestionsShown: false,
            jsonTextarea: null,
            suggestionsBox: null,
            keys: [],
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
                    || event.relatedTarget === this.jsonTextarea)) {
                return;
            }
            this.$emit('blur', event);
        },

        /**
         * Focuses the JSON editor.
         */
        focus() {
            this.jsonTextarea.focus();
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
            this.inputHandler();
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

            const pos = this.jsonTextarea.selectionStart;
            const text = this.jsonTextarea.value;
            const currentLineStart = text.lastIndexOf('\n', pos - 1) + 1;
            const previousLineStart = text.lastIndexOf('\n', currentLineStart - 2) + 1;
            const previousLineIndentation = text.slice(previousLineStart).match(/^ */)[0].length;
            // Insert the indentation
            jsonTextarea.value = text.slice(0, currentLineStart) + ' '.repeat(previousLineIndentation) + text.slice(currentLineStart);
            jsonTextarea.selectionStart = jsonTextarea.selectionEnd = currentLineStart + previousLineIndentation;
        },

        // Show suggestions
        showSuggestions(filteredSuggestions, cursorPosition) {
            this.suggestionsBox.innerHTML = '';
            filteredSuggestions.forEach(suggestion => {
                const div = document.createElement('div');
                div.textContent = suggestion;
                div.addEventListener('click', () => {
                    this.insertSuggestion(suggestion, cursorPosition);
                });
                this.suggestionsBox.appendChild(div);
            });
            this.suggestionsBox.style.display = filteredSuggestions.length ? 'block' : 'none';
        },

        // Insert the selected suggestion into the textarea
        insertSuggestion(suggestion, cursorPosition) {
            const text = this.jsonTextarea.value;
            const words = text.substring(0, cursorPosition).split(/\s+/);  // Get the current word
            const lastWord = words[words.length - 1];
            console.log('suggestion', suggestion, this.$store.suggestions.filter(x => x.key == suggestion));
            const insertion = this.$store.suggestions.filter(x => x.key == suggestion)[0].value;
                        console.log('insertion', insertion);
            this.jsonTextarea.value = text.slice(0, cursorPosition - lastWord.length + 1) + insertion + text.slice(cursorPosition);
            suggestionsBox.style.display = 'none';

            //find the position of & in the jsonTextarea, delete it and set the cursor position to the position of the & in the jsonTextarea
            this.parse();
            cursorPosition = this.jsonTextarea.value.indexOf('&');
            this.jsonTextarea.value = this.jsonTextarea.value.replace('&', '');
            this.jsonTextarea.selectionStart = cursorPosition;
            this.jsonTextarea.selectionEnd = cursorPosition;
            this.jsonTextarea.focus();
        },

        inputHandler() {
            
            let cursorPosition = this.jsonTextarea.selectionStart;
            const textBeforeCursor = this.jsonTextarea.value.substring(0, cursorPosition);
            const words = textBeforeCursor.split(/[^a-zA-Z]+/);
            const currentWord = words[words.length - 1];
            // Filter suggestions based on the current word
            const filteredSuggestions = this.keywords.filter(keyword => keyword.startsWith(currentWord));
            // Show suggestions near the textarea
            if (filteredSuggestions.length > 0) {
                const rect = this.jsonTextarea.getBoundingClientRect();
                this.suggestionsBox.style.top = `${rect.top}px`;
                this.suggestionsBox.style.left = `${rect.left}px`;
                this.showSuggestions(filteredSuggestions, cursorPosition);
            } else {
                this.suggestionsBox.style.display = 'none';
            }
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
        if (!this.$store.suggestions) {
            let data = await this.get('Table/meta_suggestion');
            this.$store.suggestions = this.frugalJsonToArray(data);
            this.keywords = this.$store.suggestions.map(x => x.key);
            console.log(this.keywords, this.$store.suggestions);
        }
        await this.$nextTick();
        this.jsonTextarea = this.$refs.jsonTextarea;
        this.suggestionsBox = this.$refs.suggestionsBox;
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

#suggestionsBox {
    position: absolute;
    border: 1px solid #ccc;
    max-height: 150px;
    overflow-y: auto;
    background-color: white;
    display: none;
}

#suggestionsBox div {
    padding: 8px;
    cursor: pointer;
}

#suggestionsBox div:hover {
    background-color: #f0f0f0;
}

</style>