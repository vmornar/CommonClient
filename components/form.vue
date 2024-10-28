<template>
    <Header v-if="!popupName" :title="title" :backButton="!popupName && $store.level > 1" />
    <table-row-editor v-if="loaded" ref="form" @save="save" :multiRow="true" @cancel="cancel" :parent="this" />
</template>

<script>

/**
 * Component to display form editing of a table data
 * 
 * @component
 * @name Form
 * @example
 * <Form />
 */

import { loadComponent } from '@/common/component-loader';
import { TableUtilsMixin } from "@/common/mixins/table-utils.js"
import { TableMixin } from "@/common/mixins/table.js"

export default {
    name: 'Form',
    mixins: [TableUtilsMixin, TableMixin],
    components: {
        TableRowEditor: loadComponent('table-row-editor')
    },
    props: ['popupName'],

    data: () => {
        return {
            loaded: false,
            isForm: true,
        }
    },
    async mounted() {
        this.initializeComponent(this.popupName);
        await this.reload();
        // if (this.rows.length > 0) {
        //    await this.editRow(this.rows[0]);
        // } else {
        //    await this.addRow();
        // }
        this.loaded = true;
    },
    methods: {
        save() {
            this.saveRow();
        },
        cancel() {
            if (this.popupName) {
                this.$store.popups[this.popupName].show = false;
            }
        },
    }
}
</script>
