<template>
    <table-row-editor v-if="loaded" :parent="this" :multiRow="false" :rows="rows" @cancel="cancel"/>
</template>
<script>

/**
 * Generic single row editor component
 * 
 * @component
 * @name SingleRowEditor
 * @example
 * <SingleRowEditor :parent="this" />
 */
import { loadComponent } from '@/common/component-loader';
import { TableUtilsMixin } from '../mixins/table-utils';
export default {

    name: "SingleRowEditor",
    mixins: [TableUtilsMixin],
    components: {
        tableRowEditor : loadComponent('table-row-editor'),
    },

    props: ['parentPopup', 'popupName'],
    data() {
        return {
            editingRow: {},
            editingRowSaved: {},
            rows: [],
            columns: [],
            loaded: false,
        };
    },

    created() {
    },

    /**
     * Initialize the component
     */
    async mounted() {
        this.initializeComponent(this.popupName);
        this.tableAPIKey = this.id;
        this.singleRow = true;
        await this.reload();
        if (this.rows.length > 0) {
            this.editingRow = this.rowToObject(this.rows[0], this.columns);
        } else {
            this.editingRow = this.createEmptyRow(this.columns);
        }
        this.copyObject(this.editingRow, this.editingRowSaved);
        await this.loadLookups();
        console.log("columns", this.columns);
        console.log("rows",  this.rows);
        console.log("editingrow",  this.editingRow);  
        this.loaded = true;  
    },

    methods: {  

        /**
         * Save the current row 
         * @returns {Promise<void>}
         */

        async saveRow() {
            if (await this.put("Table/" + this.tableAPI, this.editingRow) != null) {
                this.cancel();
            }
        },

        /**
         * Cancel the edit operation and revert to the original values
         */
        cancel() {
            this.$store.popups[this.popupName].show = false;
        },
    }
};
</script>
