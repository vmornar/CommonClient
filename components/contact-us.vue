<template>
    <Header :name="$route.name" :title="$t($route.name)" />
    <q-card>
        <q-card-section>
            <q-form ref="form">
                <q-input v-model="email" :rules="$store.rules.email" :label="$t('E-mail')" />
                <q-input v-model="subject" :rules="$store.rules.required" :label="$t('Subject')" />
                <q-input type="textarea" v-model="message" :rules="$store.rules.required":label="$t('Message')" />
            </q-form>
        </q-card-section>
        <q-card-actions>
            <q-btn @click="send" :label="$t('Send')" flat color="positive" no-caps/>
        </q-card-actions>   
    </q-card>
</template>
<script>

/**
 * Contact us component
 * 
 * @component
 * @name ContactUs
 * @example
 * <ContactUs />
 */
export default {
    name: "ContactUs",
    props: {
    },
    data() {
        return {
            email: null,
            subject: null,
            message: null,
        };
    },

    mounted() {
        this.email = this.$store.userData.email;
    },
    methods: {
        async send () {
            if (await this.validateForm(this.$refs.form)) {
                const response = await this.post("/CommonUser/ContactUs", {
                    email: this.email,
                    subject: this.subject,
                    message: this.message,
                });
                if (response !== null) {
                    this.showMessage(this.$t('Message sent successfully'));
                    this.$refs.form.reset();
                    this.subject = null;
                    this.message = null;
                } else {
                    this.showMessage(this.$t('Send failed'));
                }
            }
        },
    },
};
</script>