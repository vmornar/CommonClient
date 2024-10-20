<template>
    <q-dialog :model-value="true" @keydown="handleSaveCancelKeydown" persistent>
        <q-card style="overflow: hidden" class="max-width">
            <q-card-section :style="editStyle">
                <div class="row text-subtitle1">{{ parent.editMode == "add" ? $t('Add row') :
        $t('Edit row')
                    }}</div>
                <q-form ref="form">
                    <div class="row" v-for="col in parent.editColumns" :key="col.name">
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
                            :label="col.label" :options="parent.lookups[col.lookup.name].options" dense 
                            style="width:95%" :option-label="parent.lookups[col.lookup.name].labelField"
                            :option-value="parent.lookups[col.lookup.name].valueField" emit-value map-options
                            :lookup="col.lookup" :lookups="parent.lookups"
                            @update:model-value="selectionUpdated(col)" :disable="col.disabled">
                            <template v-slot:label>
                                <label for="my-autocomplete" v-html="col.label"></label>
                            </template>
                        </autocomplete>
                        <q-input v-else-if="!col.invisible" id="my-input" v-model="parent.editingRow[col.name]" dense
                            style="width:95%" :label="col.label" :disable="col.disabled" :rules="col.rules"
                            :type="col.password && !col.passwordShown ? 'password' : 'text'">
                            <template v-slot:label>
                                <label for="my-input" v-html="col.label" style="font-size: smaller;"></label>
                            </template>
                            <template v-slot:append v-if="col.password">
                                <q-icon :name="col.passwordShown ? 'visibility_off' : 'visibility'"
                                    class="cursor-pointer" @click="col.passwordShown = !col.passwordShown"></q-icon>
                            </template> </q-input>
                    </div>
                </q-form>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn v-if="isChanged" flat color="positive" :label="$t('Save')" @click="save" />
                <q-btn flat color="negative" :label="isChanged ? $t('Cancel') : $t('Close')"
                    @click="this.$emit('cancel')" />
            </q-card-actions>
        </q-card>
    </q-dialog>

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
    props: {
        parent: {
            type: Object,
            default: () => { }
        }
    },
    data() {
        return {
            editingRowSaved: {}
        };
    },
    mounted() {
        this.copyObject(this.parent.editingRow, this.editingRowSaved);
    },
    methods: {
        async save() {
            if (await this.validateForm(this.$refs.form)) {
                this.$emit('save');
            }
        },
        selectionUpdated(col) {
            let displayValue = this.findLookupValue(this.parent.editingRow[col.name], col.lookup.name, this.parent.lookups);
            this.parent.editingRow[col.name + "_val"] = displayValue;
        }
    }
};
</script>