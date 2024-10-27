<template>
    <q-card style="overflow: hidden" class="max-width" @keydown="handleSaveCancelKeydown">
        <q-card-section :style="editStyle">
            <div v-if="!multiRow" class="row text-subtitle1">{{ parent.editMode == "add" ? $t('Add row') :
                $t('Edit row')
                }}</div>
            <q-form ref="form">
                <div class="row" v-for="col in editColumns" :key="col.name">
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
                        :label="col.label" :disable="col.disabled" />
                    <autocomplete v-else-if="col.lookup && !col.invisible" v-model="parent.editingRow[col.name]"
                        :label="col.label" :options="col.lookup.options" dense style="width:95%"
                        :option-label="col.lookup.labelField" :option-value="col.lookup.valueField" emit-value
                        map-options :lookup="col.lookup" @update:model-value="selectionUpdated(col)"
                        :disable="col.disabled">
                        <template v-slot:label>
                            <label for="my-autocomplete" v-html="col.label"></label>
                        </template>
                    </autocomplete>
                    <q-input class="q-pl-sm" v-else-if="!col.invisible" id="my-input"
                        v-model="parent.editingRow[col.name]" dense style="width:95%" :label="col.label"
                        :disable="col.disabled" :rules="col.rules"
                        :type="col.password && !col.passwordShown ? 'password' : 'text'">
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
        <q-card-actions align="right">
            <span v-if="multiRow">
                <q-btn :disable="parent.editMode == 'add' || isChanged" flat color="primary" icon="add" @click="addRow" />
                <q-btn :disable="parent.editMode == 'add' || isChanged" flat color="negative" icon="delete"
                    @click="deleteRow" />
                <q-btn :disable="parent.editingRowIndex == 0" flat color="primary" icon="first_page"
                    @click="moveTo(0)" />
                <q-btn :disable="parent.editingRowIndex == 0" flat color="primary" icon="chevron_left"
                    @click="moveTo(parent.editingRowIndex - 1)" />

                <span v-if="parent.editMode == 'add'">{{$t('New record')}}</span>
                <span v-else-if="parent.rows.length > 0">{{ parent.editingRowIndex + 1 }} / {{ parent.rows.length }}</span>
                <span v-else>{{$t('No records')}}</span>

                <q-btn :disable="parent.editingRowIndex >= parent.rows.length - 1" flat color="primary"
                    icon="chevron_right" @click="moveTo(parent.editingRowIndex + 1)" />
                <q-btn :disable="parent.editingRowIndex >= parent.rows.length - 1" flat color="primary" icon="last_page"
                    @click="moveTo(parent.rows.length - 1)" />
            </span>
            <q-btn v-if="isChanged" flat color="positive" :label="$t('Save')" @click="save" />
            <q-btn v-if="isChanged" flat color="negative" :label="$t('Cancel')" @click="cancel" />
            <q-btn v-if="parent.popupName || !parent.isForm" flat color="negative" :label="$t('Close')" @click="cancel" />
        </q-card-actions>
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
            return !this.equalObjects(this.parent.editingRow, this.editingRowSaved);
        },
        editStyle() {
            return {
                maxHeight: (this.$q.screen.height - 100) + 'px', overflow: 'auto', minWidth: "600px"
            };
        },
    },
    props: ['parent', 'multiRow'],
    data() {
        return {
            editingRowSaved: {},
            editColumns: [],
        };
    },
    mounted() {
        console.log("mounted", this.parent.editingRow);
        this.copyObject(this.parent.editingRow, this.editingRowSaved);
        let ec = [...this.parent.columns];
        this.swapIdAndValColumns(ec);
        this.editColumns = ec.filter(col => this.showColInEdit(col, this.parent.masterKey));
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
                this.parent.editMode = 'edit';
            }
        },
        cancel() {
            this.copyObject(this.editingRowSaved, this.parent.editingRow);
            this.parent.editMode = 'edit';
            if (!this.multiRow || !this.isChanged)
                this.$emit('cancel');
        },
        selectionUpdated(col) {
            let displayValue = this.parent.findLookupValue(this.parent.editingRow[col.name], col.lookup);
            this.parent.editingRow[col.name + "_val"] = displayValue;
        },
        async moveTo(index) {
            await this.parent.editRow(this.parent.rows[index]);
            this.copyObject(this.parent.editingRow, this.editingRowSaved);
            console.log("moveTo", index, this.isChanged, this.parent.editingRow, this.editingRowSaved);
        },
        addRow() {
            this.parent.addRow();
            this.copyObject(this.parent.editingRow, this.editingRowSaved);
        },
        async deleteRow() {
            if (await this.parent.deleteRow(this.parent.rows[this.parent.editingRowIndex])) {
                if (this.parent.rows.length == 0) {
                    this.addRow();
                    return;
                } else if (this.parent.editingRowIndex >= this.parent.rows.length) {
                    this.parent.editingRowIndex--;
                }
                await this.parent.editRow(this.parent.rows[this.parent.editingRowIndex]);
                this.copyObject(this.parent.editingRow, this.editingRowSaved);
            } 
        }
    }
};
</script>