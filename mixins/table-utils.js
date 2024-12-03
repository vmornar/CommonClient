/**
 * @desc A mixin object containing methods for table editing and saving.
 * @module TableUtilsMixin
 */
export const TableUtilsMixin = {
    data() {
        return {
            alignment: { "float": "right", "numeric": "right", "double precision": "right", "integer": "right", "boolean": "center", "number": "right" },
            compare: { "float": "interval", "double precision": "interval", "integer": "interval", "date": "interval", "number": "interval", "timestamp with time zone": "interval" },
            format: {
                "date": val => this.formatDate(val),
                "timestamp with time zone": val => this.formatDate(val),
                "numeric": val => val != null ? val.toFixed(2) : null
            },
            colWidths: {
                "integer": '60px', "character varying": '150px', "text": '200px', "json": '200px', "double precision": '100px', "boolean": '50px', "number": '100px'
            },
            colAtts: {},
            inEdit: false,
            editMode: null,
        }
    },
    methods: {
        /**
        * Clears the filter
         */
        clearFilter() {
            this.filter = {}; this.filter2 = {}; this.filterExp = {};
            for (let col of this.columns) {
                this.filter[col.name] = undefined; this.filter2[col.name] = undefined;
                if (col.type == "timestamp with time zone") {
                    this.filterExp[col.name] = 'between';
                } else if (col.type == "integer" || col.type == "numeric" || col.type == "float" || col.type == "double precision" || col.type == "boolean" || col.type == "rating") {
                    this.filterExp[col.name] = '=';
                } else {
                    this.filterExp[col.name] = 'contains';
                }
            }
        },

      
        /**
         * Finds the index of a column in the given array of columns based on the column name.
         *
         * @param {Array} columns - The array of columns to search.
         * @param {string} columnName - The name of the column to find.
         * @returns {number} - The index of the column if found, otherwise -1.
         */
        findIndexOfColumn(columns, columnName) {
            for (let i = 0; i < columns.length; i++) {
                if (columns[i].name == columnName) {
                    return columns[i].index;
                }
            }
            return -1;
        },

        /**
         * Creates a row for a table based on the given row object and columns.
         * 
         * @param {Object} row - The row object.
         * @param {Object[]} columns - The array of column objects.
         * @returns {Array} - An array representing the row for the table.
         */
        createRowForTable(row, columns) {
            let newRow = [];
            for (let col of columns) {
                newRow[col.index] = row[col.name];
            }
            return newRow;
        },

        /**
         * Saves the edited row to the database.
         * 
         * @param {string} editMode - The edit mode ('add' or 'edit').
         * @param {string} tableAPI - The API endpoint for the table.
         * @param {Array} columns - The columns of the table.
         * @param {Object} editingRow - The edited row.
         * @param {number} editingRowIndex - The index of the edited row.
         * @param {Array} rows - The rows of the table.
         * @param {string} customAPI - The custom API endpoint for the table.
         * @param {string} customMethod - The custom method to use for the API request.
         * @returns {Promise<void>} - A promise that resolves when the row is saved to the database.
         */
        async saveRowToDb(editMode, tableAPI, columns, editingRow, editingRowIndex, rows, customAPI = null, customMethod = null) {
            let api = customAPI ? customAPI : "Table/" + tableAPI;
            let method = (editMode == 'add' ? this.post : this.put);
            if (customMethod == 'post') {
                method = this.post;
            } else if (customMethod == 'put') {
                method = this.put;
            }
            let newRow = this.createRowForTable(editingRow, columns);
            if (editMode == 'add') {
                for (let col of columns) {
                    if (col.name == 'time_created' || col.name == 'time_modified' || col.name == 'user_modified') {
                        editingRow[col.name] = null;
                    }
                }
                let ret = await method(api, editingRow);
                if (ret == null) {
                    return false;
                } else if (typeof ret == 'object') {
                    for (let name in ret) {
                        newRow[this.findIndexOfColumn(columns, name)] = ret[name];
                    }
                } else {
                    newRow[0] = ret;
                }
                rows.push(newRow);
            } else {
                let ret = await method(api, editingRow);
                if (ret == null) {
                    return false;
                } else if (typeof ret == 'object') {
                    for (let name in ret) {
                        newRow[this.findIndexOfColumn(columns, name)] = ret[name];
                    }
                }
                rows[editingRowIndex] = newRow;
            }
            this.$store.formChanged = false;
            return true;
        },

        /**
         * Creates an empty row object with default values based on the given columns.
         *
         * @param {Array} columns - An array of column objects.
         * @returns {Object} - An empty row object with default values.
         */
        async createEmptyRow(columns) {
            let obj = {};
            for (let col of columns) {
                if (col.type == 'json') {
                    obj[col.name] = "{}";
                } else if (col.type == 'boolean') {
                    obj[col.name] = false;
                } else {
                    obj[col.name] = null;
                } 
                if (col.defaultPrevious) {
                    obj[col.name] = this.$q.localStorage.getItem("default_" + col.name) ?? obj[col.name];
                    if (col.lookup) {
                        await this.loadLookup(col.lookup);
                        let displayValue = this.findLookupValue(obj[col.name], col.lookup);
                        obj[col.name + '_val'] = displayValue;
                    }
                }
            }
            return obj;
        },

        /**
         * Converts a frugal JSON object to an array of objects.
         *
         * @param {Object} data - The frugal JSON object containing data and attributes.
         * @param {Array} data.data - The array of data rows.
         * @param {Array} data.attributes - The array of attribute names.
         * @returns {Array<Object>} An array of objects where each object represents a row of data with attribute names as keys.
         */
        frugalJsonToArray(data) {
            let a = [];
            for (let row of data.data) {
                let obj = {};
                for (let i = 0; i < data.attributes.length; i++) {
                    obj[data.attributes[i].name] = row[i];
                }
                a.push(obj);
            }
            return a;
        },


        /** 
         * reload (or load) the table data 
        */
        async reload() {
            
            this.columns = [];

            let routerRoute = this.$store.routes.filter((item) => item.path == this.$route.path)[0];
            let offline = false;

            if (routerRoute) {
                offline = routerRoute.offline;
            }

            if (this.contextValuesLocal && this.contextValuesLocal.length > 0) {
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
            } else if (this.tableAPI) {
                this.frugal = true;
                if (this.params) {
                    this.data = await this.get("Table/" + this.tableAPI, { pars: JSON.stringify(this.params) });
                } else if (this.tableAPIKey) {
                    this.data = await this.get("Table/" + this.tableAPI + "/" + this.tableAPIKey);
                } else {
                    this.data = await this.get("Table/" + this.tableAPI);
                }
            }

            if (!this.data) {
                this.rows = [];
                //this.columns = [];
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

            this.columns = this.setupColumns(attributes);
            
            this.visibleColumns = [];
            for (let col of this.columns) {
                if (col.pushToVisible) {
                    this.visibleColumns.push(col.name);
                }
            };
            
            this.clearFilter();
            this.rows = this.frugal ? this.data.data : this.data;
            this.rowsFiltered = this.rows;
        },

        setupColumns(attributes) {
            let columns = attributes.map((attribute, index) => {
                let format = this.format[attribute.type] ?? (val => val);
                if (attribute.decimals) format = val => val != null ? Number(val).toFixed(attribute.decimals) : null;
                return {
                    name: attribute.name,
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

            let lookups = {};
            for (let col of columns) {
                let pos = col.name.indexOf('__');
                if (pos > 0) {
                    let refTable = col.name.substring(0, pos);
                    col.name = col.name.substring(pos + 2);
                    let end = col.name.endsWith('_id') ? -3 : -7;
                    let lookupName = col.name.slice(0, end);
                    if (lookups[lookupName]) {
                        col.lookup = lookups[lookupName];
                    } else {
                        col.lookup = { name: lookupName, default: true, refTable: refTable, options: null };
                        lookups[lookupName] = col.lookup;
                    }
                }
                col.label = col.name;
            }

            // chemistry for lookup fields (id in popup, id_val in table)
            if (this.tableAPI) {

                this.swapIdAndValColumns(columns);
                for (let col of columns) {
                    if (this.masterKey && (col.name == this.masterKey || col.name == this.masterKey + '_val')) {
                        col.lookup = null;
                        continue;
                    }
                    if (col.name.endsWith('_id')) {
                        col.label = col.label.slice(0, -3);
                    } else if (col.name.endsWith('_id_val')) {
                        col.label = col.label.slice(0, -7);
                    }
                }
            }

            for (let col of columns) {
                col.label = this.snakeToSentence(col.label);
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
                    let valCol = columns.find(c => c.name == col.name + '_val');
                    if (valCol) valCol.disabled = true;
                }

                if (col.noLookup) {
                    col.lookup = null;
                }

                if (col.name.endsWith("_id")
                    || col.invisible
                    || (this.masterKey != null && (col.name == this.masterKey || col.name == this.masterKey + '_val'))
                    || (this.isA != null && (col.name == this.isA.masterKey || col.name == this.isA.masterKey + '_val'))
                ) {
                    console.log("Hiding column", col.name);
                     continue;
                }
                
                if (col.name == 'id' || col.name == 'time_created' || col.name == 'time_modified' || col.name == 'user_modified') col.disabled = true;
                if (col.name == 'id') col.invisible = true;

                if (col.name.endsWith('_disabled_')) {
                    col.name = col.name.replace('_disabled_', '');
                    col.label = col.label.replace(' disabled', '');
                    col.disabled = true;
                }

                // override deefault invisible
                if (col.visible) {
                    col.invisible = false;
                }

                // overrride default disabled
                if (col.enabled) {
                    col.disabled = false;
                }

                if (!col.invisible) {
                    col.pushToVisible = true;   
                }
            }
            return columns;
        },

        /**
         * Saves the edited row to the table.
         * @async
         * @function saveRow
         * @returns {Promise<void>} A Promise that resolves when the row is saved.
        */
        async saveRow() {
            for (let col of this.columns) {
                if (col.defaultPrevious) {
                    this.$q.localStorage.setItem("default_" + col.name, this.editingRow[col.name]);
                }
            }
            await this.saveRowToDb(this.editMode, this.tableAPI, this.columns, this.editingRow, this.editingRowIndex, this.rows);
        },

        /**
         * Converts a row from the table to an object.
         * @param {Array} row - The row to convert.
         * @returns {Object} - The converted object.
         */
        rowToObject(row, columns) {
            let obj = {};
            for (let col of columns) {
                obj[col.name] = row[col.index];
            }
            return obj;
        },

        /**
         * Adds a new row to the table for editing.
         */
        async addRow() {
            this.editMode = 'add';
            this.editingRow = await this.createEmptyRow(this.columns);
            if (this.masterKey) {
                this.editingRow[this.masterKey] = this.masterValue;
            }
            this.editingRowIndex = this.rows.length;
            await this.loadLookups();
            this.inEdit = true;
        },
            
        /**
         * Edits a row in the table.
         * @param {Object} row - The row to be edited.
         */
        async editRow(row) {
            this.editMode = 'edit';
            this.editingRowIndex = this.rows.indexOf(row);
            this.editingRow = this.rowToObject(row, this.columns);
            await this.loadLookups();
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
                    return true;
                }
            }
            return false;
        },
            
        /**
         * Loads the lookup values for the columns in the table.
         * @returns {Promise<void>} A promise that resolves when the lookup values are loaded.
         */
        async loadLookups() {
            //if (!this.lookupsLoaded) {
                for (let col of this.columns) {
                    if (col.lookup && !col.lookup.loaded) {
                        if (!col.lookup.options) {
                            await this.loadLookup(col.lookup);
                            col.lookup.loaded = true;
                        }
                    }
                }
            //    this.lookupsLoaded = true;
            //}
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
    }
};