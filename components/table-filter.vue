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
                    <tr v-for="col in parent.columns.filter(x => !x.invisible)" :key="col.name">
                        <td>
                            <q-checkbox v-if="col.type == 'boolean'" v-model="parent.filter[col.name]" dense
                                class="q-pt-sm" :label="col.label">
                                <template v-slot:label>
                                    <label for="my-checkbox" v-html="col.label"></label>
                                </template>
                            </q-checkbox>
                            <q-input v-else-if="col.type == 'timestamp with time zone'" class="q-pt-xs"
                                type='datetime-local' filled dense clearable v-model="parent.filter[col.name]"
                                mask="date" :label="col.label">
                            </q-input>
                            <q-input v-else v-model="parent.filter[col.name]" :label="col.label" dense
                                style="width:200px" clearable>
                                <template v-slot:label>
                                    <label for="my-input" v-html="col.label"></label>
                                </template>
                            </q-input>
                        </td>
                        <!-- <td><span v-if="col.compare == 'interval'">&nbsp;_&nbsp</span></td> -->
                        <td>
                            <q-select v-model="parent.filterExp[col.name]" :options="expressions" dense options-dense
                                label="" style="width:80px">
                            </q-select>
                        </td>
                        <td>
                            <!-- <div class=" row items-center" v-if="col.compare == 'interval'"> -->
                            <span v-if="parent.filterExp[col.name] == 'between'">
                                <q-input v-if="col.type == 'timestamp with time zone'" class="q-pt-xs"
                                    type='datetime-local' filled dense clearable v-model="parent.filter2[col.name]"
                                    mask="date" :label="col.label">
                                </q-input>
                                <q-input v-else label="" v-model="parent.filter2[col.name]" dense style="width:200px" />
                            </span>
                        </td>
                    </tr>
                </table>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>
<script>
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