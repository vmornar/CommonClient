<template>
        <q-btn dense :disable="parent.editMode == 'add' || $store.formChanged || parent.rows.length == 0" flat color="negative" icon="delete"
            @click="parent.$refs.form.deleteRow" />
        <q-btn dense :disable="$store.formChanged || parent.$refs.form.editingRowIndex == 0" flat color="primary" icon="first_page"
            @click="parent.$refs.form.moveTo(0)" />
        <q-btn dense :disable="$store.formChanged || parent.$refs.form.editingRowIndex == 0" flat color="primary" icon="chevron_left"
            @click="parent.$refs.form.moveTo(parent.$refs.form.editingRowIndex - 1)" />

        <span v-if="parent.editMode == 'add'">{{$t('New record')}}</span>
        <span v-else-if="parent.rows.length > 0">{{ parent.$refs.form.editingRowIndex + 1 }} / {{ parent.rows.length }}</span>
        <span v-else>{{$t('No records')}}</span>

        <q-btn dense :disable="$store.formChanged || parent.$refs.form.editingRowIndex >= parent.rows.length - 1" flat color="primary"
            icon="chevron_right" @click="parent.$refs.form.moveTo(parent.$refs.form.editingRowIndex + 1)" />
        <q-btn dense :disable="$store.formChanged || parent.$refs.form.editingRowIndex >= parent.rows.length - 1" flat color="primary" icon="last_page"
            @click="parent.$refs.form.moveTo(parent.rows.length - 1)" />
</template>
<script>
export default {
    name: "TableRecords",
    props: ['parent'],
}
</script>