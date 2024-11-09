<template>
    <q-select v-model="value" ref="select" class="q-ma-none q-pa-none" :options="filteredOptions"
        :option-label="optionLabel" :option-value="optionValue" :clearable="clearable" :emit-value="emitValue"
        :map-options="mapOptions" :dense="dense" :options-dense="optionsDense" :outlined="outlined" input-debounce="0"
        :filled="filled" :label="label" :bg-color="bgColor" options-html display-value-html @popup-show="startEditing"
        :disable="disable" :rules="rules" :square="square" style="min-width: 100px;" @focus="handleFocus(0)"
        @blur="handleBlur(0)" @keydown="keyDownSel">
        <template v-slot:before-options v-if="searchable">
            <q-icon name="search" />
            <input dense ref="inputFilter" id="x" v-model="filter" style="outline: none; border:0"
                @focus="handleFocus(1)" @blur="handleBlur(1)" @keydown="keyDown" />
            <q-btn v-if="lookup && lookup.refTable" class="q-pa-none q-ma-none" size="sm" flat dense icon="edit"
                @click="editLookup" @focus="handleFocus(2)" @blur="handleBlur(2)" />
        </template>
    </q-select>
</template>

<script>
/**
 * Autocomplete component for selecting options from a dropdown list.
 *
 * @component Autocomplete
 *
 */
import eventBus from '@/common/event-bus';
export default {
    name: "Autocomplete",
    props: {
        disable: { type: Boolean, default: false },
        searchable: { type: Boolean, default: true },
        clearable: { type: Boolean, default: true },
        emitValue: { type: Boolean, default: false },
        mapOptions: { type: Boolean, default: false },
        optionsDense: { type: Boolean, default: true },
        outlined: { type: Boolean, default: true },
        options: { type: Array, default: () => [] },
        optionLabel: { type: String, default: "label" },
        optionValue: { type: String, default: "value" },
        filled: { type: Boolean, default: true },
        dense: { type: Boolean, default: true },
        label: { type: String, default: undefined },
        bgColor: { type: String },
        modelValue: { type: [String, Number, Array, Object, Boolean], default: null },
        rules: { type: Array, default: () => [] },
        square: { type: Boolean, default: true },
        lookup: { type: Object, default: () => null },
        refTable: { type: String, default: null }
    },
    emits: ["update:modelValue", "blur"],
    data() {
        return {
            filter: '',
            focusedChildren: [false, false, false]
        }
    },
    computed: {
        value: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        },

        /**
         * Returns the filtered options based on the input value.
         * @returns {Array} The filtered options.
         */
        filteredOptions() {
            let options = this.lookup ? this.lookup.options : this.options;
            if (!this.filter) {
                return options;
            }
            let f = options.filter(option =>
                option[this.optionLabel].toLowerCase().includes(this.filter.toLowerCase())
            );
            if (f.length == 0) {
                return options;
            } else {
                return f;
            }
        }
    },

    methods: {
        /**
         * Starts the editing process.
         */
        async startEditing() {
            if (this.searchable) {
                this.$nextTick(() => {
                    this.filter = "";
                    this.$refs.inputFilter.focus();
                });
            }
        },

        /**
         * Focuses the input field.
         */
        focus() {
            this.$refs.select.focus();
            this.$refs.select.showPopup();
            this.$refs.select.setOptionIndex(-1);
        },

        /**
         * Handles the focus event - sets the focusedChildren array.
         * @param key 
         */
        handleFocus(key) {
            //return;
            if (key == 0) {
                this.$refs.select.focus();
            }
            this.focusedChildren[key] = true;
        },

        /**
         * Handles the blur event - sets the focusedChildren array.
         * @param key 
         */
        handleBlur(key) {
            //return;
            this.focusedChildren[key] = false;
            if (this.focusedChildren.every(e => !e)) {
                this.$refs.select.hidePopup();
                this.$emit('blur');
            }
        },

        /**
         * Opens the edit lookup popup.
         */
        editLookup() {
            this.$refs.select.hidePopup();
            this.$store.popups.editLookup.props.tableAPI = this.lookup.refTable;
            this.$store.popups.editLookup.component = 'table';
            this.$store.popups.editLookup.show = true;
        },

        /**
         * Handles the key down event (arrow down - shows the popup and focuses the first option).
         * @param {Event} e - The key down event.
         */
        keyDown(e) {
            if (e.key == 'ArrowDown') {
                this.$refs.select.showPopup();
                this.$refs.select.setOptionIndex(0);
            }
            // if (e.key == 'Enter') {
            //     console.log("oi", this.value, this.filteredOptions[0]);
            //     if (this.mapOptions) {
            //         this.value = this.filteredOptions[0][this.optionValue];
            //     } else {
            //         this.value = this.filteredOptions[0];
            //     }
            // }
        },

        /**
         * Handles the key down event (arrowUp - sets focust to input if necessary).
         * @param {Event} e - The key down event.
         */
        keyDownSel(e) {
            if (e.key == 'ArrowUp') {
                console.log("oi", this.$refs.select.getOptionIndex());
                if (this.$refs.select.getOptionIndex() == 0) {
                    this.$refs.inputFilter.focus();
                }
            }
        }
    },

    /**
     * Mounted lifecycle method - initializes the component and creates an event listener.
     */
    async mounted() {
        eventBus.on('popupClosed', async (payload) => {
            if (payload == 'editLookup') {
                if (this.lookup) {
                    await this.loadLookup(this.lookup);
                }
            }
        });
        await this.$nextTick();
    },

    /**
     * Before unmount lifecycle method - removes the event listener.
     */
    beforeUnmount() {
        eventBus.off('popupClosed');
    }
}
</script>
<style scoped>
input:focus {
    outline: none;
}
</style>
