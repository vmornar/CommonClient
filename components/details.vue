<template>
    <Header v-if="!popupName" :title="title" :backButton="!popupName && $store.level > 1" />
    <q-card class="max-width">
        <q-card-section v-if="details && details.length > 1" class="row items-center q-py-xs">
            <q-btn dense flat no-caps v-if="options"
                :class="{ active: detail.name != options.name, bold: detail.name == options.name }"
                v-for="detail in details" :label="detail.name" :key="detail.name" @click="openDetail(detail)" />
            <q-space />
        </q-card-section>
        <q-card-section class="q-pa-none" v-if="options">
            <Table ref="detailTable" :detailTable="true" :options="options" />
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
export default {
    name: 'TableDetails',
    components: {
        Table: loadComponent('table')
    },
    props: ['popupName'],

    data: () => {
        return {
            options: null,
            details: null,
            title: 'Details'
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
            this.options = detail;
            this.options.masterKey = this.masterKey;
            await this.$nextTick();
            this.$refs.detailTable.init();
        }
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