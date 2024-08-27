<template>
    <q-dialog v-model="$store.progress.show" persistent>
        <q-card>
            <q-card-section style="text-align: center; font-weight: bold;">
                <span>{{ title }}</span>
            </q-card-section>
            <div v-if="$store.working">
                <q-card-section class="q-py-none">
                    <q-linear-progress size="25px" :value="percentage" color="positive" style="width:400px"
                        animation-speed="200" />
                </q-card-section>
                <q-card-section class="q-pa-none" style="text-align: center;">
                    <span>{{ progressText }}</span>
                </q-card-section>
            </div>
            <q-card-section v-if="message" v-html="message">
            </q-card-section>
            <q-card-actions align="right">
                <q-btn v-if="ws" flat color="negative" :label="$t('Abort')" icon="abort" @click="abort" />
                <q-btn v-else="ws" flat color="positive" :label="$t('Close')" icon="close" @click="close" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>
<script>
export default {
    data() {
        return {
            ws: null,
            progressValue: 0,
            taskId: null,
            min: 0,
            max: 100,
            title: "Progress",
            message: null,
            autoClose: false,
        };
    },
    computed: {
        percentage() {
            return this.progressValue / this.max;
        },
        progressText() {
            return this.progressValue + "/" + this.max + " (" + Math.round(this.percentage * 100) + "%)";
        },
    },
    async mounted() {

        this.copyObject(this.$store.progress.props, this.$data, true);
        //await this.$nextTick();
        let socketUrl = this.axios.API.defaults.baseURL.replace("http", "ws");
        socketUrl = socketUrl.replace("/api", "/ws");

        this.ws = new WebSocket(socketUrl + this.taskId);
        let self = this;
        this.ws.onopen = (e) => {
            this.$store.working = true;
        };

        this.ws.onmessage = async (e) => {
            let data = JSON.parse(e.data);
            if (data.status == "abort") {
                this.message = this.$t("Task aborted");
                self.stop();
                return;
            } else if (data.status == "progress") {
                console.log("Progress: " + data.message);
                self.progressValue = parseInt(data.message);
            } else if (data.status == "finish") {
                console.log("Task finished", data.message, self.autoClose);
                if (data.message) {
                    this.message = data.message;
                } else {
                    this.message = this.$t("Task finished");
                }
                self.stop();
                if (self.reload) {
                    await self.parent.reload();
                }
                if (self.autoClose) {
                    self.close();
                }
            }
        };
        this.ws.onclose = (e) => {
            //this.message = this.$t("Connection closed");
            console.log("Connection closed");
            this.ws = null;
            this.$store.working = false;
        };
    },
    methods: {
        close() {
            this.$emit("finished");
            this.$store.progress.show = false;
        },
        abort() {
            this.ws.send("abort");
        },
        stop() {
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            this.$store.working = false;
        },
    },
};
</script>
