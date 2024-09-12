<template>
    <div class="max-width" @keydown="handleSaveCancelKeydown">

        {{ showEmojiPicker }}
        <div v-if="label">{{ label }}</div>
        <div class="row" v-if="showEmojiPicker || showIconPicker || vars.length > 0">
            <!-- <div class="col-4">
                <EmojiPicker v-if="showEmojiPicker" native :hide-search="false" label="Emoji" @select="insertEmoji" />
                <span v-else>&nbsp;</span>
            </div> -->
            <div class="col-4">
                <icon-picker v-if="showIconPicker" label="Icon" @update:model-value="insertIcon" />
                <span v-else>&nbsp;</span>
            </div>
            <div class="col-4">
                <autocomplete v-if="vars.length > 0" label="Variable" outlined popup-content-class="text-subtitle2"
                    :options="vars" dense options-dense clearable searchable map-options emit-value
                    @update:model-value="insertVar">
                </autocomplete>
            </div>
        </div>

        <q-editor v-model="value" ref="editor" dense :toolbar="rich ? richToolbar : leanToolbar"
            :definitions="definitions" :fonts="fonts" :min-height="minHeight">
            <template v-slot:image_btn>
                <q-btn flat dense icon="image" @click="showImagePicker">
                    <q-tooltip>Insert image</q-tooltip>
                </q-btn>
            </template>
            <template v-slot:close_btn>
                <q-btn flat dense icon="close" @click="$emit('cancel')">
                    <q-tooltip>Close</q-tooltip>
                </q-btn>
            </template>
        </q-editor>

        <q-dialog v-model="imagePicker">
            <q-card>
                <q-card-section>Insert image</q-card-section>
                <q-card-section>
                    <q-input label="Image URL" v-model="imageURL" style="width:400px" />
                    <q-input label="Width" v-model="imageWidth" />
                    <q-input label="Height" v-model="imageHeight" />
                </q-card-section>
                <q-card-section align="center">
                    <div>
                        <img :src="imageURL" :width="imageWidth" :height="imageHeight" />
                    </div>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn label="Insert" flat color="positive" @click="insertImage" />
                    <q-btn label="Cancel" flat color="negative" @click="imagePicker = false" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>
<script>
/**
 * Represents the HTML editor component.
 * 
 * @component
 * @name HtmlEditor
 * @example
 * <HtmlEditor />
 */
import { loadComponent } from '../component-loader';
export default {
    name: "HtmlEditor",
    components: {
        iconPicker: loadComponent("icon-picker"),
        autocomplete: loadComponent("autocomplete"),
    },
    props: {
        showEmojiPicker: {
            type: Boolean,
            default: false
        },
        showIconPicker: {
            type: Boolean,
            default: false
        },
        height: {
            type: String,
            default: "50vh"
        },
        modelValue: {
            type: String,
            default: ""
        },
        rich: {
            type: Boolean,
            default: true,
        },
        vars: {
            type: Array,
            default: [],
        },
        saveCancel: {
            type: Boolean,
            default: false
        },
        close: {
            type: Boolean,
            default: false
        },
        minHeight: {
            type: String,
            default: "50vh"
        },
        label: {
            type: String,
            default: null
        }
    },
    emits: ["update:modelValue", "cancel", "save"],
    computed: {
        value: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        }
    },
    data: function () {
        return {
            imagePicker: false,
            imageURL: "",
            imageWidth: "",
            imageHeight: "",
            definitions: {
                save: {
                    tip: 'Save your work',
                    icon: 'save',
                    label: 'Save',
                    handler: () => {
                        this.$emit('save', this.value);
                    }
                },
                cancel: {
                    tip: 'Cancel',
                    icon: 'cancel',
                    label: 'Cancel',
                    handler: () => {
                        this.$emit('cancel');
                    }
                }
            },
            richToolbar: [
                [
                    {
                        label: this.$q.lang.editor.align,
                        icon: this.$q.iconSet.editor.align,
                        fixedLabel: true,
                        options: ['left', 'center', 'right', 'justify']
                    }
                ],
                ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
                ['token', 'hr', 'link', 'image_btn'],
                ['print', 'fullscreen'],
                [
                    {
                        label: this.$q.lang.editor.formatting,
                        icon: this.$q.iconSet.editor.formatting,
                        list: 'no-icons',
                        options: [
                            'p',
                            'h1',
                            'h2',
                            'h3',
                            'h4',
                            'h5',
                            'h6',
                            'code'
                        ]
                    },
                    {
                        label: this.$q.lang.editor.fontSize,
                        icon: this.$q.iconSet.editor.fontSize,
                        fixedLabel: true,
                        fixedIcon: true,
                        list: 'no-icons',
                        options: [
                            'size-1',
                            'size-2',
                            'size-3',
                            'size-4',
                            'size-5',
                            'size-6',
                            'size-7'
                        ]
                    },
                    {
                        label: this.$q.lang.editor.defaultFont,
                        icon: this.$q.iconSet.editor.font,
                        fixedIcon: true,
                        list: 'no-icons',
                        options: [
                            'default_font',
                            'arial',
                            'arial_black',
                            'comic_sans',
                            'courier_new',
                            'impact',
                            'lucida_grande',
                            'times_new_roman',
                            'verdana'
                        ]
                    },
                    'removeFormat'
                ],
                ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

                ['undo', 'redo'],
                ['viewsource']
            ],

            leanToolbar: [
                ["bold", "italic", "underline"],
                ["link"],
                ["ordered_list", "unordered_list"],
                ["quote"],
                ["code"],
                ["undo", "redo"]
            ],

            fonts: {
                arial: 'Arial',
                arial_black: 'Arial Black',
                comic_sans: 'Comic Sans MS',
                courier_new: 'Courier New',
                impact: 'Impact',
                lucida_grande: 'Lucida Grande',
                times_new_roman: 'Times New Roman',
                verdana: 'Verdana'
            }
        }
    },
    /**
     * Initializes the component.
     */
    mounted() {

        if (this.saveCancel) {
            this.richToolbar.push(['save', 'cancel']);
            this.leanToolbar.push(['save', 'cancel']);
        }

        if (this.close) {
            this.richToolbar.push(['close_btn']);
            this.leanToolbar.push(['close_btn']);
        }

        this.$refs.editor.$el.addEventListener('paste', (event) => {
            const items = (event.clipboardData || window.clipboardData).items;
            for (const item of items) {
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    event.preventDefault();
                    this.showError(this.$t("Pasting images is not allowed."));
                    break;
                }
            }
        });
    },

    methods: {
        /**
         * Inserts a variable into the editor, at cursor position.
         * 
         * @param {any} value - The value of the variable to be inserted.
         */
        insertVar(value) {
            this.$refs.editor.runCmd('insertHTML', value);
            this.$refs.editor.focus();
        },

        /**
         * Inserts an emoji into the editor, at cursor position.
         * 
         * @param {any} value - The value of the emoji to be inserted.
         */
        insertEmoji(value) {
            this.$refs.editor.runCmd('insertHTML', value.i);
            this.$refs.editor.focus();
        },

        /**
         * Inserts an icon into the editor, at cursor position.
         * 
         * @param {any} value - The value of the icon to be inserted.
         */
        insertIcon(value) {
            this.$refs.editor.runCmd('insertHTML', "<i class='material-icons'>" + value + "</i>");
            this.$refs.editor.focus();
        },

        /**
         * Gets the attributes of the selected image.
         * @returns {Object} The attributes of the selected image.
         */
        getSelectedImageAttributes() {
            let selection = window.getSelection();
            if (selection.rangeCount > 0) {
                let baseNode = selection.anchorNode;
                let imgNode = this.findImageNode(baseNode);
                if (imgNode) {
                    return {
                        src: imgNode.src,
                        width: imgNode.width,
                        height: imgNode.height
                    };
                }
            }
            return null;
        },

        /**
         * Finds an image node in the DOM tree.
         * 
         * @param {Node} node - The node to be searched.
         * @returns {Node} The image node, if found, null otherwise.
         */
        findImageNode(node) {
            if (!node) return null;
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'img') {
                return node;
            }
            if (node.childNodes && node.childNodes.length > 0) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    let childResult = this.findImageNode(node.childNodes[i]);
                    if (childResult) {
                        return childResult;
                    }
                }
            }
        },

        /**
         * Shows the image picker dialog.
         */
        showImagePicker() {
            let a = this.getSelectedImageAttributes();
            if (a) {
                this.imageURL = a.src;
                this.imageWidth = a.width;
                this.imageHeight = a.height;
            }
            this.imagePicker = true;
        },

        /**
         * Inserts an image into the editor, at cursor position.
         */
        async insertImage() {
            let url = `<img src="${this.imageURL.trim()}"`;
            if (this.imageWidth > "") {
                url += ` width="${this.imageWidth}"`;
            }
            if (this.imageHeight > "") {
                url += ` height="${this.imageHeight}"`;
            }
            url += " />";
            this.imagePicker = false;
            await this.$nextTick();
            this.$refs.editor.caret.restore();
            this.$refs.editor.runCmd('insertHTML', url);
            this.$refs.editor.focus();
        }
    }
};
</script>