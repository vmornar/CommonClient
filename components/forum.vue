<template>
    <div>
        <Header title="Forum" />
        <div class="row q-pa-sm">
            <autocomplete v-model="forum_topic_id" label="Topic" dense :options="$store.catalogs.forum_topics"
                @update:model-value="reload" :style="{ width: '300px' }" map-options emit-value :clearable="false" />
            <q-btn @click="reload" label="Reload" no-caps flat dense icon="refresh" />
            <q-btn @click="addMessage" label="New post" no-caps flat dense icon="add" />
        </div>
        <q-card flat>
            <q-card-section class="q-pa-none">
                <q-scroll-area ref="scroll" :style="{ height: ($q.screen.height - 75 - 65 - 10) + 'px', width: '100%' }">
                    <div>
                        <forum-message v-for="msg in messages" :key="msg.id" :id="msg.id" :title="msg.title"
                            :message="msg.message" :person_id="msg.person_id" :author="msg.author"
                            :time_created="formatDate(toLocalISOString(new Date(msg.time_created)))" class="q-px-md"
                            :time_modified="formatDate(toLocalISOString(new Date(msg.time_created)))" :level="msg.level"
                            @editMessage="editMessage" @replyMessage="replyMessage" @deleteMessage="deleteMessage" />
                    </div>
                </q-scroll-area>
            </q-card-section>
        </q-card>
        <q-dialog v-model="inEdit" persistent>
            <q-card>
                <q-card-section>
                    <q-input v-model="msg.title" label="Title" dense />
                </q-card-section>
                <q-card-section>
                    <html-editor v-model="msg.message" label="Message" dense showEmojiPicker />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn @click="saveMessage" label="Save" color="positive" no-caps flat dense icon="save" />
                    <q-btn @click="cancelMessage" label="Cancel" color="negative" no-caps flat dense icon="cancel" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>
<script>
/**
 * Forum component
 * 
 * @component
 * @name Forum
 * @example
 * <Forum />
 */
import { loadComponent } from '@/common/component-loader';
export default {
    name: "Forum",
    components: {
        Autocomplete: loadComponent("autocomplete"),
        ForumMessage: loadComponent("forum-message"),
        HtmlEditor: loadComponent("html-editor"),
    },
    data() {
        return {
            messages: [],
            forum_topic_id: null,
            inEdit: false,
            editMode: "",
            msg: null,
            saved: {}
        }
    },
    /**
     * Mounted lifecycle method - initializes the component
     */
    mounted() {
        if (this.$q.localStorage.has("context_value_forum_topic_id")) {
            this.forum_topic_id = this.$q.localStorage.getItem("context_forum_topic_id");
        } else {
            this.forum_topic_id = this.$store.catalogs.forum_topics[0].value;
        }
        this.reload();
    },
    methods: {

        /**
         * Reloads the forum messages
         */
        async reload() {
            this.messages = await this.get("Forum/GetForum/" + this.forum_topic_id);
            this.$refs.scroll.setScrollPosition("vertical", 9999999);
        },
        /**
         * Adds a new message
         */
        addMessage() {
            this.editMode = "add";
            this.msg = {};
            this.inEdit = true;
            this.response_forum_id = null;
        },

        /**
         * Edits a message
         * 
         * @param {number} id The id of the message to edit
         */
        editMessage(id) {
            this.editMode = "edit";
            this.msg = this.messages.find(m => m.id == id);
            this.inEdit = true;
            this.copyObject(this.msg, this.saved);
        },

        /**
         * replies to a message
         * @param id 
         */
        replyMessage(id) {
            this.editMode = "add";
            let oldMsg = this.messages.find(m => m.id == id);
            this.msg = {};
            this.msg.title = "Re: " + oldMsg.title;
            this.msg.response_forum_id = id;
            this.inEdit = true;
        },

        /**
         * Deletes a message
         * 
         * @param {number} id The id of the message to delete
         */
        deleteMessage(id) {
            this.post("Forum/DeleteForum", { id: id });
            this.reload();
        },

        /**
         * Saves a current message
         */
        async saveMessage() {
            if (this.editMode == "add") {
                let ret = await this.post("Forum/AddForum", { title: this.msg.title, message: this.msg.message, forum_topic_id: this.forum_topic_id, response_forum_id: this.msg.response_forum_id });
                this.reload();
            } else {
                this.post("Forum/UpdateForum", {
                    id: this.msg.id, title: this.msg.title, message: this.msg.message
                });
            }
            this.inEdit = false;

        },

        /**
         * Cancels the edit operation
         */
        cancelMessage() {
            this.copyObject(this.saved, this.msg);
            this.inEdit = false;
        }

    }
}
</script>