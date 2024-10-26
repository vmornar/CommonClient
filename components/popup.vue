<template>
    <q-dialog v-model="$store.popups[name].show" :persistent="$store.popups[name].props.persistent" @hide="closeDialog"
        @keydown.esc="closeDialog"
        :maximized="$store.popups[name].props.maximized || (!$store.isWide && !$store.popups[name].props.doNotMaximize)"
        @keydown.f9="translate">
        <q-card flat class="max-width">
            <q-card-section dense class="max-width row items-center text-bold q-pa-sm background">
                {{ $store.popups[name].props.title }}
                <q-space />
                <q-btn v-for="button in $store.popups[name].props.buttons" :key="button.label" dense flat round
                    :label="button.label" :icon="button.icon" @click="button.action">
                    <q-tooltip>{{ button.tooltip }}</q-tooltip>
                </q-btn>
                <help-button v-if="$store.popups[name].props.help" :name="$t($store.popups[name].props.help)"
                    :titleToShow="$store.popups[name].props.titleToShow ? $t($store.popups[name].props.titleToShow) : $t($store.popups[name].props.help)" />
                <q-btn dense size="sm" flat round icon="close" @click="closeDialog" />
            </q-card-section>
            <q-card-section class="max-width q-pa-none">
                <component v-if="component" :is="component" :popupName="name" />
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script>
/**
 * Popup component for displaying various components.
 * 
 * @component
 * @name Popup
 * @example
 * <Popup />
 */

import { markRaw } from 'vue';
import { loadComponent } from '@/common/component-loader';
import eventBus from '@/common/event-bus';

export default {
    name: 'Popup',
    props: {
        name: {
            type: String,
            default: 'default',
        },
        canCloseIfFormChanged: { type: Boolean, default: false }
    },
    data() {
        return {
            component: null,
        }
    },
    async mounted() {
        this.component = markRaw(loadComponent(this.$store.popups[this.name].component));
    },
    methods: {
        closeDialog() {
            console.log('popupClosed', this.name);
            eventBus.emit('popupClosed', this.name);
            if (this.canCloseIfFormChanged || !this.$store.formChanged) this.$store.popups[this.name].show = false;
        }
    }
}
</script>