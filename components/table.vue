<template>
    <div>
    <div ref="header">
        <Header v-if="!detailTable && !popupName" :name="name ?? $route.name" :title="title ?? $t(name ?? $route.name)"
            :backButton="!popupName && $store.level > 1" />
    </div>
    <div @keydown="handleKeyDown($event, true)">
        <!-- Overlays for inline editing -->
        <q-input v-if="overlays.overlayInput" dense outlined class="input-box" ref="overlayInput" v-model="editedItem"
            type="text" @blur="closeOverlay" @keydown="handleKeyDown($event, false)" :style="overlayStyle" />
        <JsonEditor v-if="overlays.overlayJson" ref="overlayJson" v-model="editedItem" @blur="closeOverlay"
            @keydown="handleKeyDown($event, false)" :style="overlayStyle" />
        <q-input v-if="overlays.overlayText" class="textarea" type="textarea" rows=8 ref="overlayText"
            v-model="editedItem" @blur="closeOverlay" @keydown="handleKeyDown($event, false)" :style="overlayStyle"
            :iconPicker="false" />
        <!-- <span v-if="overlays.overlaySelect" ref="overlaySelect" @focus="$refs.innerSelect.focus"> -->
        <autocomplete v-if="overlays.overlaySelect" ref="overlaySelect" class="input-box" v-model="editedItem"
            :options="activeLookup.options" :option-label="activeLookup.labelField"
            :option-value="activeLookup.valueField" @blur="closeOverlay" :lookup="activeLookup"
            @update:model-value="editedItemChanged" emit-value map-options :style="overlayStyle" />
        <!-- </span> -->
        <icon-picker v-if="overlays.overlayIcon" ref="overlayIcon" v-model="editedItem" @blur="closeOverlay"
            @update:model-value="editedItemChanged" :style="overlayStyle" />

        <div ref="preheader">
            <div v-if="contextValuesLocal" class="row">
                <Autocomplete v-for="cv of contextValuesLocal" :key="cv.name" v-model="cv.value" :label="cv.label"
                    :option-label="cv.optionLabel" :option-value="cv.optionValue" dense :options="cv.options"
                    @update:model-value="reload" :style="{ width: cv.width ?? '100px' }" map-options emit-value
                    :clearable="cv.clearable" />
            </div>
            <!-- Toolbar before the table -->
            <div class="header-container toolbar" style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <div>
                    <q-btn :disable="$store.formChanged" v-for="action of tableActions " dense flat :icon="action.icon"
                        :color="action.iconColor ?? 'primary'" no-caps @click="runTableAction(action)">
                        <div v-if="action.label" v-html="action.label"></div>
                        <q-tooltip v-if="action.tooltip">{{ $t(action.tooltip) }}</q-tooltip>
                    </q-btn>
                    <span v-if="!hideDefaultToolbar">
                        <q-btn v-if="tableAPI && asForm && !noInlineEditing" dense flat icon="table_chart" color="primary" @click="inEdit = false;  asForm = false" :disable="$store.formChanged">
                            <q-tooltip>{{ $t("Table view") }}</q-tooltip>
                        </q-btn>
                        <q-btn v-if="tableAPI && !asForm && !noInlineEditing" dense flat icon="assignment" color="primary" @click="asForm = true" :disable="$store.formChanged">
                            <q-tooltip>{{ $t("Form view") }}</q-tooltip>
                        </q-btn>
                        <q-btn dense flat icon="filter_alt" color="primary" @click="showFilter = true" :disable="$store.formChanged">
                            <q-tooltip>{{ $t("Filter form") }}</q-tooltip>
                        </q-btn>
                        <q-btn v-if="filterSet" dense flat icon="filter_alt_off" color="red" @click="clearFilter" :disable="$store.formChanged">
                            <q-tooltip>{{ $t("Clear filter") }}</q-tooltip></q-btn>
                        <q-btn dense flat icon="refresh" color="primary" @click="reload" :disable="$store.formChanged">
                            <q-tooltip>{{ $t("Reload data") }}</q-tooltip></q-btn>
                        <q-btn v-if="!asForm" dense flat :icon="grid ? 'view_list' : 'view_module'" color="primary"
                            @click="grid = !grid" :disable="$store.formChanged">
                            <q-tooltip>{{ $t("Toggle grid view") }}</q-tooltip></q-btn>
                        <q-btn v-if="allowNew" class="text-bold" dense flat icon="add" color="primary"
                            @click="addRow()" :disable="$store.formChanged">
                            <q-tooltip>{{ $t("Add new row") }}</q-tooltip></q-btn>
                        <q-btn v-if="$store.formChanged" dense flat icon="save" color="positive" @click="saveChanges">
                            <q-tooltip>{{ $t("Save changes") }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn v-if="$store.formChanged" dense flat icon="undo" color="negative" @click="undoChanges">
                            <q-tooltip>{{ $t("Undo changes") }}
                            </q-tooltip>
                        </q-btn>
                    </span>
                </div>
                <div v-if="!hideRecordsToolbar && !asForm">
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
                <div v-if="!hideRecordsToolbar && asForm && $refs.form">
                    <TableRecords :parent="this"/>
                </div>
            </div>
        </div>

        <table-row-editor v-if="loaded && asForm" ref="form" @save="save" @cancel="cancel" :multiRow="true" :parent="this" :rows="filterSet ? rowsFiltered : rows"/>

        <!-- The table -->
        <q-table square v-if="loaded && !asForm" ref="table" class="my-sticky-header-table" @virtual-scroll="scroll"
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
                                <span @click="showOverlay(col, props)">
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
                                <q-btn v-if="col.url" dense flat icon="open_in_new" @click="openURL(col.value)" class="q-pa-none q-ma-none" ></q-btn>
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
                        @click="showOverlay(col, props)" class="q-pa-none q-ma-none">
                        <q-checkbox dense v-if="col.type == 'boolean'" v-model="props.row[col.index]"
                            :disable="!col.enabled && (!allowEdit || col.disabled || noInlineEditing)"
                            @update:model-value="changedRows[props.row[0]] = [...props.row]; $store.formChanged = true;" />
                        <span v-else-if="col.type == 'rating'">
                            <q-rating v-model="props.row[col.index]" :max="col.max" :color="col.color"
                                :color-selected="col.colorSelected" :color-half="col.colorHalf" :icon="col.icon"
                                :icon-selected="col.iconSelected" :icon-half="col.iconHalf" :size="col.size"
                                :disable="!allowEdit || col.disabled || noInlineEditing"
                                @update:model-value="changedRows[props.row[0]] = [...props.row]; $store.formChanged = true;" />
                            {{ props.row[col.index] }}
                        </span>
                        <div v-else class="cell-content">
                            <span v-html="col.password ? '********' : col.value" class="q-pa-none q-ma-none"
                            :style="{ display: 'inline-block', overflow: 'hidden', maxWidth: col.width + '!important', maxHeight: col.height + '!important', verticalAlign: 'middle' }" />
                            <q-btn v-if="col.url" dense flat icon="open_in_new" @click="openURL(col.value)" class="q-pa-none q-ma-none right-in-cell"></q-btn>
                        </div>
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

        <q-dialog v-if="inEdit && !asForm" :model-value="true" @keydown="handleSaveCancelKeydown" persistent>
            <table-row-editor v-if="inEdit" :parent="this" @save="save" :rows="filterSet ? rowsFiltered : rows" @cancel="inEdit = false" />
        </q-dialog>
    </div>
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
import { TableUtilsMixin } from '../mixins/table-utils.js';
import { TableCustomMixin } from '@/specific/mixins/table-custom.js';
import { loadComponent } from '@/common/component-loader';
import TableRecords from './table-records.vue';
import { openURL } from 'quasar';

export default {
    name: "Table",
    mixins: [TableMixin, TableEditMixin, TableCustomMixin, TableUtilsMixin],
    components: {
        TableRowEditor: loadComponent("table-row-editor"),
        TableRowToolbar: loadComponent("table-row-toolbar"),
        TableFilter: loadComponent("table-filter"),
        Autocomplete: loadComponent("autocomplete"),
        JsonEditor: loadComponent("json-editor"),
        IconPicker: loadComponent("icon-picker"),
        TableRecords: loadComponent("table-records"),
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
         * Calculates the height of the table component.
         * 
         * @returns {number} The calculated height of the table.
         */
        height() {
            //await this.$nextTick();
            if (this.$refs.header && this.$refs.preheader) {
                if (!this.detailTable && !this.popupName) {
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
    },
    methods: {
        async saveChanges() {
            if (!this.asForm) {
                await this.saveRows();
            } else {
                await this.$refs.form.save();
            }
        },
        async undoChanges() {
            if (!this.asForm) {
                await this.reload();
                this.$store.formChanged = false;
            } else {
                await this.$refs.form.cancel();
            }
        },
        async save() {
            await this.saveRow();
            this.inEdit = false;
        },
        cancel () {
          //  this.inEdit = false;
        },

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
        async scroll(pos) {
            this.from = pos.from + 1;
            this.to = pos.to + 1;
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
            } else if (event.key === 'Escape') {
                this.closeOverlay();
            } else if (event.key === 'Tab') {
                if (this.currentOverlay) {
                    let o = this.currentOverlay;
                    this.closeOverlay();
                    event.preventDefault();
                    await this.$nextTick();
                    let col = o.props.cols[o.col.index + 1];
                    if (col) {
                        this.showOverlay(col, o.props)
                    }
                }
                //this.closeOverlay();
            } else if (!isParent) {
                this.editedItemChanged();
            }
        },
    },
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
