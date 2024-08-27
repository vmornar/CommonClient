<template>
    <Header :name="$route.name" :title="$t($route.name)" :showHelpButton="false" />
    <div class="q-pa-lg" v-html="policy"></div>
</template>
<script>
export default {
    name: "Policy",
    props: {
        policyProp: { type: String, default: null },
    },
    data() {
        return {
            policy: null,
        };
    },

    beforeRouteEnter(to, from, next) {
        next(vm => { vm.init(); });
    },

    beforeRouteUpdate(to, from, next) {
        this.init();
        next();
    },

    methods: {
        async init() {
            let ret = await this.get("CommonAnon/GetPolicy/" + this.policyProp);
            if (ret) {
                this.policy = ret;
            }
            this.policy = ret;
        },
    },
};
</script>