<template>
  <div class="row">
    <q-uploader style="width:100%" ref="uploader" class="q-pt-md" multiple batch :label="$t('Select or drop files')"
      @uploaded="uploaded" @failed="failed" :url="uploadURL" :accept="$store.popups.default.props.accept ?? '*/*'"
      :form-fields="formFields" :headers="[{ name: 'Authorization', value: 'Bearer ' + this.$keycloak.token }]" />
    <div v-if="error" class="text-negative">{{ error }}</div>
    <q-btn class="q-ma-sm" flat no-caps dense icon="upload" :label="$t('Upload')" @click="upload" />
  </div>
</template>

<script>

/**
 * Vue component for file uploader. Not used in the current version of the application.
 * @component
 * @name FileUploader
 * @example
 * <FileUploader />
 */

export default {
  name: "FileUploader",
  props: ["parentPopup"],
  data() {
    return {
      uploadURL: null,
      error: null
    };
  },

  mounted() {
    this.copyObject(this.$store.popups.default.props, this, true);
    this.uploadURL = this.axios.API.defaults.baseURL + this.uploadURL;
    console.log("uploadURL", this.uploadURL);
  },

  methods: {

    formFields(files) {
      // convert object this.$store.popups.default.props.params to array a
      let a = [{ "name": "params", value: JSON.stringify(this.$store.popups.default.props.params) }];
      return a;
    },

    upload() {
      this.error = null;
      this.$refs.uploader.upload();
    },

    uploaded(info) {
      if (this.parent && this.reload) {
        this.parent.reload();
      }
      this.$store.popups.default.show = false;
    },

    failed(info) {
      if (info.xhr.statusText == "" && info.xhr.responseText == "") {
        this.error = this.$t("Upload failed. Is the file open in another application?");
      } else {
        this.error = info.xhr.statusText + " " + info.xhr.responseText;
      }
    }

  }
};
</script>
