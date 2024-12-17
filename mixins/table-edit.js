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
         * Show the overlay for editing a cell
         * @param {*} ref 
         * @param {*} col 
         * @param {*} props 
         */
        async showOverlay(col, props) {
            this.currentOverlay = { col: col, props: props };
            
            if (!col.enabled && (!this.tableAPI || col.disabled || this.noInlineEditing)) return;

            let el = this.$refs[props.key + '-' + col.index]?.[0];
            el = el && el.$el ? el.$el : el;
            let rect = el.getBoundingClientRect();

            this.activeLookup = null;
            this.overlays = {};

            if (col.type == 'json') {
                this.overlayShown = 'overlayJson';
            } else if (col.type == 'icon') {
                this.overlayShown = 'overlayIcon';
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
            console.log('editedItemChanged');   
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
            if (this.editedItem != this.props.row[this.index]) {
                this.props.row[this.index] = this.editedItem;
                this.changedRows[this.props.row[0]] = [...this.props.row];

            }
            this.currentOverlay = null;
            this.overlays[this.overlayShown] = false;
            this.overlayShown = null;
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