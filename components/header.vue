<template>
    <div :class="{ 'header-container': true, 'background': !$q.dark.isActive }" :style="headerStyle">
        <div class="text-subtitle1 text-bold q-pa-xs q-ma-none left">
            <q-btn dense v-if="backButton" flat icon="arrow_back" @click="goBack">
                <q-tooltip>{{ $t("Back") }}</q-tooltip>
            </q-btn>
            {{ titleToShow }}
            <q-circular-progress v-if="$store.working" size="24px" indeterminate color="primary" class="nomy"
                :thickness="0.3" />
        </div>
        <q-dialog v-if="inEdit" :model-value="true">
            <table-row-editor v-if="inEdit" :parent="this" @save="saveRow" @cancel="inEdit = false" />
        </q-dialog>
        <div class="q-pa-xs q-ma-none right row">
            <q-btn dense flat icon="route" @click="getRouteParameters" v-if="isAdmin">
                <q-tooltip>{{ $t("Edit route parameters") }}</q-tooltip>
            </q-btn>
            <help-button v-if="showHelpButton" :options="null" :name="nameForHelp" :titleToShow="titleToShow" />
        </div>
    </div>
</template>
<script>
/**
 * Represents the header component for the application.
 * 
 * @component
 * @name Header
 * @example
 * <Header />
 */
import { loadComponent } from '@/common/component-loader';
export default {
    name: "Header",
    components: {
        TableRowEditor: loadComponent('table-row-editor'),
    },
    props: {
        name: { type: String, default: null },
        title: { type: String, default: null },
        backButton: { type: Boolean, default: false },
        showHelpButton: { type: Boolean, default: true },
        help: { type: String, default: null },
    },
    data() {
        return {
            inEdit: false,
            editingRow: {},
            lookups: {},
            columns: [],
        };
    },
    computed: {
        titleToShow() {
            return this.title ?? this.$route.meta.title ?? this.$route.name;
        },
        nameForHelp() {
            return this.help ?? this.name ?? this.$route.path;
        },
        headerStyle() {
            return {
                maxWidth: this.$store.screenWidth + 'px',
            };
        },
    },
    methods: {
        /**
         * Navigates back to the previous page.
         */
        goBack() {
            this.$store.level--;
            this.$router.go(-1);

        },
        /**
         * Saves the changes made to route parameters. Admins only.
         * 
         * @returns {Promise<void>} A promise that resolves when the changes are saved.
         */
        async saveRow() {
            
            this.inEdit = false;

            let saveRow = {};
            this.copyObject(this.editingRow, saveRow);

            this.prepareRow(saveRow, this.columns);

            await this.put("Table/meta_route", saveRow);

            await this.getRoutes();
            let route = this.$store.routes.find((r) => r.path === this.$route.path);
    
            this.activateRoute(route);

        },

        /**
         * Retrieves the route parameters and initializes the editingRow object. Admins only.
         */
        async getRouteParameters() {
            this.inEdit = false;
            await this.$nextTick();
            let route = this.$store.routes.find((r) => r.path === this.$route.path);
            if (!route) {
                await this.showError("Can't edit route parameters defined in router.js");
                return;
            }
            this.editingRow = {};

            this.copyObject(route, this.editingRow);
            this.columns = Object.keys(this.editingRow).map((k) => {
                return { name: k, label: k, type: this.getValueType(this.editingRow[k]), required: true };
            });
            this.editingRow.props = JSON.stringify(this.editingRow.props);
            this.inEdit = true;
        },
    },
};
</script>
<style scoped>
.header-container {
    display: flex;
    justify-content: space-between;
}
</style>