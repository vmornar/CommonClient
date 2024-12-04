<template>
    <table class="q-ma-md">
        <tbody>
            <tr>
                <th>Index</th>
                <th>Label</th>
                <th>Field</th>
                <th>Value</th>
            </tr>
            <tr v-for="(col, index) in columns" :key="col.name">
                <td>{{ index }}</td>
                <td>{{ col.label }}</td>
                <td>{{ col.name }}</td>
                <td>{{ v(col.name) }}</td>
            </tr>
        </tbody>
    </table>

</template>
<script>

/**
 * Row info component
 * 
 * @component
 * @name RowInfo
 * @example
 * <RowInfo />
 */
export default {
    name: "RowInfo",
    props: ['parentPopup'],
    data: function () {
        return {
            columns: [],
            rowToShow: {}
        }
    },
    created() {
        this.columns = this.$store.popups.default.props.columns;
        this.rowToShow = this.$store.popups.default.props.rowToShow;
    },
    methods: {
        v(colName) {
            if (!this.rowToShow) return '';
            if (typeof this.rowToShow[colName] == 'object') {
                return JSON.stringify(this.rowToShow[colName]);
            } else {
                return this.rowToShow[colName];
            }
        }
    }
}
</script>
<style scoped>
th,
td {
    text-align: left;
}

th {
    background-color: #f2f2f2;
}
</style>