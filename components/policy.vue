<template>
    <Header :name="$route.name" :title="$t($route.name)" :showHelpButton="false" />
    <div class="q-pa-lg" v-html="policy"></div>
</template>
<script>

/**
 * Policy component
 * 
 * @component
 * @name Policy
 * @example
 * <Policy policyProp="privacy-policy" />
 */
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

    mounted() {
        window.contactUs = this.contactUs;
    },

    methods: {
        /**
         * Initialize the component - retrieve the policy
         */
        async init() {
            let ret = await this.get("CommonAnon/GetPolicy/" + this.policyProp);
            if (ret) {
                this.policy = ret;
            }
            this.policy = ret;
        },

        /**
         * Contact us
         */
        contactUs() {
            console.log("Contact us");
                        // example (embed in help): <a onclick="contactUs()">Contact us</a>
            this.$router.push({ name: "Contact us" });
        }
    },
};
</script>