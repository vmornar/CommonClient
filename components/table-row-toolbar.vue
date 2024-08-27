<template>
    <q-btn class="nompy" :size="parent.btnSize" v-if="parent.allowEdit" dense flat icon="edit" color="primary"
        @click="parent.editRow(props.row)">
        <q-tooltip>{{ $t("Edit row") }}</q-tooltip>
    </q-btn>
    <q-btn class="nompy" :size="parent.btnSize" v-if="parent.allowDelete" dense flat icon="delete" color="negative"
        @click="parent.deleteRow(props.row)">
        <q-tooltip>{{ $t("Delete row") }}</q-tooltip>
    </q-btn>
    <q-btn class="nompy" :size="parent.btnSize" v-if="parent.details" dense flat icon="expand_more" color="primary"
        @click="parent.openDetails(props.row)"><q-tooltip>{{ $t("Detail tables")
            }}</q-tooltip></q-btn>
    <span v-for="action of rowActions">
        <q-btn v-if="!action.condition || rowActionVisible(action, props.row)" class="nompy" :size="parent.btnSize"
            dense flat :icon="action.icon" :color="action.iconColor ?? 'primary'"
            @click="parent.runRowAction(action, props.row)" :disable="rowActionDisabled(action, props.row)">
            <q-tooltip v-if="action.tooltip">{{ $t(action.tooltip) }}</q-tooltip>
        </q-btn>
    </span>
    <q-btn class="nompy" :size="parent.btnSize" v-if="parent.isAdmin" dense flat icon="info" color="primary"
        @click="parent.showRowInfo(props.row)">
        <q-tooltip>{{ $t("Row info") }}</q-tooltip></q-btn>
</template>
<script>
export default {
    name: "TableRowToolbar",
    props: {
        parent: {
            type: Object,
            required: true
        },
        props: {
            type: Object,
            required: true
        },
        columns: {
            type: Array,
            required: true
        },
        rowActions: {
            type: Array,
            required: false,
            default: () => []
        },
    },
    methods: {
        /**
         * Determines if row actions is visible based on a condition.
         * @param {string} action - The action.
         * @param {Object} row - The row to be evaluated.
         * @returns {boolean} True if the row action is visible, false otherwise.
         */
        rowActionVisible(action, row) {
            let f = new Function('row', 'parent', action.condition);
            let ret = f(row, this.parent);
            return ret;
        },

        /**
         * Determines if row actions is disabled based on a condition.
         * @param {string} action - The action.
         * @param {Object} row - The row to be evaluated.
         * @returns {boolean} True if the row action is visible, false otherwise.
         */
        rowActionDisabled(action, row) {
            let f = new Function('row', 'parent', action.disabled);
            let ret = f(row, this.parent);
            return ret;
        }

    }
};
</script>