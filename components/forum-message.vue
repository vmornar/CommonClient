<template>
    <div :style="{ marginBottom: '10px', marginLeft: ((level - 1) * 30) + 'px' }">
        <div class="text-bold"> {{ title }}</div>
        <div>
            Author: {{ author }} Created: {{ time_created }}
            <span v-if="time_created != time_modified"> Modified: {{ time_modified }}</span>

            <q-btn flat dense icon="reply" color="primary" @click="$emit('replyMessage', id)" />
            <q-btn flat dense icon="edit" color="primary" @click="$emit('editMessage', id)"
                v-if="person_id == $store.userData.id" />
            <q-btn flat dense icon="delete" color="negative" @click="$emit('deleteMessage', id)"
                v-if="person_id == $store.userData.id" />
        </div>
        <div v-html="message" />
    </div>
</template>

<script>
import { loadComponent } from '@/common/component-loader';
export default {
    name: "ForumMessage",
    components: {

    },
    props: ["id", "title", "message", "person_id", "author", "time_created", "time_modified", "level"],
    data() {
        return {
        }
    },
    mounted() {
    },
}
</script>