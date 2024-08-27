<template>
    <autocomplete ref="picker" outlined popup-content-class="text-h6" v-model="val" :options="$store.icons" dense
        options-dense clearable searchable map-options emit-value></autocomplete>
</template>

<script>
/**
 * Represents the icon picker component.
 * 
 * @component
 * @name IconPicker
 * @example
 * <IconPicker />
 */
import { loadComponent } from '@/common/component-loader';
export default {
    name: "IconPicker",
    components: {
        autocomplete: loadComponent('autocomplete'),
    },
    data: function () {
        return {
            val: '',
        };
    },
    /*
        * Fetches the icons from the Material Design Icons repository.
    */
    async mounted() {
        if (this.$store.icons.length === 0) {
            await this.getIcons();
        }
    },
    methods: {
        focus() {
            this.$refs.picker.focus();
        },
        handleComponentBlur(event) {
            this.$emit('blur', event);
        },
    }
};
</script>
<style scoped></style>
