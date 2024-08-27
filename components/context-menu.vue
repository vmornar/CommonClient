<template>
    <q-menu ref="cm" style="z-index: 9999" touch-position :context-menu="contextMenu" @before-show="show($event)">
        <q-list dense style="min-width: 100px">
            <q-item v-for="item in options.filter(o => o.visible == undefined || o.visible == true)" clickable
                v-close-popup :key="item.label" @click="invokeCallback(item)">
                <q-item-section>{{ item.label }}</q-item-section>
            </q-item>
        </q-list>
    </q-menu>
</template>
<script>
/**
 * Vue component for configurable menus.
 *
 * @component ContextMenu
 * @example
 * <ContextMenu :options="options" />
 */
export default {
    name: "ContextMenu",
    props: {
        contextMenu: { type: Boolean, default: true },
        options: { type: Array }
    },
    data: () => ({
        shown: true,
    }),
    methods: {

        /**
         * Invokes the callback function for the selected item.
         * 
         * @param {Object} item - The selected item.
         */
        invokeCallback(item) {
            item.options = item.options ?? {};
            item.callback(item.options);
        },

        /**
         * Displays the context menu.
         *
         * @param {Object} menu - The menu object to be displayed.
         * @param {Event} e - The event object that triggered the display of the context menu.
         */
        show(e) {
            this.$store.clientCoordinates = [e.offsetX, e.offsetY];
            // see how many options are visible
            let visibleOption = null;
            let visibleOptionsCount = 0;
            for (let o of this.options) {
                if (o.visible || o.visible == undefined) {
                    visibleOption = o;
                    visibleOptionsCount++;
                }
            }
            if (visibleOptionsCount == 1 && visibleOption.runIfSingle) {
                // execute immediately if just one is visible
                this.$refs.cm.hide();
                this.invokeCallback(visibleOption);
                return false;
            } else if (visibleOptionsCount == 0) {
                // hide menu
                this.$refs.cm.hide();
                return false;
            }
            // otherwise menu will be shown
        },

        /**
         * Hides the context menu.
         */
        hide() {
            this.$refs.cm.hide();
        }
    }
}
</script>