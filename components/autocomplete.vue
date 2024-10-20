<template>
    <span>
        <q-select v-model="value" ref="select" class="q-ma-none q-pa-none" :options="filteredOptions"
            :option-label="optionLabel" :option-value="optionValue" :clearable="clearable" :emit-value="emitValue"
            :map-options="mapOptions" :dense="dense" :options-dense="optionsDense" :outlined="outlined" input-debounce="0"
            @focus="focus" :filled="filled" :label="label" :bg-color="bgColor" options-html display-value-html
            @popup-show="startEditing" :disable="disable" :rules="rules" :square="square" 
            style="min-width: 100px;"
            >
            <template v-slot:before-options v-if="searchable">
                <q-icon name="search" />
                <input dense ref="inputFilter" id="x" v-model="filter" style="outline: none; border:0" @keydown="keyDown" />
            </template>
            <template v-slot:append>
                <q-btn size="sm" flat dense icon="edit" @click="editLookup"/>
            </template>
        </q-select>
        
    </span>
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
        lookups: { type: Object, default: () => null },
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
        editLookup() {
            this.$store.popups.editLookup.props.tableAPI = this.lookup.refTable;
            this.$store.popups.editLookup.component = 'table'; 
            this.$store.popups.editLookup.show = true;
        },
        keyDown(e) {
            if (e.key == 'ArrowDown') {
                this.$refs.select.showPopup();
            }
        }
    },
    mounted() {
        console.log('mounted', this.lookup, this.lookups);
        let self = this;
        eventBus.on('popupClosed', async (payload) => {
            if (payload == 'editLookup') {
                console.log('closed', self.lookup, self.lookups);
                self.lookups[self.lookup.name].options = await self.loadLookup(self.lookup);
            }
        });
    },
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
