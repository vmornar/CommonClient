<template>
    <!-- The dialog for filtering the table -->
    <q-dialog :model-value="true" @keydown="handleSaveCancelKeydown">
        <q-card style="overflow: hidden" class="max-width">
            <q-toolbar dark dense flat>
                <q-toolbar-title>{{ $t("Filter") }}</q-toolbar-title>
                <q-btn round margin="xs" size="xs" padding="xs" icon="close" @click="parent.showFilter = false"></q-btn>
            </q-toolbar>
            <q-card-section :style="filterStyle">
                <table>
                    <tbody>
                        <tr v-for="col in parent.columns.filter(x => !x.invisible)" :key="col.name">
                            <td style="padding-top: 13px;"><span v-html="col.label"></span></td>
                            <td>
                                <q-select v-model="parent.filterExp[col.name]" :options="expressions" dense
                                    options-dense label="" style="width:80px">
                                </q-select>
                            </td>
                            <td>
                                <div class="row">
                                    <q-checkbox v-if="col.type == 'boolean'" v-model="parent.filter[col.name]" dense
                                        toggle-indeterminate class="q-pt-sm">
                                        <template v-slot:label>
                                            <label for="my-checkbox" v-html="col.label"></label>
                                        </template>
                                    </q-checkbox>
                                    <q-input v-else-if="col.type == 'timestamp with time zone'" class="q-pt-xs"
                                        type='datetime-local' filled dense clearable v-model="parent.filter[col.name]"
                                        mask="date">
                                    </q-input>
                                    <q-input v-else v-model="parent.filter[col.name]" dense style="width:150px"
                                        clearable>
                                        <template v-slot:label>
                                            <label for="my-input" v-html="col.label"></label>
                                        </template>
                                    </q-input>
                                </div>
                            </td>

                            <td v-if="parent.filterExp[col.name] == 'between'" style="padding-top: 13px;">and</td>
                            <td>
                                <span v-if="parent.filterExp[col.name] == 'between'">
                                    <q-input v-if="col.type == 'timestamp with time zone'" class="q-pt-xs"
                                        type='datetime-local' filled dense clearable v-model="parent.filter2[col.name]"
                                        mask="date" :label="col.label">
                                    </q-input>
                                    <q-input v-else label="" v-model="parent.filter2[col.name]" dense
                                        style="width:200px" />
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>
<script>
/**
 * Table filter component
 * 
 * @component
 * @name TableFilter
 * @example
 * <TableFilter :parent="this" />
 */
export default {
    name: "TableFilter",
    computed: {
        filterStyle() {
            return { maxHeight: (this.$q.screen.height - 100) + 'px', overflow: 'auto' };
        },
    },
    props: {
        parent: {
            type: Object,
            default: () => { }
        }
    },
    data() {
        return {
            expressions: ['=', '>', '<', '>=', '<=', '!=', 'contains', '!contains', 'between', 'set', 'not set']
        };
    },
    mounted() {

    },
    methods: {
    }
};
</script>