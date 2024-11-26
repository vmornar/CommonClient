<template>
    <q-dialog v-model="$store.popups[name].show" :persistent="$store.popups[name].props.persistent" @hide="closeDialog"
        @keydown.esc="closeDialog"
        :maximized="$store.popups[name].props.maximized || (!$store.isWide && !$store.popups[name].props.doNotMaximize)"
        @keydown.f9="translate">
        <q-card flat class="max-width">
            <q-card-section dense class="max-width row items-center text-bold q-pa-sm background">
                {{ title }}
                <q-space />
                <q-btn v-for="button in $store.popups[name].props.buttons" :key="button.label" dense flat round
                    :label="button.label" :icon="button.icon" @click="button.action">
                    <q-tooltip>{{ button.tooltip }}</q-tooltip>
                </q-btn>
                <help-button v-if="help" :name="$t(help)" :titleToShow="titleToShow" />
                <q-btn dense size="sm" flat round icon="close" @click="closeDialog" />
            </q-card-section>
            <q-card-section class="max-width q-pa-none">
                <component v-if="component" :is="component" :popupName="name" :parentPopup="this" />
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
            default: 'default'
        },
        canCloseIfFormChanged : {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            component: null,
            title: null,
            help: null,
            titleToShow: null
        }
    },
    async mounted() {
        this.component = markRaw(loadComponent(this.$store.popups[this.name].component));
        this.title = this.$store.popups[this.name].props.title;
        this.help = this.$store.popups[this.name].props.help != undefined ? this.$store.popups[this.name].props.help : this.$store.popups[this.name].component;
        this.titleToShow = this.$store.popups[this.name].props.titleToShow;
        this.titleToShow = this.titleToShow != undefined ? this.$t(this.titleToShow) : this.$t(this.help);
        console.log('Popup mounted', this.name, this.component);
    },
    methods: {
        closeDialog() {
            eventBus.emit('popupClosed', this.name);
            if (this.$store.popups[this.name].canCloseIfFormChanged || !this.$store.formChanged) this.$store.popups[this.name].show = false;
        }
    }
}
</script>