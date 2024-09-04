<template>
    <iframe id="iframe" title="Dokument" style="width: 100%; height: 50em" :src="document"></iframe>
</template>

<script>
export default {
    name: "FileViewer",
    props: {
        asPopup: true
    },
    data: function () {
        return {
            document: null
        };
    },
    mounted() {
        this.copyObject(this.$store.popups.default.props, this, true);
        this.getDocument();
    },
    methods: {
        async getDocument() {
            let response = await this.api(this.axios.API.get, restAPI,
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