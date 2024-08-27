<template>
    <q-select v-model="value" ref="select" class="q-ma-none q-pa-none" :options="filteredOptions"
        :option-label="optionLabel" :option-value="optionValue" :clearable="clearable" :emit-value="emitValue"
        :map-options="mapOptions" :dense="dense" :options-dense="optionsDense" :outlined="outlined" input-debounce="0"
        @focus="focus" :filled="filled" :label="label" :bg-color="bgColor" options-html display-value-html
        @popup-show="startEditing" :disable="disable">
        <template v-slot:before-options v-if="searchable">
            <q-icon name="search" />
            <input dense ref="inputFilter" id="x" v-model="filter" style="outline: none; border:0" @keydown="keyDown" />
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
        bgColor: { type: String, default: "white" },
        modelValue: { type: [String, Number, Array, Object, Boolean], default: null }
    },
    emits: ["update:modelValue"],
    data() {
        return {
            filter: '',
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
            let f = this.options.filter(option =>
                option[this.optionLabel].toLowerCase().includes(this.filter.toLowerCase())
            );
            if (f.length == 0) {
                return this.options;
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
        async focus() {
            this.$refs.select.focus();
        },
    },
}
</script>
<style scoped>
input:focus {
    outline: none;
}
</style>
