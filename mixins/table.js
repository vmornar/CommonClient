/**
 * @desc A mixin object containing methods for table initalization and action invocations
 * @module TableMixin
 */
import { exportFile } from 'quasar';
import { TableExportMixin } from '@/specific/mixins/table-export.js';
import { TableCustomMixin } from '@/specific/mixins/table-custom.js';

export const TableMixin = {
    props: {
        options: null,
        popupName: null,
    },
    mixins: [TableExportMixin, TableCustomMixin],
    data() {
        return {
            name: null,
            title: null,
            selection: "none",
            selectedRows: [],
            pagination: { rowsPerPage: 0 },
            rows: [],
            columns: [],
            visibleColumns: [],
            from: null,
            to: null,
            filter: {},
            filter2: {},
            filterExp: {},
            showFilter: false,
            frugal: false,
            json: false,
            tableAPI: null,
            restAPI: null,
            inEdit: false,
            editMode: null,
            editingRow: null,
            editingRowIndex: null,
            dbFunction: null,
            lookups: {},
            key: "id",
            rowActions: null,
            tableActions: null,
            columns: [],
            visibleColumns: [],
            colAtts: {},
            alignment: { "float" : "right", "numeric" : "right", "double precision": "right", "integer": "right", "boolean": "center", "number":"right" },
            compare: { "float" : "interval", "double precision": "interval", "integer": "interval", "date" : "interval", "number":"interval", "timestamp with time zone":"interval" },
            format: {
                "date": val => this.formatDate(val),
                "timestamp with time zone": val => this.formatDate(val),
                "numeric": val => val != null ? val.toFixed(2) : null
            },
            changedRows: {},    
            colWidths: {
                "integer": '60px', "character varying": '150px', "text": '200px', "json": '200px', "double precision": '100px', "boolean": '50px', "number": '100px'
            },
            details: null,
            showDetails: false,
            current: null,
            parent: null,
            parentKey: null,
            parentName: null,
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
            summary: null,
            summary_top: null,
            read_only: false,
            hideDefaultToolbar: false,
            hideRecordsToolbar: false,
            currentOverlay: null
        }
    },
    methods: {
        async reload() {
            
            let routerRoute = this.$store.routes.filter((item) => item.path == this.$route.path)[0];
            let offline = false;

            if(routerRoute){
                offline = routerRoute.offline;
            }

            if (this.contextValuesLocal.length > 0) {           
                this.params = {};
                for (let cv of this.contextValuesLocal) {
                    this.params[cv.name] = cv.value;
                    this.$q.localStorage.setItem("context_value_" + cv.name, cv.value);
                    this.$store.contextValues[cv.name] = cv.value;
                }
            }

            if (this.dbFunction) {
                this.data = await this.get("Table/GetTable", {
                    dbFunction: this.dbFunction,
                    frugal: this.frugal.toString(),
                    json: this.json.toString(),
                    pars: JSON.stringify(this.params) ?? "{}",
                    preprocess: this.preprocess ?? null
                }, offline);
            } else if (this.restAPI) {
                let api = this.restAPI;
                for (let key in this.params) {
                    api = api + "/" + this.params[key];
                }
                this.data = await this.get(api);
            } else if (this.tableAPI ) {
                this.frugal = true;
                if (this.params) {
                    this.data = await this.get("Table/" + this.tableAPI, { pars: JSON.stringify(this.params) });
                } else {
                    this.data = await this.get("Table/" + this.tableAPI);
                }
            } 

            if (!this.data) {
                this.rows = [];
                this.columns = [];
                return;
            }
            
            // set up the tableAPI 
            let attributes = [];
            if (this.frugal) { 
                attributes = this.data.attributes;
                this.key = '0';
            } else {
                if (this.data.length > 0) {
                    for (let key in this.data[0]) {
                        attributes.push({ name: key, type: null });
                    }
                    // determine attribute types
                    this.data.forEach(obj => {
                        let i = 0;
                        for (let key in obj) {
                            if (obj[key] != null) {
                                const currentType = typeof obj[key];
                                if (!attributes[i].type) {
                                    attributes[i].type = currentType;
                                } else if (attributes[i].type !== currentType) {
                                    attributes[i].type = 'string';
                                }
                            }
                            i++;
                        }
                    });
                }
                this.key = attributes[0].name;
            }

            if (this.parent) {
                let index = attributes.findIndex(att => att.name == this.parent.key);
                this.data.data = this.data.data.filter(row => row[index] == this.parent.value);
            }

            // set up the columns
            this.columns = attributes.map((attribute, index) => {
                let format = this.format[attribute.type] ?? (val => val);
                if (attribute.decimals) format = val => val != null ? Number(val).toFixed(attribute.decimals) : null;
                return {
                    name: attribute.name,
                    label: attribute.name,
                    field: this.frugal ? row => row[index] : attribute.name,
                    sortable: true,
                    format: val => format(val),
                    align: this.alignment[attribute.type] ?? 'left',
                    index: this.frugal ? index : attribute.name,
                    type: attribute.type,
                    compare: this.compare[attribute.type] ?? 'string',
                    decimals: attribute.decimals,
                    //width: this.calcWidth(attribute.type),
                }
            });

            // chemistry for lookup fields (id in popup, id_val in table)
            if (this.tableAPI ) {
                this.visibleColumns = [];
                this.swapIdAndValColumns(this.columns);
                for (let col of this.columns) {
                    if (this.parent && (col.name == this.parent.key || col.name == this.parent.key + '_val')) continue;
                    if (col.name.endsWith('_id')) {
                        col.label = col.label.slice(0, -3);
                    } else if (col.name.endsWith('_id_val')) {
                        col.label = col.label.slice(0, -7);
                    }
                }
            } 

            for (let col of this.columns) {

                // snake case to readable label
                col.label = col.label.replaceAll(/_/g, ' ');
                col.label = col.label.charAt(0).toUpperCase() + col.label.slice(1);


                let pos = col.name.indexOf('__');
                if (pos > 0) {
                    col.refTable = col.name.substring(0, pos);
                    col.name = col.name.substring(pos + 2);
                }

                if (this.colAtts[col.name]) {
                    this.copyObject(this.colAtts[col.name], col, true);
                    if (this.format[col.type]) {
                        col.format = val => this.format[col.type](val);
                        if (col.decimals) col.format = val => val != null ? val.toFixed(col.decimals) : null;
                    }
                    if (col.rules) {
                        col.rules = this.$store.rules[col.rules];
                    }
                    if (col.type == 'rating') {
                        if (this.frugal) {
                            this.data.data.forEach(row => {
                                row[col.index] = row[col.index] ?? 0;
                            });
                        } else {
                            this.data.forEach(row => {
                                row[col.name] = row[col.name] ?? 0;
                            });
                        }
                    }
                }

                if (col.disabled) {
                    let valCol = this.columns.find(c => c.name == col.name + '_val');
                    if (valCol) valCol.disabled = true;
                }

                if (col.name.endsWith("_id") && !col.noLookup) {                   
                     col.lookup = { name: col.name.slice(0, -3), default: true, refTable: col.refTable };
                }

                if (col.name.endsWith("_id_val") && !col.noLookup) {
                    col.lookup = { name: col.name.slice(0, -7), default: true, refTable: col.refTable };
                }

                if (col.name.endsWith('_id') && !col.visible
                    || col.invisible
                    || this.parent != null && (col.name == this.parent.key || col.name == this.parent.key + '_val')) continue;
                
                if (col.name == 'id' || col.name == 'time_created' || col.name == 'time_modified' || col.name == 'user_modified') col.disabled = true;
                if (col.name == 'id') col.invisible = true;
                if (!col.invisible) {
                    this.visibleColumns.push(col.name);
                }
            }
           
            this.clearFilter();
            this.rows = this.frugal ? this.data.data : this.data;
        },

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
            this.tableAPI  = null;
            this.restAPI = null;
            this.dbFunction = null;
            this.rowActions = null;
            this.tableActions = null;
            this.lookups = {};
            this.params = null;
            this.filter = {};
            this.filter2 = {};
            this.rows = [];
            this.selectedRows = [];
            this.changedRows = {};
            this.colAtts = {};
            this.details = null;
            this.current = null;
            this.parentKey = null;
            this.parentName = null;
            this.selection = "none";
            this.columns = [];
            this.visibleColumns = [];
            this.loaded = false;
            this.contextValuesLocal = [];
            this.contextValues = [] ;
            this.data = [];
            this.exportPreprocess = null;
            this.noInlineEditing = false;
            this.lookupsLoaded = false;
            this.summary = null;
            this.summary_top = null;
            this.hideDefaultToolbar = false;
            this.hideRecordsToolbar = false;
            this.allowDelete = true;
            this.allowEdit = true;
            this.allowNew = true;

            this.grid = this.$q.screen.width <= 800;

            if (this.options) { // embedded with options
                this.copyObject(this.options, this, true);
            } else if (this.popupName) { // called in popup
                this.copyObject(this.$store.popups[this.popupName].props, this, true);
            } else {
                this.copyObject(this.$store.props[this.$route.path], this, true);
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
            }

            // get data from the server
            await this.reload();
            this.loaded = true; 
        },

        /**
         * Swaps the id and value columns for lookup fields.
         * @param {*} columns 
         */
        swapIdAndValColumns(columns) {
            let swapped = [];
            for (let i = 0; i < columns.length; i++) {
                if (columns[i].name.endsWith('_id')) {
                    let name = columns[i].name.slice(0, -3);
                    if (!swapped.includes(name)) {
                        for (let j = 0; j < columns.length; j++) {
                            if (columns[j].name == name + '_id_val') {
                                swapped.push(name);
                                let temp = columns[i];
                                columns[i] = columns[j];
                                columns[j] = temp;
                                break;
                            }
                        }
                    }
                }
            }
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
        initPopup(action, rowToPass) {
            let popup = action.popup ?? 'default';
            this.$store.popups[popup].props = this.deepClone(action);
            this.$store.popups[popup].props.rows = this.rows;
            this.$store.popups[popup].props.selectedRows = this.selectedRows;
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
            route.props.selectedRows = this.selectedRows;
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
                this.initPopup(a, rowToPass);
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
                rows = this.selectedRows;
                if (action.mustSelectRows && rows.length == 0) {
                    this.showMessage(this.$t("Please select rows!"));
                    return;
                }
            } else {
                rows = this.rows;
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
                this.initPopup(action, null);
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