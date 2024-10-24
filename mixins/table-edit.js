import { computed } from "vue";

/**
 * @desc A mixin object containing methods for table editing
 * @module TableEditMixin
 */
export const TableEditMixin = {
    computed: {
        overlayStyle() {
            return {
                position: 'fixed',
                zIndex: 1000,
                backgroundColor: this.$q.dark.isActive ? 'black' : 'white',
            }
        },
    },
    methods: {

        /**
         * Converts a row from the table to an object.
         * @param {Array} row - The row to convert.
         * @returns {Object} - The converted object.
         */
        rowToObject(row) {
            let obj = {};
            for (let col of this.columns) {
                obj[col.name] = row[col.index];
            }
            return obj;
        },

        /**
         * Adds a new row to the table for editing.
         */
        async addRow() {
            await this.loadLookups();
            this.editMode = 'add';
            this.editingRow = this.createEmptyRow(this.columns);
            // if (this.parent) {
            //     // todo
            //     this.editingRow[this.parent.key] = this.parent.value;
            //     this.editingRow[this.parent.key + '_val'] = this.findLookupValue(this.parent.value, this.parent.key.slice(0, -3), this.lookups);
            // }
            this.editingRowIndex = -1;
            this.inEdit = true;
        },
        
        /**
         * Edits a row in the table.
         * @param {Object} row - The row to be edited.
         */
        async editRow(row) {
            await this.loadLookups();
            this.editMode = 'edit';
            this.editingRowIndex = this.rows.indexOf(row);
            this.editingRow = this.rowToObject(row);
            this.inEdit = true;
        },

        /**
         * Deletes a row from the table.
         * @param {Object} row - The row to be deleted.
         */
        async deleteRow(row, confirmationMessage) {
            if (confirmationMessage ||
                await this.confirmDialog(this.$t("Delete row?"))) {
                let key = this.frugal ? row[0] : row["id"];
                let res = await this.delete("Table/" + this.tableAPI + "/" + key.toString());
                if (res != null) {
                    this.rows.splice(this.rows.indexOf(row), 1);
                }
            }
        },

        /**
         * Determines whether a column should be shown in edit mode.
         * @param {Object} col - The column object.
         * @returns {boolean} - True if the column should be shown in edit mode, false otherwise.
         */
        showColInEdit(col) {
            return col.name != 'id' && !col.name.endsWith('_val') && col.name != this.masterKey;
        },
        
        /**
         * Loads the lookup values for the columns in the table.
         * @returns {Promise<void>} A promise that resolves when the lookup values are loaded.
         */
        async loadLookups() {
            if (!this.lookupsLoaded) {
                for (let col of this.columns) {
                    if (col.lookup && !col.lookup.loaded) {
                        if (!col.lookup.options) {
                            await this.loadLookup(col.lookup);
                            col.lookup.loaded = true;
                        }
                    }
                }
                this.lookupsLoaded = true;
            }
        },

        /**
         * Saves the edited row to the table.
         * @async
         * @function saveRow
         * @returns {Promise<void>} A Promise that resolves when the row is saved.
         */
        async saveRow() {
            this.saveRowToDb(this.editMode, this.tableAPI, this.columns, this.editingRow, this.editingRowIndex, this.rows);
            this.inEdit = false;            
        },

        /**
         * Updates a row in the table with the provided properties. Invoked from popup.
         * @param {Object} props - The properties to update in the row.
         */
        updateRow(props) {
            let row = this.rows[this.editingRowIndex];
            if (!this.frugal) {
                for (let col in props) {
                    row[col] = props[col];
                }
            } else {
                for (let col in props) {
                    row[this.columns.find(c => c.name == col).index] = props[col];
                }
            }
        },

        /**
         * Saves the edited rows to the database.
         */
        async saveRows() {
            for (let key in this.changedRows) {
                let row = this.changedRows[key];
                this.editingRow = {};
                for (let col of this.columns) {
                    if (this.frugal) {
                        this.editingRow[col.name] = row[col.index];
                    } else {
                        this.editingRow[col.name] = row[col.name];
                    }
                }
                this.prepareRow(this.editingRow, this.columns);
                if (await this.put("Table/" + this.tableAPI, this.editingRow) != null) {
                    delete this.changedRows[key];
                }
            }
            this.$store.formChanged = false;
        },

        /**
         *  Undoes the changes made to the edited row and refreshes the table.
         */ 
        undoChanges() {
            this.init();
        },

        /**
         * Show the overlay for editing a cell
         * @param {*} ref 
         * @param {*} col 
         * @param {*} props 
         */
        async showOverlay(col, props) {
            this.currentOverlay = {col : col, props : props};
            if (!this.tableAPI || col.disabled || this.noInlineEditing) return;

            let el = this.$refs[props.key + '-' + col.index]?.[0];
            el = el && el.$el ? el.$el : el;
            let rect = el.getBoundingClientRect();

            this.activeLookup = null;
            this.overlays = {};

            if (col.type == 'json') {
                this.overlayShown = 'overlayJson';
            } else if (col.type == 'icon') {
                this.overlayShown = 'overlayIcon';
            } else if (col.type == 'text') {
                this.overlayShown = 'overlayText';
            } else if (col.lookup) {
                await this.loadLookups();
                this.overlayShown = 'overlaySelect';
                this.activeLookup = col.lookup;
            } else {
                this.overlayShown = 'overlayInput';
            }

            let top = rect.top;
            let left = rect.left;
            let width = rect.width;
            if (col.type == 'json' || col.type == 'text' || this.activeLookup) {
                width = Math.max(width, 400);
            // } else {
            //     width = Math.max(width, 150);
            }

            // this.overlayStyle.top = (top - (el.innerHTML == "" ? 24 : 4)) + 'px';
            this.overlayStyle.top = top + 'px';
            this.overlayStyle.left = left + 'px';
            this.overlayStyle.width = width + 'px';

            if (col.lookup) {
                if (col.lookup.default) {
                    this.index = this.columns.find(c => c.name == col.lookup.name + "_id").index;
                    this.lookupDisplayIndex = col.index;
                } else {
                    this.index = col.index;
                    this.lookupDisplayIndex = col.index;
                }
            } else {
                this.index = col.index;              
            }
            this.editedItem = props.row[this.index];
            this.props = props;
            
            this.overlays[this.overlayShown] = true;  
            await this.$nextTick();

            setTimeout(() => {
           
                let overlay = this.$refs[this.overlayShown];
                console.log("overlay ", overlay, overlay.$el);
                
                let oRect;
                
                if (overlay.$el) {
                    oRect = overlay.$el.getBoundingClientRect();
                } else {
                    oRect = overlay.getBoundingClientRect();
                }

                if (oRect.bottom > window.innerHeight) {
                    this.overlayStyle.top = (Math.max(window.innerHeight - oRect.height, 0)) + 'px';
                    this.$forceUpdate();
                }
                if (oRect.right > window.innerWidth) {  
                    this.overlayStyle.left = (Math.max(window.innerWidth - oRect.width, 0)) + 'px';
                    this.$forceUpdate();
                }

                    overlay.focus();
                }
            , 100);
        },


        /**
         * The edited item has changed
         */
        editedItemChanged() {
            if (this.activeLookup) {
                let displayValue = this.findLookupValue(this.editedItem, this.activeLookup);
                this.props.row[this.lookupDisplayIndex] = displayValue;
            }
            this.props.row[this.index] = this.editedItem;
            this.changedRows[this.props.row[0]] = [...this.props.row];
            this.$store.formChanged = true;
        },

        /**
         * Close the overlay for editing a cell
         */
        closeOverlay() {
            
            this.currentOverlay = null;
            this.overlays[this.overlayShown] = false;
            this.overlayShown = null;
            if (this.editedItem != this.props.row[this.index]) {
                this.props.row[this.index] = this.editedItem;
                this.changedRows[this.props.row[0]] = [...this.props.row];
            }
        },

        /**
         * Close all overlays
        */
        closeAllOverlays() {
            for (let overlay in this.overlays) {
                this.overlays[overlay] = false;
            }
        },

        /**
         * Selection in popup table has been updated
         * @param {*} value 
         * @param {*} col 
         */
        selectionUpdated(col) {
            this.editingRow[col.name + '_val'] = this.findLookupValue(this.editingRow[col.name], col.lookup, this.lookups);
        }

    }
}