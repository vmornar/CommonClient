<template>
    <div>
        <Header title="Chat" />
        <div class="row q-pa-sm">
            <autocomplete v-model="room_id" :label="cv_label" dense :options="$store.catalogs.rooms"
                @update:model-value="reload" :style="{ width: '250px' }" map-options emit-value :clearable="false" />
        </div>
        <q-card flat>
            <q-card-section class="q-pa-none">
                <q-scroll-area ref="scroll"
                    :style="{ height: ($q.screen.height - 75 - 65 - 65 - 30) + 'px', width: '100%' }">
                    <div class="q-pa-md row justify-center">
                        <div style="width: 100%; max-width: 600px">
                            <q-chat-message v-for="msg in messages" :key="msg.id" :name="msg.name" :text="msg.text"
                                :sent="msg.sent" class="q-px-lg" :stamp="when(msg.time_created)" />
                        </div>
                    </div>
                </q-scroll-area>
            </q-card-section>
            <q-card-section>
                <div class="row">
                    <div class="col">
                        <q-input v-model="message" label="Message" dense @keyup.enter="checkSendMessage" />
                    </div>
                    <q-btn @click="checkSendMessage" label="Send" no-caps flat dense icon="send" />
                </div>
            </q-card-section>
        </q-card>
    </div>
</template>
<script>
/**
 * Chat component
 * 
 * @component
 * @name Chat
 * @example
 * <Chat />
 */
import { loadComponent } from '@/common/component-loader';
export default {
    name: "Chat",
    components: {
        Autocomplete: loadComponent("autocomplete"),
    },
    data() {
        return {
            messages: [],
            room_id: null,
            cv_name: null,
            cv_label: null,
            ws: null,
            message: "",
            socketUrl: null,
            queue: [],
        }
    },

    /**
     * Mounted lifecycle method - initializes the component
     */
    mounted() {
        this.copyObject(this.$store.props[this.$route.path], this, true);
        if (this.$q.localStorage.has(this.cv_name)) {
            this.room_id = this.$q.localStorage.getItem(this.cv_name);
        } else {
            this.room_id = this.$store.catalogs.rooms[0].value;
        }
        this.socketUrl = this.axios.API.defaults.baseURL.replace("http", "ws").replace("/api", "/chat");
        this.reload();
    },
    methods: {
        /**
         * Closes the socket
         */
        closeSocket() {
            console.log("Closing socket ", this.ws ? this.ws.readyState : "null");
            if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
                this.ws.close();
                this.ws = null;
            }
        },
        /**
         * Checks the socket and reopens it if necessary
         */
        async checkSocket() {
            console.log("Checking socket ", this.ws ? this.ws.readyState : "null");
            if (this.ws == null || this.ws.readyState != WebSocket.OPEN) {
                console.log("Closing socket ", this.ws ? this.ws.readyState : "null");
                this.closeSocket();
                console.log("Opening socket ", this.socketUrl + this.room_id);
                this.ws = new WebSocket(this.socketUrl + this.room_id);
                this.messages = [];
                this.ws.onmessage = async (event) => {
                    console.log("Message received ", event.data);
                    let msg = JSON.parse(event.data);
                    console.log("Message ", msg);
                    msg.forEach((item) => {
                        item.sent = item.person_id == this.$store.person_id;
                        item.text = [item.message];
                        this.messages.push(item);
                    });
                    await this.$nextTick();
                    this.$refs.scroll.setScrollPosition("vertical", 9999999);
                };
                this.ws.onclose = (event) => {
                    console.log("Socket closed ", event);
                    this.ws = null;
                };
                this.ws.onopen = (event) => {
                    console.log("Socket opened ", event);
                    this.queue.forEach((msg) => {
                        this.sendMessage(msg);
                    });
                    this.queue = [];
                };

            }
        },
        
        /**
         * Reloads the chat
         */
        reload() {
            this.$q.localStorage.set(this.cv_name, this.room_id);
            this.closeSocket();
            this.checkSocket();
        },

        /**
         * Sends a message after checking the socket
         */
        checkSendMessage() {
            if (this.message.trim() == "") {
                return;
            }
            this.checkSocket();
            if (this.ws.readyState == WebSocket.OPEN) {
                this.sendMessage(this.message);
            } else {
                this.queue.push(this.message);
            }
            this.message = "";
        },

        /**
         * Sends a message
         * 
         * @param {string} message - The message to send
         */
        sendMessage(message) {
            this.ws.send(JSON.stringify({ message: message, token: this.$keycloak.token }));
        },

        /**
         * Formats a date
         * 
         * @param {Date} date - The date to format
         * @returns {string} - The formatted date
         */
        when(date) {
            return this.formatDate(this.toLocalISOString(new Date(date)));
        }
    }
}
</script>