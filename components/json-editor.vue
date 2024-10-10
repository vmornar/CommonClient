<template>
    <div class="json-editor" @focusout="handleComponentBlur">
        <q-btn id="stringifyButton" class="stringifyButton" size="sm" round flat icon="format_align_right"
            @click.stop="stringify">
            <q-tooltip>{{ $t("Format JSON (alt-f)") }}</q-tooltip>
        </q-btn>
        <textarea id="jsonTextarea" ref="jsonTextarea" v-model="jsonString" @focus="stringify" @input="inputHandler" :style="style"
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
            currentWord: '',
            suggestion: '',
            filteredSuggestions: [],
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

            console.log('cursorPosition', this.suggestionsShown);
            if (this.suggestionsShown) {
                this.suggestion = this.filteredSuggestions[0];
                this.insertSuggestion();
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

        // Show suggestions
        showSuggestions() {
            this.suggestionsBox.innerHTML = '';
            this.filteredSuggestions.forEach(suggestion => {
                const div = document.createElement('div');
                div.textContent = suggestion;
                div.addEventListener('click', () => {
                    this.insertSuggestion(suggestion, cursorPosition);
                });
                this.suggestionsBox.appendChild(div);
            });
            this.suggestionsBox.style.display = this.filteredSuggestions.length ? 'block' : 'none';
        },

        // Insert the selected suggestion into the textarea
        insertSuggestion() {
            const text = this.jsonTextarea.value;
            console.log('lastWord', this.currentWord, this.cursorPosition, this.currentWord.length);
            const insertion = this.$store.suggestions.filter(x => x.key == this.suggestion)[0].value;
                        console.log('insertion', insertion);
            this.jsonTextarea.value = text.slice(0, this.cursorPosition - this.currentWord.length) + insertion + text.slice(this.cursorPosition);
            this.suggestionsBox.style.display = 'none';

            //find the position of & in the jsonTextarea, delete it and set the cursor position to the position of the & in the jsonTextarea
            this.stringify();
            this.cursorPosition = this.jsonTextarea.value.indexOf('&');
            this.jsonTextarea.value = this.jsonTextarea.value.replace('&', '');
            this.jsonTextarea.selectionStart = this.cursorPosition;
            this.jsonTextarea.selectionEnd = this.cursorPosition;
            this.jsonTextarea.focus();
        },

        inputHandler() {           
            this.cursorPosition = this.jsonTextarea.selectionStart;
            const textBeforeCursor = this.jsonTextarea.value.substring(0, this.cursorPosition);
            const words = textBeforeCursor.split(/[^a-zA-Z]+/);
            this.currentWord = words[words.length - 1];
            // Filter suggestions based on the current word
            console.log('currentWord', "'" + this.currentWord + "'");
            this.filteredSuggestions = this.keywords.filter(keyword => keyword.startsWith(this.currentWord));
            // Show suggestions near the textarea
            if (this.filteredSuggestions.length > 0) {
                const rect = this.jsonTextarea.getBoundingClientRect();
                this.suggestionsBox.style.top = `${rect.top}px`;
                this.suggestionsBox.style.left = `${rect.left}px`;
                this.showSuggestions(this.filteredSuggestions, this.cursorPosition);
                this.suggestionsShown = true;
            } else {
                this.suggestionsBox.style.display = 'none';
                this.suggestionsShown = false;
            }
            this.updateJson();
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
        }
        this.keywords = this.$store.suggestions.map(x => x.key);
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