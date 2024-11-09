<template>
    <iframe id="iframe" title="Dokument" :style="iframeStyle" :src="document"></iframe>
</template>

<script>
/**
 * File viewer component
 * 
 * @component
 * @name FileViewer
 * @example
 * <FileViewer />
 */
export default {
    name: "FileViewer",
    props: {
        popupName: "default"
    },
    data: function () {
        return {
            document: null,
            API: null

        };
    },
    computed: {
        iframeStyle() {
            return {
                width: "100%",
                height: (this.$q.screen.height - 46) + "px",
            }
        }
    },
    /**
     * Mounted lifecycle method
     */
    async mounted() {
        this.copyObject(this.$store.popups.default.props, this, true);
        this.document = await this.getDocument();
    },
    methods: {
        /**
         * Retrieves the document
         */
        async getDocument() {
            let response = await this.api(this.axios.API.get, this.API,
                {
                    responseType: "blob",
                }
            );
            if (response && response.size) {
                let ret = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }));
                return ret;
            } else {
                return null;
            }
        },
    }
}
</script>