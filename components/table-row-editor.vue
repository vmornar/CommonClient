<template>

    <q-card flat style="display: flex; flex-direction: column" v-if="loaded" class="max-width" @keydown="handleSaveCancelKeydown">
        <!-- <q-card-section :style="editStyle" v-if="!multiRow">
            {{ parent.editMode == "add" ? $t('Add row') :
                $t('Edit row')
                }}
        </q-card-section> -->
        <q-card-actions v-if="!parent.asForm">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; min-width: 600px;">
                <div>
                {{ parent.editMode == "add" ? $t('Add row') :
                    $t('Edit row')
                    }}
                </div>	
                <!-- <span v-if="multiRow">
                    <q-btn :disable="parent.editMode == 'add' || isChanged || rows.length == 0" flat color="negative" icon="delete"
                        @click="deleteRow" />
                    <q-btn :disable="isChanged || editingRowIndex == 0" flat color="primary" icon="first_page"
                        @click="moveTo(0)" />
                    <q-btn :disable="isChanged || editingRowIndex == 0" flat color="primary" icon="chevron_left"
                        @click="moveTo(editingRowIndex - 1)" />

                    <span v-if="parent.editMode == 'add'">{{$t('New record')}}</span>
                    <span v-else-if="rows.length > 0">{{ editingRowIndex + 1 }} / {{ rows.length }}</span>
                    <span v-else>{{$t('No records')}}</span>

                    <q-btn :disable="isChanged || editingRowIndex >= rows.length - 1" flat color="primary"
                        icon="chevron_right" @click="moveTo(editingRowIndex + 1)" />
                    <q-btn :disable="isChanged || editingRowIndex >= rows.length - 1" flat color="primary" icon="last_page"
                        @click="moveTo(rows.length - 1)" />
                </span> -->
                <div>
                <q-btn dense v-if="isChanged && !parent.asForm" flat icon="save" color="positive" :label="$t('Save')" @click="save" />
                <q-btn dense v-if="isChanged && !parent.asForm" flat icon="undo" color="negative" :label="$t('Undo')" @click="cancel" />
                <q-btn dense v-if="!isChanged && (parent.popupName || !parent.asForm)" flat icon="close" color="negative" :label="$t('Close')" @click="close" />
                </div>
            </div>
        </q-card-actions>
        <q-card-section style="flex-grow: 1; overflow-y: auto;">
            <q-form class="q-mt-none" ref="form">
                <div :class="{ row: true, 'form-disabled': rows && rows.length == 0 && parent.editMode != 'add'}" v-for="col in editColumns" :key="col.name">
                    <span v-if="col.type == 'boolean' && !col.invisible" style="width:90%">
                        <q-checkbox v-model="parent.editingRow[col.name]" dense :label="col.label"
                            :disable="col.disabled">
                            <template v-slot:label>
                                <label for="my-checkbox" v-html="col.label"></label>
                            </template>
                        </q-checkbox>
                    </span>
                    <span v-else-if="col.type == 'json' && !col.invisible" style="width:90%">
                        <label for="my-jsoneditor" v-html="col.label"></label>
                        <json-editor v-model="parent.editingRow[col.name]" :rows="15" iconPicker
                            :disable="col.disabled" />
                    </span>
                    <html-editor v-else-if="col.type == 'html' && !col.invisible" style="width:90%"
                        v-model="parent.editingRow[col.name]" :height="editStyle.height" :showIconPicker="false"
                        :label="col.label" :disable="col.disabled" ref="inputRefs" />
                    <autocomplete v-else-if="col.lookup && !col.invisible" v-model="parent.editingRow[col.name]"
                        :label="col.label" :options="col.lookup.options" dense style="width:95%"
                        :option-label="col.lookup.labelField" :option-value="col.lookup.valueField" emit-value
                        map-options :lookup="col.lookup" @update:model-value="selectionUpdated(col)"
                        :disable="col.disabled" ref="inputRefs">
                        <template v-slot:label>
                            <label for="my-autocomplete" v-html="col.label"></label>
                        </template>
                    </autocomplete>
                    <q-input class="q-pl-sm" v-else-if="!col.invisible" id="my-input"
                        v-model="parent.editingRow[col.name]" dense style="width:95%" :label="col.label"
                        :disable="col.disabled" :rules="col.rules"
                        :type="col.password && !col.passwordShown ? 'password' : 'text'" ref="inputRefs">
                        <template v-slot:label>
                            <label for="my-input" v-html="col.label" style="font-size: smaller;"></label>
                        </template>
                        <template v-slot:append v-if="col.password">
                            <q-icon :name="col.passwordShown ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                @click="col.passwordShown = !col.passwordShown"></q-icon>
                        </template>
                    </q-input>
                </div>
            </q-form>
        </q-card-section>

    </q-card>
</template>
<script>
import { loadComponent } from '@/common/component-loader';
export default {
    name: "TableRowEditor",
    components: {
        jsonEditor: loadComponent('json-editor'),
        autocomplete: loadComponent('autocomplete'),
        htmlEditor: loadComponent('html-editor')
    },
    computed: {
        isChanged() {
            this.$store.formChanged = !this.equalObjects(this.parent.editingRow, this.editingRowSaved);
            return this.$store.formChanged;
        },
        editStyle() {
            return {
                maxHeight: (this.$q.screen.height - 100) + 'px', overflow: 'auto', minWidth: "600px"
            };
        },
    },
    watch: {
        "rows.length": async function (val) {
            //this.$emit('update:modelValue', val);
            if (val == 0) {
                this.parent.editingRow = this.parent.createEmptyRow(this.parent.columns);
            } else {
                if (this.editingRowIndex >= this.rows.length) this.editingRowIndex = this.rows.length - 1;
                await this.parent.editRow(this.rows[this.editingRowIndex]);
            }
            this.copyObject(this.parent.editingRow, this.editingRowSaved);
        }
    },
    props: ['parent', 'multiRow', 'rows'],
    data() {
        return {
            editingRowSaved: {},
            editColumns: [],
            loaded: false,
            editingRowIndex: 0
        };
    },
    async mounted() {
        if (this.multiRow) {
            if (this.parent.rows.length > 0) {
                await this.parent.editRow(this.parent.rows[0]);
            } else {
                await this.parent.loadLookups();
                this.parent.editingRow = this.parent.createEmptyRow(this.parent.columns);
            }
        }
        this.copyObject(this.parent.editingRow, this.editingRowSaved);
        let ec = [...this.parent.columns];
        this.swapIdAndValColumns(ec);
        this.editColumns = ec.filter(col => this.showColInEdit(col, this.parent.masterKey));
        this.loaded = true;   
        this.$nextTick(() => {
            this.$refs.inputRefs[0].focus();
        });
    },
    methods: {       
        /**
         * Determines whether a column should be shown in edit mode.
         * @param {Object} col - The column object.
         * @returns {boolean} - True if the column should be shown in edit mode, false otherwise.
         */
        showColInEdit(col, masterKey) {
            return col.name != 'id' && !col.name.endsWith('_val') && col.name != masterKey;
        },
        async save() {
            if (await this.parent.validateForm(this.$refs.form)) {
                this.$emit('save');
                this.copyObject(this.parent.editingRow, this.editingRowSaved);
                if (this.parent.editMode == "add") this.editingRowIndex = this.rows.length;
                this.parent.editMode = 'edit';
            }
        },
        close () {
            this.$emit('cancel');
        },
        cancel() {
            this.copyObject(this.editingRowSaved, this.parent.editingRow);
            this.parent.editMode = 'edit';
        },
        selectionUpdated(col) {
            let displayValue = this.parent.findLookupValue(this.parent.editingRow[col.name], col.lookup);
            this.parent.editingRow[col.name + "_val"] = displayValue;
        },
        async moveTo(index) {
            await this.parent.editRow(this.rows[index]);
            this.editingRowIndex = index;
            this.copyObject(this.parent.editingRow, this.editingRowSaved);
        },
        addRow() {
            this.parent.addRow();
            this.editingRowIndex = this.rows.length - 1;
            this.copyObject(this.parent.editingRow, this.editingRowSaved);
        },
        async deleteRow() {
            if (await this.parent.deleteRow(this.rows[this.editingRowIndex])) {
                if (this.rows.length == 0) {
                    this.parent.editingRow = this.parent.createEmptyRow(this.parent.columns);
                } else if (this.editingRowIndex >= this.rows.length) {
                    this.editingRowIndex--;
                    await this.parent.editRow(this.rows[this.editingRowIndex]);
                }
                this.copyObject(this.parent.editingRow, this.editingRowSaved);
            } 
        }
    }
};
</script>

<style scoped>
.form-disabled * {
  pointer-events: none;
  opacity: 0.8;
}
</style>