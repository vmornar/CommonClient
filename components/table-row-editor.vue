<template>

    <q-card flat style="display: flex; flex-direction: column" v-if="loaded" class="max-width">
        <q-card-actions class="q-pb-none">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; min-width: 600px;">
                <div>
                    {{ parent.editMode == "add" ? $t('Adding new row') : '' }}
                </div>	
                <div>
                    <q-btn dense v-if="$store.formChanged" flat icon="save" color="positive" :label="$t('Save')" @click="save" />
                    <q-btn dense v-if="$store.formChanged" flat icon="undo" color="negative" :label="$t('Undo')" @click="cancel" />
                    <q-btn dense v-if="!$store.formChanged" flat icon="close" color="negative" :label="$t('Close')" @click="close" />
                </div>
            </div>
        </q-card-actions>
        <q-card-section style="flex-grow: 1; overflow-y: auto;" class="q-pt-none">
            <q-form v-if="loaded" ref="form" autofocus>
                <div :class="{ 'form-disabled': rows && rows.length == 0 && parent.editMode != 'add'}">
                    <table-row-editor-part :row="parent.editingRow" :editColumns="editColumns"  @selectionUpdated="selectionUpdated"/>
                    <table-row-editor-part v-if="isARow" :row="isARow" :editColumns="isAColumns" />
                </div>
            </q-form>
        </q-card-section>
    </q-card>
</template>
<script>

/**
 * Generic row editor component
 * 
 * @component
 * @name TableRowEditor
 * @example
 * <TableRowEditor :parent="this" :mutiRow="true" :rows="rows" />
 */
import { loadComponent } from '@/common/component-loader';
export default {
    name: "TableRowEditor",
    components: {
        tableRowEditorPart : loadComponent('table-row-editor-part'),
    },

    props: ['parent', 'multiRow', 'rows'],
    emits: ['cancel'],
    watch: {
        "rows.length": async function (val) {
            if (val == 0) {
                this.parent.editingRow = await this.createEmptyRow(this.parent.columns);
            } else if (this.parent.editMode != "add") {
                if (this.parent.editingRowIndex >= this.rows.length) this.parent.editingRowIndex = this.rows.length - 1;
                await this.parent.editRow(this.rows[this.parent.editingRowIndex]);               
            }
            this.copyObject(this.parent.editingRow, this.parent.editingRowSaved);
            this.$store.formChanged = false;
        },
        "parent.editingRow": {
            handler(val) {
                if (val) {
                    this.$store.formChanged = !this.equalObjects(this.parent.editingRow, this.parent.editingRowSaved)
                        || (this.parent.isA && !this.equalObjects(this.isARow, this.isARowSaved));
                }
            },
            deep: true,
            immediate: true
        },
        "isARow": {
            handler(val) {
                if (!this.parent.isA) return;
                if (val) {
                    this.$store.formChanged = !this.equalObjects(this.parent.editingRow, this.parent.editingRowSaved)
                    || !this.equalObjects(this.isARow, this.isARowSaved);
                }
            },
            deep: true,
            immediate: true
        },
    },
    data() {
        return {
            editColumns: [],
            x: {},
            form: null, 
            oldIsAKey: null,
            isARow: {},
            isARowSaved: {},
            isAColumns: [],
            specialization: null,
            specializationSaved: null,
            loaded: false
        };
    },
    created() {
    },
    /**
     * Initialize the component
     */
    async mounted() {

        if (this.multiRow) {
            if (this.parent.rows.length > 0) {
                await this.parent.editRow(this.parent.rows[0]);
            } else {
                await this.parent.addRow();
            }
        }

        this.copyObject(this.parent.editingRow, this.parent.editingRowSaved);

        let ec = [...this.parent.columns];
        this.swapIdAndValColumns(ec);

        this.editColumns = ec.filter(col => this.showColInEdit(col));
        await this.handleIsA();

        this.copyObject(this.isARow, this.isARowSaved);
        this.specializationSaved = this.specialization;

        await this.$nextTick(); 

        this.loaded = true; 
        setTimeout(() => {
            this.focus();
            this.form = this.$refs.form;
            this.$store.formChanged = false;
        }, 200);

    },

    methods: {  
        /**
         * focus the first input field in the form
         */            
        focus() {
            this.$refs.form.focus();
            return;
        },

        /**
         * Determines whether a column should be shown in edit mode.
         * @param {Object} col - The column object.
         * @returns {boolean} - True if the column should be shown in edit mode, false otherwise.
         */
        showColInEdit(col) {
            if (this.parent.isA) {
                if (col.name == this.parent.isA.masterKey) return false;
            }
            return !col.invisible && !col.name.endsWith('_val') && col.name != this.parent.masterKey ;
        },

        /**
         * Save the current row and adjust the editing row
         * if this is a isA row, save the isA row as well
         * @returns {Promise<void>}
         */

        async save() {
            if (this.multiRow) {
                await this.parent.saveForm();
                if (this.parent.singleRow) {
                    this.close();
                }
            } else {
                if (await this.parent.saveRow()) {
                    if (this.parent.isA) {

                        if (this.parent.editingRow[this.parent.isA.column] != this.parent.editingRowSaved[this.parent.isA.column] && this.isARowSaved["id"]) {
                            // specializations changed, delete the old row
                            if (await this.delete("Table/" + this.specializationSaved + "/" + this.isARowSaved["id"]) == null) {
                                // delete failed, return;
                                return;
                            }
                            this.isARow["id"] = null;
                        }
                        if (this.specialization) {
                            this.isARow[this.parent.isA.masterKey] = this.parent.editingRow["id"];
                            let ret = await this.put("Table/" + this.specialization, this.isARow);
                            if (ret != null) {
                                this.isARow["id"] = ret;
                            } else {
                                return;
                            }
                        }
                    }

                    if (this.parent.editMode == "add") {
                        this.parent.editingRow = await this.createEmptyRow(this.parent.columns);
                    }

                    if (this.parent.editMode == "edit") {
                        this.close();
                    } else {
                        this.copyObject(this.parent.editingRow, this.parent.editingRowSaved);
                        this.copyObject(this.isARow, this.isARowSaved);
                        this.specializationSaved = this.specialization;
                    }
                }
            }
        },

        /**
         * Close the form
         */
        close() {
            this.$emit('cancel');
        },

        /**
         * Cancel the edit operation and revert to the original values
         */
        cancel() {
            if (this.multiRow && this.parent.editingRowIndex >= this.rows.length) {
                this.parent.editingRowIndex = this.rows.length - 1;
            }
            this.handleIsA();
            this.copyObject(this.parent.editingRowSaved, this.parent.editingRow);
            this.copyObject(this.isARowSaved, this.isARow);
            this.parent.editMode = 'edit';
        },


        /**
         * Dropwdown selection updated
         * @param {Object} col - The column object.
         */
        async selectionUpdated(col) {
            let value = this.parent.editingRow[col.name];
            let displayValue = this.parent.findLookupValue(value, col.lookup);
            this.parent.editingRow[col.name + "_val"] = displayValue;
            await this.handleIsA(col);
        },

        /**
         * Handle the isA column
         *
         */
        async handleIsA() {
            if (this.parent.isA) {
                let value = this.parent.editingRow[this.parent.isA.column];	
                if (value != this.oldIsAKey) {
                    this.isARow = {};
                    this.isAColumns = [];
                    this.specialization = this.parent.isA.specializations[value];
                    if (this.specialization) {
                        let ret = await this.get("Table/" + this.specialization + "/" + this.parent.editingRow["id"]);

                        this.isAColumns = this.parent.setupColumns(ret.attributes);

                        let ec = [...this.isAColumns];
                        this.swapIdAndValColumns(ec);

                        if (ret.data.length > 0) {
                            this.isARow = this.parent.rowToObject(ret.data[0], this.isAColumns);
                        } else {
                            this.isARow = await this.createEmptyRow(this.isAColumns);
                        }

                        this.isAColumns = ec.filter(col => this.showColInEdit(col));
                    }
                    this.oldIsAKey = this.parent.editingRow[this.parent.isA.column];
                }
            }
        },
        
        /**
         * delete the current row and adjust the editing row
         */
        async deleteRow() {
            if (await this.parent.deleteRow(this.rows[this.parent.editingRowIndex])) {
                if (this.rows.length == 0) {
                    this.parent.editingRow = await this.createEmptyRow(this.parent.columns);
                } else if (this.parent.editingRowIndex >= this.rows.length) {
                    this.parent.editingRowIndex--;
                    await this.parent.editRow(this.rows[this.parent.editingRowIndex]);
                }
                this.copyObject(this.parent.editingRow, this.parent.editingRowSaved);
                this.$store.formChanged = false;   
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