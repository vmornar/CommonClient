<template>
    <q-card class="max-width" v-if="details.length > 0">
        <q-card-section class="row items-center">
            {{ parent.name }}&nbsp;
            <q-btn dense flat no-caps v-if="options"
                :class="{ active: detail.name != options.name, bold: detail.name == options.name }"
                v-for="detail in details" :label="detail.name" :key="detail.name" @click="openDetail(detail)" />
            <q-space />
            <q-btn dense size="sm" flat round icon="close" @click="$emit('close')" />
        </q-card-section>
        <q-card-section>
            <detail-table v-if="options" ref="detailTable" :options="options" />
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
        DetailTable: loadComponent('table')
    },
    props: {
        parent: {
            type: Object,
            default: null
        },
        details: {
            type: Array,
            default: []
        }
    },
    data: () => {
        return {
            options: null
        }
    },
    mounted() {
        this.openDetail(this.details[0]);
    },
    methods: {
        /**
         * Opens the detail.
         * 
         * @param {Object} detail - The detail to be opened.
         */
        openDetail(detail) {
            if (this.options && this.options.name == detail.name) {
                return;
            }
            this.options = detail;
            this.options.parent = this.parent;
            this.$nextTick(() => {
                this.$refs.detailTable.init();
            });
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