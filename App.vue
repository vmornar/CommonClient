<template>
  <q-scroll-area v-if="noInterface" style="height: 100vh; max-width: 100vw;" :bar-style="{ width: '10px' }">
    <component :is="noInterfaceComponent" :props="noInterfaceProps" />
  </q-scroll-area>
  <div v-else id="q-app" style="min-height: 100vh;" class="nomy nopx nomx" @keydown.f9="translate">
    <q-layout view="hHh Lpr fFf" container style="height: 100vh" class="nomy nopx nomx">
      <q-header style="height: 40px;">
        <q-toolbar class="nopx" style="min-height:40px;">
          <q-btn flat @click="$store.drawer = !$store.drawer" dense icon="menu" />
          <q-toolbar-title class="text-subtitle1 nomy">{{ $store.appName }} {{ $store.version
            }}
          </q-toolbar-title>

          <autocomplete bg-color="primary" v-if="$store.userData && $store.userData.is_admin" v-model="$store.EU"
            style="width: 100px" clearable filled :options="$store.users" dense options-dense
            :display-value="$store.EU ? $store.EU.short_display_value : null"
            @update:model-value="emulatedUserChanged" />

          <q-btn flat dense class="nomy" v-if="!$store.isOnline" icon="wifi_off" />
          {{ $store.userData && $store.userData.first_name > '' && $store.userData.last_name > '' ?
    (this.$q.screen.width
      >= 1024 ? `${$store.userData.first_name} ${$store.userData.last_name}` :
      $store.userData.first_name.charAt(0)
      +
      $store.userData.last_name.charAt(0)) :
    $t('Guest') }}
          <q-btn v-if="$keycloak.token" class="nomy" flat @click="$logout" dense icon="logout" />
          <q-btn v-else class="nomy" flat dense icon="login" @click="$keycloak.login()">
          </q-btn>
          <accessibility />
          <lang-switcher ref="langSwitcher" />
          <q-btn class="nomy" flat @click="toggleFullscreen" dense
            :icon="(fullscreen ? 'fullscreen_exit' : 'fullscreen')" />
        </q-toolbar>
      </q-header>

      <q-drawer style="top: 40px" v-model="$store.drawer" :width="$store.drawerWidth" bordered behavior="desktop"
        :breakpoint="breakpoint" :overlay="false">
        <q-scroll-area class="fit">
          <div v-if="isAdmin" class="row">
            <q-input v-model="treeFilter" dense style="width:160px">
              <template v-slot:prepend>
                <q-icon name="search"></q-icon>
              </template>
            </q-input>
            <q-btn flat dense icon="refresh" @click="refresh" />
          </div>
          <q-tree ref="tree" class="primary text-body2" :nodes="tree" node-key="path" no-connectors :filter="treeFilter"
            :default-expand-all="treeFilter.length > 0" v-model:selected="selected" v-if="tree.length > 0"
            @update:selected="selectionUpdated">
            <template v-slot:default-header="props">
              <div>
                <span class="drop-zone" v-if="draggedItem" @drop="onDrop($event, props, 'before')" @dragover.prevent>
                </span>
                <span :draggable="$store.userData && $store.userData.is_admin" @dragstart="onDragStart($event, props)"
                  @dragend="onDragEnd" @drop="onDrop($event, props, 'on')" @dragover.prevent>
                  <q-icon v-if="props.node.icon" class="q-pr-xs" :name="props.node.icon"
                    :color="props.node.iconColor" />
                  <span v-html="props.node.label"></span>
                </span>
                <span class="drop-zone" v-if="draggedItem" @drop="onDrop($event, props, 'after')" @dragover.prevent>
                </span>
              </div>
            </template>
          </q-tree>
        </q-scroll-area>
      </q-drawer>

      <q-scroll-area style=" height: 100vh; max-width: 100vw;" :bar-style="{ width: '10px' }"
        :thumb-style="{ width: '0px' }">
        <q-page-container class="q-pt-none">
          <q-page>
            <router-view />
          </q-page>
        </q-page-container>
      </q-scroll-area>

    </q-layout>
    <popup v-if="$store.popups.default.show" name="default" @keydown.f9="translate" />
    <chart-popup v-if="$store.popups.chart.show" />
    <help-dialog @keydown.f9="translate" />
    <task-progress v-if="$store.progress.show" />
    <div v-for="popup in $store.additionalPopups" :key="popup.name">
      <popup v-if="popup.renderInApp && $store.popups[popup.name].show" :name="popup.name"
        :canCloseIfFormChanged="popup.canCloseIfFormChanged" />
    </div>
  </div>
</template>
<script lang=" js">
import { setCssVar } from 'quasar';
import { loadComponent } from '@/common/component-loader';
import { markRaw } from 'vue';

/**
* The main component of the application.
* Renders the layout and handles user interactions.
*
* @component
* @example
*
<App />
*/

export default {
  name: "App",
  components: {
    LangSwitcher: loadComponent("lang-switcher"),
    Accessibility: loadComponent("accessibility"),
    Popup: loadComponent("popup"),
    //PWAPrompt: loadComponent("PWAPrompt"),
    HelpDialog: loadComponent("help-dialog"),
    ChartPopup: loadComponent("chart-popup"),
    TaskProgress: loadComponent("task-progress"),
    Autocomplete: loadComponent("autocomplete"),
  },
  data: () => ({
    selected: null,
    fullscreen: false,
    canInstall: false,
    breakpoint: 1024,
    treeFilter: '',
    draggedItem: null,
    hoveredItem: null,
    loaded: false,
    noInterface: false,
    noInterfaceComponent: null,
    noInterfaceProps: {},
    }),
    watch: {
      treeFilter(val) {
        if (val.length > 0) {
          this.$refs.tree.expandAll();
        }
    }
  },
  computed: {
  /**
  * Filters the tree based on the provided filter text.
  * @returns {Array} The filtered tree items.
  */
    treeFiltered() {
      // Filter the tree based on the treeFilter, recusively filtering the children
      return this.tree.filter((item) => {
        if (item.label.toLowerCase().includes(this.treeFilter.toLowerCase())) return true;
        if (item.children) {
          item.children = item.children.filter((child) => {
            if (child.label.toLowerCase().includes(this.treeFilter.toLowerCase())) return true;
            return false;
          });
          return item.children.length > 0;
        }
        return false;
      });
    },
  /**
  * Retrieves the tree data.
  */
    tree() {
      let root = this.$store.routes.filter((item) => !item.parent && item.active);

      let children = root.map(route => ({
        label: this.$t(route.title),
        name: route.name,
        path: route.path,
        icon: route.icon,
        iconColor: route.iconColor ?? "primary",
        offline: route.offline,
        public: route.public,
        id: route.id,
        children: this.getChildRoutes(route.path),
      }));
      children = children.filter(c => (this.$store.isOnline || c.offline));
      return children;
    },
  },
  /**
  * The created lifecycle hook.
  * Checks if the server is online and calls the init method.
  */
  async created() {

    if (!this.$store.isOnline && !this.$store.pwa) {
      await this.showError(this.$t('The server is offline. Please try again later.'));
      return;
    }
    
    let test = await this.get("CommonAnon/Ping", null, true);
    console.log("test", test); 

    if (this.$store.noInterfaceComponent) { // can be invoked with no interface
      for (let nip of this.$store.noInterfaceParams) { // ist here a param to invoke with no iterface?
        if (this.$route.params[nip]) {
          this.noInterfaceComponent = markRaw(loadComponent(this.$store.noInterfaceComponent));
          //this.noInterfaceComponent = loadComponent(this.$store.noInterfaceComponent);
          this.noInterfaceProps[nip] = this.$route.params[nip];
          this.noInterface = true;
          break;
        }
      }
    }

    if (!this.noInterface) {
      await this.init();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.$q.dialog({
          title: this.$t('Update'),
          message: this.$t('New version available. Reload now?'),
          cancel: true,
          persistent: true
        }).onOk(() => {
          window.location.reload();
        });
      });
    }
  },

  methods: {
    /**
    * Initializes the application.
    *
    * @returns {Promise<void>} A promise that resolves when the initialization is complete.
    */
    async init() {

      setCssVar("tooltip-fontsize", "12px");
      this.$store.drawer = this.$q.screen.width >= this.breakpoint;
      this.$store.userData = this.$q.localStorage.getItem("userData");

      this.$store.localeOptions = await this.get("CommonAnon/GetLocaleOptions", null, true);
      if (this.$store.hasCatalogs) {
        this.$store.catalogs = await this.get("CommonAnon/GetCatalogs", null, true);
      }
      if (this.$store.hasNews) {
        // to avoid double loading of news
        this.$store.news = await this.get(`CommonAnon/GetNews/${this.$store.news.length}/10`, null, true);
      }

      if (this.$keycloak.authenticated) {
        let ref = "";
        if (this.$route.query.ref) {
          ref = "/" + this.$route.query.ref;
        }
        let ret = await this.get('Auth/GetUser' + ref);
        if (ret) {
          if (ret.agreement) {
            if (await this.confirmDialog(ret.agreement, this.$t('You have to accept the terms and conditions to continue:'),
            this.$t('Accept'), this.$t('Decline'))) {
              await this.post('Auth/AcceptAgreement');
              this.$store.userData = ret;
              this.$q.localStorage.set('userData', this.$store.userData);
            } else {
              this.$logout();
            }
          } else {
            this.$store.userData = ret;
            this.$q.localStorage.set('userData', this.$store.userData);
            if (this.$store.userData.is_admin) {
              this.$store.users = await this.get('Auth/GetUsers');
            }
          }
        } else {
          await this.showError("this.$t('User not found')");
          this.$logout();
        }
      }
      await this.waitForRefs(["langSwitcher"]);
      this.$refs.langSwitcher.localeChanged();
    },

    /**
    * Updates the selection with the specified ID.
    *
    * @param {number} id - The ID of the selection to update.
    * @returns {Promise<void>} - A promise that resolves when the selection is updated.
      */
    async selectionUpdated(id) {
      if (id == null) return;
      if (this.$store.formChanged) {
        if (!await this.confirmDialog(this.$t('Unsaved changes will be lost. Continue?'))) {
          this.$store.formChanged = false;
          return;
        }
        this.$store.formChanged = false;
      }
      if (this.$store.formChanged) return;
      let route = this.$store.routes.find((item) => item.path == id);
      console.log("sele", id)
      if (route.component > "") {
        this.$store.state = {};
        this.$store.level = 0;
        this.activateRoute(route);
        this.$store.drawer = this.$q.screen.width >= this.breakpoint;
      } else {
        this.$refs.tree.setExpanded(id, !this.$refs.tree.isExpanded(id));
      }
      this.selected = null;
    },

    /**
    * Retrieves the child routes for a given parent route.
    *
    * @param {string} parentName - The name of the parent route.
    * @returns {Array} - An array of child routes.
    */
    getChildRoutes(parentName) {
    // Filter and return the child routes for the given parentName
      let children = this.$store.routes.filter((route) => route.parent === parentName && route.active);

      if (children.length === 0) return [];
      return children.map(route => ({
        label: route.title,
        name: route.name,
        path: route.path,
        icon: route.icon,
        iconColor: route.iconColor ?? "primary",
        offline: route.offline,
        id: route.id,
        children: this.getChildRoutes(route.path),
      }));
    },
    /**
    * Toggles the fullscreen mode.
    */
    toggleFullscreen() {
      if (this.fullscreen) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
      this.fullscreen = !this.fullscreen;
    },

    /**
    * Reloads the current user after emulated user changed.
    */
    emulatedUserChanged() {
      this.getRoutes();
      this.activateRoute(this.$store.routes.find((item) => item.path == this.$route.path));
    },

    /**
     * Refreshes the tree.
     */
    refresh() {
      this.delete("Dev/ClearCache");
      this.getRoutes();
    },

    onDragStart(event, props) {
      //event.dataTransfer.setData('text/plain', props.node.id)
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';
      setTimeout(() => {
        this.draggedItem = props.node;
      }, 10);
    },

    onDragEnd(event) {
      this.draggedItem = null;
    },

    async onDrop(event, props, where) {
      await this.post(`Dev/ReorderMenu/${this.draggedItem.id}/${props.node.id}/${where}`);
      this.draggedItem = null;
      await this.delete("Dev/ClearCache");
      await this.getRoutes();
    },
  }
}
</script>

<style scoped>
/* .drop-zone {
  height: 0;
  opacity: 0;
  transition: all 0.2s ease;
}

.drop-zone.visible { */
.drop-zone {
  display: inline-block;
  height: 15px;
  width: 15px;
  margin: 0 5px;
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
