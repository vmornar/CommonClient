<template>
    <div ref="header">
        <Header v-if="!parent && !asPopup" :name="name ?? $route.name" :title="title ?? $t(name ?? $route.name)"
            :backButton="!asPopup && $store.level > 1" />
    </div>
    <div ref="parentElement" @keydown="handleKeyDown($event, true)">
        <!-- Overlays for inline editing -->
        <q-input v-if="overlays.overlayInput" class="input-box" outlined ref="overlayInput" v-model="editedItem"
            type="text" @blur="closeOverlay" @keydown="handleKeyDown($event, false)" :style="overlayStyle" />
        <JsonEditor v-if="overlays.overlayJson" ref="overlayJson" v-model="editedItem" @blur="closeOverlay"
            @keydown="handleKeyDown($event, false)" :style="overlayStyle" />
        <q-input v-if="overlays.overlayText" class="textarea" type="textarea" rows=8 ref="overlayText"
            v-model="editedItem" @blur="closeOverlay" @keydown="handleKeyDown($event, false)" :style="overlayStyle"
            :iconPicker="false" />
        <autocomplete v-if="overlays.overlaySelect" ref="overlaySelect" class="input-box" v-model="editedItem"
            :options="overlaySelectOptions.options" :option-label="overlaySelectOptions.optionLabel"
            :option-value="overlaySelectOptions.optionValue" @blur="closeOverlay"
            @update:model-value="editedItemChanged" emit-value map-options :style="overlayStyle" />
        <icon-picker v-if="overlays.overlayIcon" ref="overlayIcon" v-model="editedItem" @blur="closeOverlay"
            @update:model-value="editedItemChanged" :style="overlayStyle" />

        <q-dialog v-model="showDetails">
            <table-details v-if="showDetails && details" :details="details" :parent="current"
                @close="showDetails = false" />
        </q-dialog>

        <div ref="preheader">
            <div v-if="contextValuesLocal" class="row">
                <Autocomplete v-for="cv of contextValuesLocal" :key="cv.name" v-model="cv.value" :label="cv.label"
                    :option-label="cv.optionLabel" :option-value="cv.optionValue" dense :options="cv.options"
                    @update:model-value="reload" :style="{ width: cv.width ?? '100px' }" map-options emit-value
                    :clearable="cv.clearable" />
            </div>
            <!-- Toolbar before the table -->
            <div class="header-container toolbar">
                <div class="left">
                    <q-btn v-for="action of tableActions " dense flat :icon="action.icon"
                        :color="action.iconColor ?? 'primary'" no-caps @click="runTableAction(action)">
                        <div v-if="action.label" v-html="action.label"></div>
                        <q-tooltip v-if="action.tooltip">{{ $t(action.tooltip) }}</q-tooltip>
                    </q-btn>
                    <span v-if="!hideDefaultToolbar">
                        <q-btn dense flat icon="filter_alt" color="primary" @click="showFilter = true">
                            <q-tooltip>{{ $t("Filter form") }}</q-tooltip>
                        </q-btn>
                        <q-btn v-if="filterSet" dense flat icon="filter_alt_off" color="red" @click="clearFilter">
                            <q-tooltip>{{ $t("Clear filter") }}</q-tooltip></q-btn>
                        <q-btn dense flat icon="refresh" color="primary" @click="reload">
                            <q-tooltip>{{ $t("Reload data") }}</q-tooltip></q-btn>
                        <q-btn dense flat :icon="grid ? 'view_list' : 'view_module'" color="primary"
                            @click="grid = !grid">
                            <q-tooltip>{{ $t("Toggle grid view") }}</q-tooltip></q-btn>
                        <q-btn v-if="allowNew" class="text-bold" dense flat icon="add" color="primary"
                            @click="addRow()">
                            <q-tooltip>{{ $t("Add new row") }}</q-tooltip></q-btn>
                        <q-btn v-if="$store.formChanged" dense flat icon="save" color="positive" @click="saveRows">
                            <q-tooltip>{{ $t("Save changes") }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn v-if="$store.formChanged" dense flat icon="undo" color="negative" @click="undoChanges">
                            <q-tooltip>{{ $t("Undo changes") }}
                            </q-tooltip>
                        </q-btn>
                    </span>
                </div>
                <div class="right" v-if="!hideRecordsToolbar">
                    <span v-if="nRows > 0">
                        {{ $t("Records") }} {{ from }}-{{ to }} {{ $t("of") }} {{ nRows }}
                    </span>
                    <span v-else>{{ $t("No data available") }}</span>
                    <q-btn v-if="from > 1" dense flat icon="first_page" color="primary"
                        @click="$refs.table.scrollTo(0)">
                        <q-tooltip>{{ $t("First record") }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="to < nRows" dense flat icon="last_page" color="primary"
                        @click="$refs.table.scrollTo(nRows - 1)">
                        <q-tooltip>{{ $t("Last record") }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="nRows > 0" dense flat icon="download" color="primary" @click="exportTable">
                        <q-tooltip>{{ $t("Download table") }}</q-tooltip>
                    </q-btn>
                </div>
            </div>
        </div>

        <!-- The table -->
        <q-table square v-if="loaded" ref="table" class="my-sticky-header-table" @virtual-scroll="scroll"
            :table-style="tableStyle" dense flat bordered :rows="filterSet ? rowsFiltered : rows" :columns="columns"
            :visible-columns="visibleColumns" :row-key="key" virtual-scroll virtual-scroll-slice-size=1
            v-model:pagination="pagination" :rows-per-page-options="[0]" :selection="selection"
            v-model:selected="selectedRows" hide-bottom :selected-rows-label="selectedRowsLabel" :grid="grid">

            <!-- Header -->
            <template v-slot:header="props">

                <!-- column names -->
                <q-tr :props="props">
                    <q-th v-if="selection != 'none'" style="width:'15px'">
                        <q-checkbox dense v-if="selection == 'multiple'" v-model="props.selected" />
                    </q-th>
                    <q-th v-if="hasRowToolbar">
                    </q-th>
                    <q-th v-for="(col, index) in props.cols " :key="col.name" :props="props" :ref="'col-' + col.name">
                        <span class="text-bold" v-html="col.label" :style="{ display: 'inline-block' }"></span>
                    </q-th>
                </q-tr>

                <!-- filter row -->
                <q-tr :props="props">
                    <q-td v-if="selection != 'none'" style="width:'15px'" />
                    <q-td v-if="hasRowToolbar" />
                    <q-td v-for="col in props.cols" :key="col.name" :props="props" class="q-pa-none  q-ma-none">
                        <q-checkbox v-if="col.type == 'boolean'" v-model="filter[col.name]" dense
                            toggle-indeterminate />
                        <q-input v-else type="search" placeholder="Search" clearable dense v-model="filter[col.name]"
                            class="q-my-none q-py-none">
                            <template v-slot:after>
                                <q-icon size="xs" name="search"></q-icon>
                            </template>
                        </q-input>
                    </q-td>
                </q-tr>
            </template>

            <!-- grid -->
            <template v-slot:item="props">
                <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition">
                    <!-- :style="props.selected ? 'transform: scale(0.95);' : ''"> -->
                    <q-card flat>
                        <q-separator></q-separator>
                        <!-- :class="props.selected ? 'bg-grey-2' : ''"> -->
                        <q-card-section v-if="selection != 'none' || hasRowToolbar">
                            <q-checkbox v-if="selection != 'none'" dense v-model="props.selected"
                                :label="props.row.name"></q-checkbox>
                            <table-row-toolbar :parent="this" :props="props" :columns="columns"
                                :rowActions="rowActions" />
                        </q-card-section>
                        <q-list dense>
                            <q-item v-for="col in props.cols" :key="col.name">
                                <span class="label">{{ col.label }}</span>&nbsp;<q-space />
                                <!-- <span v-html="col.value"></span> -->
                                <span @click="showOverlay(props.key + '-' + col.index, col, props)">
                                    <q-checkbox dense v-if="col.type == 'boolean'" v-model="props.row[col.index]"
                                        :disable="!allowEdit || col.disabled || noInlineEditing"
                                        @update:model-value="changedRows[props.row[0]] = [...props.row]; $store.formChanged = true;" />
                                    <span v-else-if="col.type == 'rating'">
                                        <q-rating v-model="props.row[col.index]" :max="col.max" :size="col.size"
                                            :color="col.color" :color-selected="col.colorSelected"
                                            :color-half="col.colorHalf" :icon="col.icon"
                                            :icon-selected="col.iconSelected" :icon-half="col.iconHalf"
                                            :disable="!allowEdit || col.disabled || noInlineEditing"
                                            @update:model-value="changedRows[props.row[0]] = [...props.row]; $store.formChanged = true;" />
                                        {{ props.row[col.index] }}
                                    </span>
                                    <span v-else :ref="props.key + '-' + col.index"
                                        v-html="col.password ? '********' : col.value" class="q-pa-none q-ma-none"
                                        :style="{ display: 'inline-block', overflow: 'hidden', maxWidth: col.width + '!important', maxHeight: col.height + '!important', verticalAlign: 'middle' }" />
                                </span>
                            </q-item>
                        </q-list>
                    </q-card>
                </div>
            </template>

            <!-- normal rows -->
            <template v-slot:body="props">
                <!-- <q-tr :props="props" :class="{ 'background': (props.pageIndex % 2 == 0) }"> -->
                <q-tr :props="props"
                    :class="(props.pageIndex % 2 == 0) ? 'background' + (this.$q.dark.isActive ? '-dark' : '') : ''">
                    <q-td v-if="selection != 'none'">
                        <q-checkbox dense v-model="props.selected" />
                    </q-td>
                    <q-td v-if="hasRowToolbar">
                        <table-row-toolbar :parent="this" :props="props" :columns="columns" :rowActions="rowActions" />
                    </q-td>
                    <q-td v-for="   col in props.cols   " :key="col.name" :props="props"
                        :ref="props.key + '-' + col.index"
                        :style="{ maxWidth: col.width + ' !important', verticalAlign: 'middle' }"
                        @click="showOverlay(props.key + '-' + col.index, col, props)" class="q-pa-none q-ma-none">
                        <q-checkbox dense v-if="col.type == 'boolean'" v-model="props.row[col.index]"
                            :disable="!allowEdit || col.disabled || noInlineEditing"
                            @update:model-value="changedRows[props.row[0]] = [...props.row]; $store.formChanged = true;" />
                        <span v-else-if="col.type == 'rating'">
                            <q-rating v-model="props.row[col.index]" :max="col.max" :color="col.color"
                                :color-selected="col.colorSelected" :color-half="col.colorHalf" :icon="col.icon"
                                :icon-selected="col.iconSelected" :icon-half="col.iconHalf" :size="col.size"
                                :disable="!allowEdit || col.disabled || noInlineEditing"
                                @update:model-value="changedRows[props.row[0]] = [...props.row]; $store.formChanged = true;" />
                            {{ props.row[col.index] }}
                        </span>
                        <span v-else v-html="col.password ? '********' : col.value" class="q-pa-none q-ma-none"
                            :style="{ display: 'inline-block', overflow: 'hidden', maxWidth: col.width + '!important', maxHeight: col.height + '!important', verticalAlign: 'middle' }" />
                    </q-td>
                </q-tr>
            </template>
            <template v-slot:top-row="props">
                <q-tr v-if="summary_top">
                    <q-td v-if="selection != 'none'">
                    </q-td>
                    <q-td v-if="hasRowToolbar">
                    </q-td>
                    <q-td v-for="col in props.cols" :key="col.name" :class="col.__thClass">
                        <span class="summary-bottom">{{ calc(col, summary_top) }}</span>
                    </q-td>
                </q-tr>
            </template>
            <template v-slot:bottom-row="props">
                <q-tr v-if="summary">
                    <q-td v-if="selection != 'none'">
                    </q-td>
                    <q-td v-if="hasRowToolbar">
                    </q-td>
                    <q-td v-for="col in props.cols" :key="col.name" :class="col.__thClass">
                        <span class="summary-top">{{ calc(col, summary) }}</span>
                    </q-td>
                </q-tr>
            </template>
        </q-table>

        <table-filter v-if="showFilter" :parent="this" @cancel="showFilter = false" />
        <table-row-editor v-if="inEdit" :parent="this" @save="saveRow" @cancel="inEdit = false" />
    </div>
</template>

<script>

/**
 * Generic table component
 * 
 * @component
 * @name Table
 * @example
 * <Table />
 */

import { TableEditMixin } from '../mixins/table-edit.js';
import { TableMixin } from '../mixins/table.js';
import { TableCustomMixin } from '@/specific/mixins/table-custom.js';
import { loadComponent } from '@/common/component-loader';

export default {
    name: "Table",
    mixins: [TableMixin, TableEditMixin, TableCustomMixin],
    components: {
        TableRowEditor: loadComponent("table-row-editor"),
        TableRowToolbar: loadComponent("table-row-toolbar"),
        TableFilter: loadComponent("table-filter"),
        Autocomplete: loadComponent("autocomplete"),
        JsonEditor: loadComponent("json-editor"),
        IconPicker: loadComponent("icon-picker"),
        TableDetails: loadComponent("table-details")
    },
    watch: {
        '$route.query.timestamp': {
            handler(val) {
                this.init();
            },
            immediate: true
        },
    },
    data: () => ({
        rowsFiltered: [],
    }),
    computed: {

        /**
         * Determines if the row toolbar should be displayed.
         * The toolbar is shown if any of the following conditions are met:
         * - Editing is allowed (`allowEdit` is true)
         * - Deleting is allowed (`allowDelete` is true)
         * - There are specific row actions defined (`rowActions` is true)
         * - The user has admin privileges (`isAdmin` is true)
         *
         * @returns {boolean} True if the row toolbar should be displayed, otherwise false.
         */
        hasRowToolbar() {
            return this.allowEdit || this.allowDelete || this.rowActions || this.isAdmin;
        },

        /**
         * Returns a boolean value indicating whether the filter is set for any column.
         * 
         * @returns {boolean} True if the filter is set for any column, otherwise false.
         */
        filterSet() {
            let ret = this.columns.filter(col => this.filterExp[col.name] == "set"
                || this.filterExp[col.name] == "not set"
                || (this.filter[col.name] != undefined && this.filter[col.name].toString() != "")
                || (this.filter2[col.name] != undefined && this.filter2[col.name].toString() != "")
                );
            if (ret.length > 0) {
                let f = "";
                for (let col of ret) {
                    if (f != "") f += " && ";
                    let index = this.frugal ? col.index : '"' + col.name + '"';
                    if (this.filterExp[col.name] == 'set') {
                        f += `row[${index}] != null`;
                    } else if (this.filterExp[col.name] == 'not set') {
                        f += `row[${index}] == null`;
                    } else if (col.type == "boolean") {
                        f += `row[${index}] == ${this.filter[col.name]}`;
                    } else if (this.filterExp[col.name] == 'contains') {
                        f += `(row[${index}] ?? "").toString().toLowerCase().includes("${this.filter[col.name].toLowerCase()}")`;
                    } else if (this.filterExp[col.name] == '!contains') {
                        f += `!row[${index}].toString().toLowerCase().includes("${this.filter[col.name].toLowerCase()}")`;
                    } else if (this.filterExp[col.name] == '=') {
                        f += `this.realValue("${col.type}", row[${index}]) == "${this.filter[col.name].toLowerCase()}"`;
                    } else if (this.filterExp[col.name] == '!=') {
                        f += `this.realValue("${col.type}", row[${index}]) != "${this.filter[col.name].toLowerCase()}"`;
                    } else if (this.filterExp[col.name] == '>') {
                        f += `this.realValue("${col.type}", row[${index}]) > ${this.filter[col.name]}`;
                    } else if (this.filterExp[col.name] == '>=') {
                        f += `this.realValue("${col.type}", row[${index}]) >= ${this.filter[col.name]}`;
                    } else if (this.filterExp[col.name] == '<') {
                        f += `this.realValue("${col.type}", row[${index}]) < ${this.filter[col.name]}`;
                    } else if (this.filterExp[col.name] == '<=') {
                        f += `this.realValue("${col.type}", row[${index}]) <= ${this.filter[col.name]}`;
                    } else if (this.filterExp[col.name] == 'between') {
                        f += `this.realValue("${col.type}", row[${index}]) >= ${this.filter[col.name]} && this.realValue("${col.type}", row[${index}]) <= ${this.filter2[col.name]}`;
                    }
                }
                f = `return ${f}`;
                let filterFunction = new Function("row", f);
                filterFunction = filterFunction.bind(this);
                this.rowsFiltered = this.rows.filter(filterFunction);
                return true;
            }
            return false;
        },

        /**
         * Returns the size of the button based on the screen size.
         * 
         * @returns {string} The size of the button ('sm' for small or 'md' for medium).
         */
        btnSize() {
            return this.$q.screen.gt.sm ? 'sm' : 'md';
        },

        /**
         * Returns the number of rows in the table.
         * If the rows array is empty, it returns 0.
         * If the filterSet is enabled, it returns the length of the filtered rows array.
         * Otherwise, it returns the length of the rows array.
         *
         * @returns {number} The number of rows in the table.
         */
        nRows() {
            if (!this.rows) return 0;
            return this.filterSet ? this.rowsFiltered.length : this.rows.length;
        },

        /**
         * Returns an array of columns that should be shown in the edit mode.
         * 
         * @returns {Array} The array of columns to be shown in edit mode.
         */
        editColumns() {
            let ec = [...this.columns];
            this.swapIdAndValColumns(ec);
            return ec.filter(col => this.showColInEdit(col));
        },

        /**
         * Calculates the height of the table component.
         * 
         * @returns {number} The calculated height of the table.
         */
        height() {
            //await this.$nextTick();
            if (this.$refs.header && this.$refs.preheader) {
                if (!this.parent && !this.asPopup) {
                    //if (!this.$refs.preheader || !this.$refs.header) return 0;            
                    return this.$q.screen.height - this.$refs.header.offsetHeight - 40 - this.$refs.preheader.offsetHeight - 5;
                } else {
                    //if (!this.$refs.preheader) return 0;
                    return this.$q.screen.height - 150 - this.$refs.preheader.offsetHeight;
                }
            }
        },

        /**
         * Returns the style for the table.
         * @returns {string} The style for the table.
         */
        tableStyle() {
            return `height: ${this.height}px; width: ${this.$store.screenWidth - 5}px;`;
        },

        /**
         * Filters the rows based on the specified filter expressions.
         * 
         * @returns {Array} The filtered rows.
         */
        // rowsFiltered() {
        //     return this.rows.filter(this.filterFunction);
        // },
    },
    methods: {

        /**
         * Converts the given value based on the column type.
         * 
         * @param {Object} col - The column object.
         * @param {any} val - The value to be converted.
         * @returns {any} - The converted value.
         */
        realValue(type, val) {
            if (type == "timestamp with time zone") {
                return this.toLocalISOString(new Date(val));
            } else if (type == "string" || type == "text" || type == "character varying" || type == "character") {
                return val?.toLowerCase();
            } else if (val == null) {
                return '';
            } else {
                return val;
            }
            // let ret;
            // if (type == "timestamp with time zone") {
            //     ret = this.toLocalISOString(new Date(val));
            // } else if (type == "string" || type == "text" || type == "character varying" || type == "character") {
            //     ret = val?.toLowerCase();
            // } else if (val == null) {
            //     ret = '';
            // } else {
            //     ret = val;
            // }
            // console.log("realValue", type, val, ret);
            // return ret;
        },

        /**
         * Calculate the summary of a column
         * @param {object} col - column 
         * @param {object} summary 
         */
        calc(col, summary) {
            let name = col.name;
            if (summary.labelColumn && name == summary.labelColumn.name) {
                return summary.labelColumn.text;
            }
            let type = summary[name];
            if (type == null) return '';
            if (this.frugal) {
                name = this.columns.find(x => x.name == name).index;
            }
            let res;
            if (type == 'sum') {
                res = this.rowsFiltered.reduce((acc, row) => acc + row[name], 0);
            } else if (type == 'count') {
                res = this.rowsFiltered.length;
            } else if (type == 'avg') {
                res = this.rowsFiltered.reduce((acc, row) => acc + row[name], 0) / this.rows.length;
            } else if (type == 'min') {
                res = this.rowsFiltered.reduce((acc, row) => Math.min(acc, row[name]), Infinity);
            } else if (type == 'max') {
                res = this.rowsFiltered.reduce((acc, row) => Math.max(acc, row[name]), -Infinity);
            }
            return col.format(res);
        },
        /**
         * Clear the filter
         */
        clearFilter() {
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
        async calculateColumnWidths() {
            await this.$nextTick();
            for (let col of this.columns) {
                let el = this.$refs["col-" + col.name]?.[0];
                if (!el) continue;
                el = el && el.$el ? el.$el : el;
                if (!el) continue;
                const width = el.offsetWidth;
                col.width = width;
            }
        },
        /**
         * Scroll event
         * @param {*} details 
         */
        async scroll(details) {
            this.from = details.from + 1;
            this.to = details.to + 1;
            this.closeAllOverlays();
            await this.calculateColumnWidths();
        },
        /**
         * Text displaying the number of selected rows
         */
        selectedRowsLabel() {
            this.selectedRows.length + ' ' + this.$t('selected');
        },

        /**
         * Opens the details view for a given row.
         *
         * @param {Object} row - The row object containing the data for the selected row.
         */
        openDetails(row) {
            let parentName = "";
            if (this.parentName) {
                if (!this.frugal) {
                    parentName = row[this.parentName];
                } else {
                    parentName = row[this.columns.find(x => x.name == this.parentName).index];
                }
            }
            this.current = { key: this.parentKey, value: row[0], name: parentName };
            this.showDetails = true;
        },

        /**
         * Handles the keydown event.
         * 
         * @param {Event} event - The keydown event object.
         * @param {boolean} isParent - Indicates whether the event is triggered by a parent component.
         */
        async handleKeyDown(event, isParent) {
            if (event.ctrlKey && event.key === 'f') {
                this.showFilter = true;
                event.preventDefault();
                this.closeOverlay();
            } else if (event.altKey && event.key === 'a') {
                this.addRow();
                event.preventDefault();
                this.closeOverlay();
            } else if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                event.stopPropagation();
                this.saveRows();
                this.closeOverlay();
            } else if (event.ctrlKey && event.key === 'u') {
                this.undoChanges();
                event.preventDefault();
                this.closeOverlay();
            } else if (event.key === 'Tab') {
                if (this.currentOverlay) {
                    let o = this.currentOverlay;
                    this.closeOverlay();
                    event.preventDefault();
                    await this.$nextTick();
                    let col = o.props.cols[o.col.index + 1];
                    if (col) {
                        this.showOverlay(col.name + '-' + col.index, col, o.props)
                    }

                }
                //this.closeOverlay();
            } else if (!isParent) {
                this.editedItemChanged();
            }
        },
    }
}
</script>

<style scoped>
.label {
    color: gray;
}

.toolbar {
    top: 76px;
    width: 100%;
    z-index: 100;
}

.my-sticky-header-table {
    /* background-color: white; */
}

.my-sticky-header-table thead tr:first-child th {
    /* background-color: #1976D2; */
    background-color: var(--q-primary);
    color: white;
}

.my-sticky-header-table {
    top: 0px !important;
}

.my-sticky-header-table thead tr:first-child th {
    position: sticky;
    z-index: 1;
    top: 0px;
}

:deep(.input-box .q-field__control),
:deep(.input-box .q-field__marginal) {
    height: 32px;
    padding: 0px 2px 2px 2px;
    border-radius: 0px;
    /* background-color: white; */
}

:deep(.text-box .q-field__control),
:deep(.text-box .q-field__marginal) {
    height: 100px;
    padding: 0px 2px 2px 2px;
    border-radius: 0px;
    /* background-color: white; */
}

.textarea {
    outline: 1px solid #ccc;
    /* background-color: white; */
}
</style>
