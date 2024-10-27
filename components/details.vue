<template>
    <Header v-if="!popupName" :title="title" :backButton="!popupName && $store.level > 1" />
    <q-card class="max-width" v-if="localOptions">
        <q-card-section v-if="details && details.length > 1" class="row items-center q-py-xs">
            <q-btn dense flat no-caps
                :class="{ active: detail.name != localOptions.name, bold: detail.name == localOptions.name }"
                v-for="detail in details" :label="detail.name" :key="detail.name" @click="openDetail(detail)" />
            <q-space />
        </q-card-section>
        <q-card-section class="q-pa-none">
            <Table v-if="!asForm" ref="detailTable" :detailTable="true" :options="localOptions" />
            <table-row-editor v-if="asForm && inEdit" ref="detailForm" :parent="this" @save="save" :multiRow="true"
                @cancel="cancel" />
        </q-card-section>
    </q-card>
</template>

<script>

/**
 * Component to display detail of master-detail relationship
 * 
 * @component
 * @name TableDetails
 * @example
 * <TableDetails />
 */

import { loadComponent } from '@/common/component-loader';
import { TableUtilsMixin } from "@/common/mixins/table-utils.js"
import { TableMixin } from "@/common/mixins/table.js"

export default {
    name: 'TableDetails',
    mixins: [TableUtilsMixin, TableMixin],
    components: {
        Table: loadComponent('table'),
        TableRowEditor: loadComponent('table-row-editor')
    },
    props: ['popupName'],

    data: () => {
        return {
            localOptions: null,
            details: null,
            title: 'Details',
        }
    },
    mounted() {
        this.initializeComponent(this.popupName);
        this.openDetail(this.details[0]); // open the first detail by default
    },
    methods: {
        /**
         * Opens the detail.
         * 
         * @param {Object} detail - The detail to be opened.
         */
        async openDetail(detail) {
            detail.masterKey = this.masterKey;
            await this.$nextTick();
            if (this.asForm) {
                this.copyObject(detail, this, true);
                await this.reload();
                if (this.rows.length > 0) {
                    await this.editRow(this.rows[0]);
                } else {
                    await this.addRow();
                }
                this.localOptions = detail;
                console.log("editing row/col", this.inEdit, this.editMode, this.editingRow)
            } else {
                await this.$refs.detailTable.init();
            }
        },
        save() {
            this.saveRow();
        },
        cancel() {
            this.$store.popups[this.popupName].show = false;
        },
    }
}
</script>
<style scoped>
.active {
    text-decoration: underline;
}

.bold {
    font-weight: bold;
}
</style>