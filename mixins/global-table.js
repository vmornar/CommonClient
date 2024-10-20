/**
 * @desc A global mixin object containing methods for table editing and saving.
 * @module GlobalTableMixin
 */
export const GlobalTableMixin = {
    methods: {

        /**
         * Returns the type of the given value.
         * @param {*} value - The value to determine the type of.
         * @returns {string} The type of the value. Possible values are "boolean", "json", or "text".
         */
        getValueType(value) {
            if (value === null) {
                return "text";
            } else if (typeof value === "boolean") {
                return "boolean";
            } else if (typeof value === "object") {
                return "json";
            } else {
                return "text";
            }
        },
        
        /**
         * Prepare row for saving : converts JSON strings to objects, blanks to nulls.
         * 
         * @param {Object} row - The row object.
         * @param {Object[]} columns - The array of column objects.
         */
        prepareRow(row, columns) {
            for (let col of columns) {
                if (col.type == 'json') {
                    row[col.name] = JSON.parse(row[col.name]);
                } else if (col.type == 'boolean') {
                    row[col.name] = row[col.name] ? true : false
                } else if (row[col.name] == "") {
                    row[col.name] = null;
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
            return true;
        },

        /**
         * Creates an empty row object with default values based on the given columns.
         *
         * @param {Array} columns - An array of column objects.
         * @returns {Object} - An empty row object with default values.
         */
        createEmptyRow(columns) {
            let obj = {};
            for (let col of columns) {
                if (col.type == 'json') {
                    obj[col.name] = "{}";
                } else if (col.type == 'boolean') {
                    obj[col.name] = false;
                } else {
                    obj[col.name] = null;
                }
            }
            return obj;
        },

        /**
         * Finds display value for a lookup value in lookup table
         * @param {*} value 
         * @param {*} tableName 
         * @returns display value for the lookup value in the lookup table
         */
        findLookupValue(value, lookupName, lookups) {
            let lookup = lookups[lookupName];
            if (value == null) {
                return "";
            } else {
                return lookup.options.find(v => v[lookup.valueField] == value)[lookup.labelField];
            }
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
        }
    }
};