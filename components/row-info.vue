<template>
    <table class="q-ma-md">
        <tr>
            <th>Label</th>
            <th>Field</th>
            <th>Value</th>
        </tr>
        <tr v-for="(col, index) in columns" :key="col.name">
            <td>{{ index }}</td>
            <td>{{ col.label }}</td>
            <td>{{ col.name }}</td>
            <td>{{ rowToShow[col.name] }}</td>
        </tr>
    </table>

</template>
<script>
export default {
    name: "RowInfo",
    data: function () {
        return {
            columns: [],
            rowToShow: {}
        }
    },
    created() {
        this.columns = this.$store.popups.default.props.columns; this.rowToShow = this.$store.popups.default.props.rowToShow;
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