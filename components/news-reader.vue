<template>
    <q-card v-for="item in $store.news" :key="item.id">
        <q-card-section>
            <div class="text-subtitle1 text-bold">{{ item.title }}

            </div>
            <hr>

            <div v-html="replaceIcons(item.text)" class="text-body2">
            </div>
            <div v-show="item.expanded">
                <div v-html="replaceIcons(item.extended_text)" />
            </div>
            <div class="text-body3">
                <span class="text-body2" v-if="hasExtendedText(item)" style="cursor:pointer;"
                    @click="item.expanded = !item.expanded">
                    <span class="text-body2" v-if="!item.expanded">{{ $t('More...') }}
                        <q-icon class="q-pa-none" dense size="24px" name="expand_more" />
                    </span>
                    <span v-else>{{ $t('Less...') }}
                        <q-icon class="q-pa-none" dense size="24px" name="expand_less" />
                    </span>
                </span>
                <span style="float:right">
                    <span>{{ $t("Created") }} {{ formatDate(item.time_created)
                        }}</span>
                    <span v-if="item.time_modified" style="margin-left: 10px;">
                        {{ $t("Updated") }} {{ formatDate(item.time_modified) }}
                    </span>
                </span>
            </div>

        </q-card-section>
    </q-card>
</template>

<script>
/**
 * Component for displaying and reading news articles.
 *
 * @component
 * @example
 <NewsReader/>
 */
export default {
    name: "NewsReader",

    /**
     * Data properties for the NewsReader component.
     *
     * @returns {object} The initial data object.
     */
    data: function () {
        return {
            winHeight: window.innerHeight - 160 + "px",
            container: null,
            elem: null,
            scrollTop: 400
        };
    },

    /**
     * Methods for the NewsReader component.
     */
    methods: {

        /**
         * 
         */
        hasExtendedText(item) {
            return item.extended_text && item.extended_text.trim() > '';
        },

        /**
         * Reloads the news articles by making an API request.
         * Appends the new articles to the existing ones in the store.
         */
        async reload() {
            let response = await this.get(`CommonAnon/GetNews/${this.$store.news.length}/10`, null, true);
            let newNews = response;
            newNews.forEach((element) => {
                element.expanded = false;
                element.hasExtendedText = element.extended_text && element.extended_text.trim() > '';
            });
            this.$store.news = this.$store.news.concat(...newNews);
        },

        /**
         * Parses and evaluates the HTML content.
         * Can be used to handle `require` functions or other custom logic.
         *
         * @param {string} htmlContent - The HTML content to parse and evaluate.
         * @returns {string} The parsed and evaluated HTML content.
         */
        parseAndEvaluateHtml(htmlContent) {
            // Implement a function to parse and evaluate the HTML content.
            // You can use a library like `htmlparser2` or custom logic to handle `require` functions.
            // Here, we're using a simple string replacement for demonstration purposes.
            return htmlContent.replace(/\${require\('(.+?)'\)}/g, (match, path) => {
                // Resolve the asset path using the `require` function.
                return require(`@/assets/${path}`);
            });
        },
    },

    /**
     * Lifecycle hook called when the component is mounted.
     */
    mounted() {
        // if (this.$store.news.length == 0) this.reload();
        this.$store.reload = this.reload;
    },

    /**
     * Lifecycle hook called when the component is destroyed.
     */
    destroyed() {
        this.$store.reload = null;
    },
};
</script>
