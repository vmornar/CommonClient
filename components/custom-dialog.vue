<template>
    <q-dialog ref="dialog" :persistent="persistent" @hide="onDialogHide">
        <q-card class="max-width">
            <q-card-section :class="{ 'text-subtitle1': true, 'q-pa-sm': true, 'normal': !error, 'error': error }"
                v-html="title" />
            <q-card-section class="q-pa-sm q-mt-sm" v-html="message" />
            <q-card-actions align="right">
                <q-btn flat dense color="positive" :label="okText" @click="onOKClick" />
                <q-btn flat dense v-if="cancel" color="negative" :label="cancelText" @click="onCancelClick" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script>
/**
 * Custom dialog component
 * 
 * @component
 * @name CustomDialog
 * @example
 * <CustomDialog />
 */
export default {
    props: {
        error: { type: Boolean, default: false },
        message: String,
        title: String,
        type: String,
        persistent: { type: Boolean, default: true },
        ok: { type: Boolean, default: true },
        cancel: { type: Boolean, default: false },
        okText: { type: String, default: 'OK' },
        cancelText: { type: String, default: 'Cancel' }
    },

    emits: [
        'ok', 'hide'
    ],

    methods: {
        show() {
            this.$refs.dialog.show()
        },

        hide() {
            this.$refs.dialog.hide()
        },

        onDialogHide() {
            this.$emit('hide')
        },

        onOKClick() {
            this.$emit('ok')
            // or with payload: this.$emit('ok', { ... })
            this.hide()
        },

        onCancelClick() {
            this.hide()
        }
    }
}
</script>
<style scoped>
.error {
    color: white;
    background-color: red;
}

.normal {
    color: var(--q-primary);
    background-color: var(--q-background);
}

.q-dialog-plugin {
    max-width: 400px;
}
</style>