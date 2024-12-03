/**
 * @desc A mixin object containing methods for table initalization and action invocations
 * @module TableMixin
 */
import { exportFile } from 'quasar';
import { TableExportMixin } from '@/specific/mixins/table-export.js';
import { TableCustomMixin } from '@/specific/mixins/table-custom.js';
import { TableUtilsMixin } from '@/common/mixins/table-utils.js';

export const TableMixin = {
    props: {
        options: null,
        popupName: null,
        detailTable: false,
        parentPopup: null,
    },
    mixins: [TableExportMixin, TableCustomMixin, TableUtilsMixin],
    data() {
        return {
            name: null,
            title: null,
            selection: "none",
            selectedRows: [],
            pagination: { rowsPerPage: 0 },
            rows: [],
            columns: [],
            from: null,
            to: null,
            filter: {},
            filter2: {},
            filterExp: {},
            showFilter: false,
            frugal: false,
            json: false,
            tableAPI: null,
            tableAPIKey: null,
            restAPI: null,
            editingRow: null,
            editingRowSaved: {},
            editingRowIndex: 0,
            dbFunction: null,
            key: "id",
            rowActions: null,
            tableActions: null,
            columns: [],
            changedRows: {},  
            showDetails: false,
            masterKey: null,
            allowEdit: true,
            allowNew: true,
            allowDelete: true,
            selection: "none",
            loaded: false,
            params: null,
            contextValuesLocal: [],
            data: [],
            exportPreprocess: null,
            noInlineEditing: false,
            grid: false,
            lookupsLoaded: false,
            activeLookup: null,
            summary: null,
            summary_top: null,
            read_only: false,
            hideDefaultToolbar: false,
            hideRecordsToolbar: false,
            currentOverlay: null,
            props: {},
            index: 0,
            editedItem: null,
            lookupDisplayIndex: 0,
            overlayShown: null,
            overlays: { },
            asForm: false,
            visibleColumns: [],
            contextValuesLoaded: false,
        }
    },
    methods: {

        /**
         * Initializes the tableAPI  component.
         */
        async init() {        
            if (this.$store.state[this.$route.path]) {
                this.copyObject(this.$store.state[this.$route.path], this, true);
                return;
            }
            this.$store.fromMenu = false;
            // set default values (needed because component is reused)
            this.$store.formChanged = false;    
            this.title = null;
            this.frugal = false;
            this.json = false;
            this.tableAPI = null;
            this.tableAPIKey = null;
            this.restAPI = null;
            this.dbFunction = null;
            this.rowActions = null;
            this.tableActions = null;
            this.params = null;
            this.filter = {};
            this.filter2 = {};
            this.rows = [];
            this.selectedRows = [];
            this.changedRows = {};
            this.colAtts = {};
            this.masterKey = null;
            this.selection = "none";
            this.columns = [];
            this.loaded = false;
            this.contextValuesLocal = [];
            this.contextValues = [] ;
            this.data = [];
            this.exportPreprocess = null;
            this.noInlineEditing = false;
            this.lookupsLoaded = false;
            this.activeLookup = null;
            this.summary = null;
            this.summary_top = null;
            this.hideDefaultToolbar = false;
            this.hideRecordsToolbar = false;
            this.allowDelete = true;
            this.allowEdit = true;
            this.allowNew = true;
            this.props = {},
            this.index = 0,
            this.editedItem = null,
            this.lookupDisplayIndex = 0,
            this.overlayShown = null,
            this.overlays = { },
            this.asForm = false;
            this.inEdit = false;
            this.editingRowIndex = 0;
            this.contextValuesLoaded = false;

            this.grid = this.$q.screen.width <= 800;

            if (this.options) { // embedded with options
                this.copyObject(this.options, this, true);
            } else if (this.popupName) { // called in popup
                this.copyObject(this.$store.popups[this.popupName].props, this, true);
            } else {
                this.copyObject(this.$store.props[this.$route.path], this, true);
            }

            if (this.parentPopup) {
                this.parentPopup.title = this.title;
            }
            
            // copy context values so that action is not changed
            if (this.contextValues) {
                this.copyArray(this.contextValues, this.contextValuesLocal);
            }
    
            let r = this.$store.routes.find(r => r.path == this.$route.path);
            this.read_only = r ? r.read_only : false;

            if (this.title) this.title = this.$t(this.title);

            if (!this.tableAPI || this.read_only) {
                this.allowDelete = false;
                this.allowEdit = false;
                this.allowNew = false;
            }

            if (this.contextValuesLocal) {
                for (let cv of this.contextValuesLocal) {
                    if (this.$q.localStorage.has("context_value_" + cv.name)) {
                        cv.value = this.$q.localStorage.getItem("context_value_" + cv.name);
                    }
                    if (cv.catalog) {
                        cv.options = this.$store.catalogs[cv.catalog];
                    }
                    if (cv.lookup) {
                        cv.options = await this.get("Table/GetParamLookup/" + cv.lookup);
                    }
                    if (cv.options && cv.options.length > 0) {
                        // get first key in first row
                        cv.optionValue = Object.keys(cv.options[0])[0];
                        cv.optionLabel = Object.keys(cv.options[0])[1];
                        if (cv.value == null) cv.value = cv.options[0][cv.optionValue];
                    }
                };
                this.contextValuesLoaded = true;
            }

            // get data from the server
            await this.reload();

            this.loaded = true; 
              await this.$nextTick();
        },

 
        /**
         * Wraps a value in a CSV cell.
         * @param {*} val - The value to be wrapped.
         * @param {*} formatFn - The function to format the value.
         * @param {*} row - The row containing the value.
         * @returns {string} The wrapped value.
        */
        wrapCsvValue (val, formatFn, row) {
            let formatted = formatFn !== void 0
                ? formatFn(val, row)
                : val
            formatted = formatted === void 0 || formatted === null ? '' : String(formatted)
            formatted = formatted.split('"').join('""')
            return `"${formatted}"`
        },
        
        /**
         * Creates content for export based on the provided export rows and columns.
         *
         * @param {Array} exportRows - The rows to be exported.
         * @param {Array} columns - The columns to be exported.
         * @returns {string} The content for export.
         */
        createContentForExport(exportRows, columns) {
            const content = [columns.map(col => this.wrapCsvValue(col.label.replace(/<[^>]*>/g, '')))].concat(
                exportRows.map(row => columns.map(col => this.wrapCsvValue(
                    typeof col.field === 'function'
                        ? col.field(row)
                        : row[col.field === void 0 ? col.name : col.field],
                    col.format,
                    row
                )).join(','))
            ).join('\r\n');
            return content;
        },	

        /**
         * Exports the tableAPI  to a CSV file.
         */
        exportTable() {
            let exportRows;

            if (this.selectedRows.length > 0) {
                exportRows = this.selectedRows;
            } else {
                exportRows = this.$refs.table.filteredSortedRows;
            }
            if (!exportRows || exportRows.length === 0) return;

            let content;

            if (this.exportPreprocess) {
                content = this[this.exportPreprocess].call(this, exportRows, this.columns)
            } else {
                content = this.createContentForExport(exportRows, this.columns);
            }

            const bom = '\uFEFF';
            const status = exportFile(
                this.$route.name + '.csv',
                bom + content,
                'text/csv'
            )

            if (status !== true) {
                $q.notify({
                    message: this.$t('Browser denied file download...'),
                    color: 'negative',
                    icon: 'warning'
                })
            }
                
        },

        /**
         * Initializes the properties for custom component in popup.
         * @param {string} action - The action to be performed.
         * @param {Object} rowToPass - The row object to be passed to the popup.
         * @param {Array} rows - The array of rows in the table.
         */
        initPopup(action, rowToPass, rows) {
            let popup = action.popup ?? 'default';
            this.$store.popups[popup].props = this.deepClone(action);
            this.$store.popups[popup].props.rows = rows;
            this.$store.popups[popup].props.parent = this;
            this.$store.popups[popup].props.row = rowToPass;
            this.$store.popups[popup].props.columns = this.columns;
            this.$store.popups[popup].props.editingRow = rowToPass;
            this.$store.popups[popup].props.editingRowIndex = this.editingRowIndex;
            this.$store.popups[popup].component = action.component;
            this.$store.popups[popup].show = true;
        },

        /**
         * Replaces moustache variables in an object with corresponding values from row.
         * 
         * @param {Object} obj - The object containing variables to be replaced.
         * @param {Object} rowToPass - The object containing values to replace the variables.
         */
        replaceVariables(obj, rowToPass) {
            for (let keyO in obj) {
                if (typeof obj[keyO] == "string" && obj[keyO].includes("{{")) {
                    for (let keyR in rowToPass) {
                        obj[keyO] = obj[keyO].replaceAll("{{" + keyR + "}}", rowToPass[keyR]);
                    }
                    for (let keyG in this.$store.globalValues) {
                        obj[keyO] = obj[keyO].replaceAll("{{store.globalValues." + keyG + "}}", this.$store.globalValues[keyG]);
                    }
                    for (let cv of this.contextValuesLocal) {
                        obj[keyO] = obj[keyO].replaceAll("{{store.contextValues." + cv.name + "}}", this.$store.contextValues[cv.name]);
                    }
                } else if (typeof obj[keyO] == "object" && keyO != "rowActions") {
                    this.replaceVariables(obj[keyO], rowToPass);
                }
                if (keyO == "store.globalValues") {
                    this.copyObject(obj[keyO], this.$store.globalValues, true);    
                }
            }
        },
        
        /**
         * Prepares and activates a route based on the provided action, row, and rows.
         *
         * @param {Object} action - The action object containing route information.
         * @param {Object} row - The row object.
         * @param {Array} rows - The array of rows.
         * @returns {void}
         */
        prepareRoute(action, rowToPass, rows) {
            // activate a route
            let routerRoute = this.$store.routes.find((item) => item.path == action.route);
            let route = {};
            if (!routerRoute) {  // this is a custom route, not in routes table
                route = { name: action.route, component: action.component, path: action.route };      
                route.props = this.deepClone(action);
            } else {
                route = this.deepClone(routerRoute);
            }

            this.replaceVariables(route.props, rowToPass);

            route.props.row = rowToPass;
            route.props.rows = rows;
            route.props.columns = this.columns;
            route.props.editingRow = rowToPass;
            route.props.editingRowIndex = this.editingRowIndex;
            route.props.backButton = true;
            this.activateRoute(route);
        },


        /**
         * Deletes a row from the array in store, if necessary.
         * @param {Object} row - The row to be deleted.
         * @returns {void}
         */
         deleteInStore(row, action) {
            if (action.deleteInStore) {
                let index = this.$store[action.deleteInStore].findIndex(r => r.id == row.id);
                this.$store[action.deleteInStore].splice(index, 1);
            }
        },
         
        /**
         * Runs a row action.
         * @param {Object} action - Action to be run.
         * @param {Object} row - The row to be acted upon.
         */
        async runRowAction(action, row) { 
         
            let rowToPass = {};
            if (this.frugal) {
                rowToPass = this.rowToObject(row);
            } else {
                rowToPass = row;
            }

            let a = this.deepClone(action);
            this.replaceVariables(a, rowToPass);
            
            this.editingRowIndex = this.rows.indexOf(row);

            if (a.confirmationMessage) {
                if (!(await this.confirmDialog(a.confirmationMessage))) {
                    return;
                }
            }

            if (a.conditionalConfirmationMessage) {
                let f = new Function('row', 'columns', a.conditionalConfirmationMessage.condition);
                if (f(row, this.columns)) {
                    if (!(await this.confirmDialog(a.conditionalConfirmationMessage.message))) {
                        return;
                    }
                };                
            }

            if (a.route) {
                if (this.$route) this.$store.state[this.$route.path] = this.deepClone(this.$data);
                this.prepareRoute(a, rowToPass, this.rows);
            } else if (a.customFunction) {
                this[a.customFunction](rowToPass);
            } else if (a.restAPI) {

                let url = a.restAPI;

                let ret = await this.api(this.axios.API[a.method ?? "get"], url, a.params);
                if (ret != null) {

                    if (a.method == "delete" && !a.noRowDelete) {
                        this.rows.splice(this.editingRowIndex, 1);
                        this.deleteInStore(row, a);
                    } else if (a.redirect) {
                        // open a new tab
                        window.open(ret);
                    }
                }
            } else if (a.delete) {
                this.tableAPI = a.tableAPI;
                this.deleteRow(row, a.confirmationMessage);
                this.deleteInStore(row, a);
            } else if (a.clone) {
                await this.post("Table/Clone/" + a.clone + "/" + rowToPass[a.key]);
                await this.showMessage(this.$t("Record cloned. Table will be refreshed."));
                await this.reload(); 
            } else if (a.chart) {          
                this.chart(this.rows, a);
            } else {
                // activate a component
                this.initPopup(a, rowToPass, this.rows);
            }

            if (a.reload) {
                await this.reload();
            }
        },

        /**
         * Runs a tableAPI  action (custom function).
         * @param {Object} action - Action to be run.
         */
        async runTableAction(action) {

            let rows;

            if (this.selection == "multiple") {
                if (action.mustSelectRows && this.selectedRows.length == 0) {
                    this.showMessage(this.$t("Please select rows!"));
                    return;
                }
                if (this.selectedRows.length == 0) {
                    rows = this.$refs.table.filteredSortedRows;
                } else {
                    rows = this.selectedRows;
                }

            } else {
                rows = this.$refs.table.filteredSortedRows;
            }

            if (action.confirmationMessage) {
                if (!await this.confirmDialog(action.confirmationMessage)) {
                    return;
                }
            }

            if (action.customFunction) {
                this[action.customFunction](rows);
            } else if (action.restAPI) {
                let keys = rows.map(row => row[action.keyForKeys ?? this.key]);
                let a = this.deepClone(action);
                this.replaceVariables(a, {});
                let ret = await this.api(this.axios.API[action.method ?? "get"], action.restAPI, { keys: keys, ...a.params });
                if (ret && ret.taskId) {
                    this.$store.progress.props = { taskId: ret.taskId, min: 0, max: ret.count, parent: this, ...action };
                    this.$store.progress.show = true;
                }
            } else if (action.chart) {
                this.chart(rows, action);
            } else if (action.route) {
                //this.prepareRoute(action, null, action.passRows ? rows : null);
                this.$store.state[this.$route.path] = this.deepClone(this.$data);
                this.prepareRoute(action, null, rows);
            } else if (action.component) {
                this.initPopup(action, null, rows);
            }

            if (action.reload) {
                await this.reload();
            }
        },

        async chart(rows, action) {
            this.$store.popups.chart.props = this.deepClone(action.chart);
            //this.copyObject(action.chart, this.$store.popups.chart.props);
            let rowsToChart = rows;
            let actionRetrievesData = action.chart.dbFunction || action.chart.restAPI;
            if (action.chart.dbFunction) {
                rowsToChart = await this.get("Table/GetTable", {
                    dbFunction: action.chart.dbFunction,
                    frugal: action.chart.frugal ? action.chart.frugal.toString() : "false",
                    json: action.chart.json ? action.chart.json.toString() : "false",
                    pars: JSON.stringify(action.chart.params) ?? "{}"
                });
            } else if (action.chart.restAPI) {
                rowsToChart = await this.get(action.chart.restAPI);
            } else {
                rowsToChart = rows;
            }
            if (rowsToChart) {
                if (action.chart.preprocess) {
                    this.$store.popups.chart.props.data = this[action.chart.preprocess].call(this, rowsToChart);
                } else if (this.frugal && !actionRetrievesData || actionRetrievesData && action.chart.frugal) {
                    this.$store.popups.chart.props.data = rowsToChart.map(row => this.rowToObject(row));
                } else {
                    this.$store.popups.chart.props.data = rowsToChart;
                }
                 this.$store.popups.chart.show = true;
            }
        },

        /**
         * Calculates the width of a column based on its type.
         * @param {string} type - The type of the column.
         * @returns {string} The width of the column.
         */
        calcWidth(type) {
            return this.colWidths[type] ?? '100px';
        },

        /**
         * Shows the row info in a popup.
         * @param {Object} row - The row to show info for.
         */
        showRowInfo(row) {
            let rowToShow = row;
            if (this.frugal) {
                rowToShow = this.rowToObject(row);
            }
            this.$store.popups.default.props = {
                columns: this.columns,
                rowToShow: rowToShow,
            };
            this.$store.popups.default.component = 'row-info';
            this.$store.popups.default.show = true;
        },
    }
}