/**
 * The main JavaScript file for the AI4SoilHealthClient application.
 * It imports necessary dependencies, sets up configurations, and initializes the Vue app.
 * It also defines utility functions for handling Axios responses and errors,
 * as well as a function for logging out the user.
 * @module main
 */
import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'
import {
  Quasar,
  LocalStorage,
  SessionStorage,
  Dialog,
  Notify
} from 'quasar'

import '@quasar/extras/material-icons/material-icons.css'

import 'quasar/src/css/index.sass'
import './style.css'
import '../specific/style.css'
import { store } from "./store.js"
import { GlobalMixin } from "./mixins/global.js"
import { GlobalApiMixin } from "./mixins/global-api.js"
import { GlobalTableMixin } from "./mixins/global-table.js"
import router from '../router.js'
import Keycloak from 'keycloak-js'; 

import { icons } from '../specific/additional-imports.js'

import { loadComponent } from './component-loader.js'
let Header = loadComponent('header');
let HelpButton = loadComponent('help-button');
let CustomDialog = loadComponent('custom-dialog');

// testing in local network:
// .env:
// VITE_ROOT_API=http://localIP:port/api
// launchsettings.json:
// "applicationUrl": "http://localhost:port"
// applicationhost.config:
// <binding protocol="http" bindingInformation="*:port:*" />
// run:
// iisexpress-proxy port to port

import { createI18n } from 'vue-i18n';

/**
 * Internationalization object for language translation.
 * @type {object}
 */
const i18n = createI18n({
  globalInjection: true,
  silentTranslationWarn: true,
  missingWarn: false,
  silentFallbackWarn: true,
  fallbackWarn: false,
  messages: {} //langI.default
});

/**
 * Logs out the user by removing the token from local storage and clearing user data.
 * If Keycloak is available, it also performs a Keycloak logout.
 */
async function logout() {
  console.log('Logging out');
  if (store.userData) {
    store.userData = null;
    app.config.globalProperties.$q.localStorage.remove("token");
    app.config.globalProperties.$q.localStorage.remove('userData');
    if (app.config.globalProperties.$keycloak)
      app.config.globalProperties.$keycloak.logout();
  }
  //if (pushHome) router.push({ name: "Home" });
}

/**
 * Handles the response from an Axios request.
 * @param {object} response - The response object from Axios.
 * @returns {object} - The modified response object.
 */
async function handleAxiosResponse(response) {
  store.working = false;
  if (response.data) {
    if (response.data.error) {
          await app.config.globalProperties.$q.dialog({component: CustomDialog,
            componentProps: {
              error: true, title: i18n.global.t("Error"),
              message: response.data.error, type: 'Ok'
            }
          });
          return { data: null };
      } else if (response.data.message) {
          await app.config.globalProperties.$q.dialog({component: CustomDialog,
            componentProps: {
              error: true, title: i18n.global.t("Message"),
              message: response.data.message, type: 'Ok',
              persistent: true
            }
          });
      }
  }
  return response;
}

async function handleAxiosError(error) {
  store.working = false;
  let reason = "";
  let expired = false;
  console.log("Error", error);
  if (error.response) {
    let response = error.response;
    reason = error.message;
    if (response.status == 401) {
      // extract www-authenticate header from response
      //let header = response.headers.get("WWW-Authenticate");
      let header = response.headers["www-authenticate"];
      if (header && header.indexOf("expired") > 0) {
        reason = i18n.global.t("Session expired - please login again");
        expired = true;
      } else {
        reason = i18n.global.t("Unauthorized");
        expired = true;
      }
    } else if (response.status == 429) {
      reason = i18n.global.t("Too many requests in a short time. Please try again a bit later.");
    } else {
      console.log("Error", response);
      // get detailed error message from response.data.errors object
      if (response.data.errors) {
        reason += '<br>' + Object.values(response.data.errors).join("<br>");
      }
    }
  } else if (error.request) {
    reason = i18n.global.t("No response from server");
    //store.isOnline = false;
    logout();
    //expired = true;
  } 

  await app.config.globalProperties.$q.dialog({
    component: CustomDialog,
    componentProps: {
      error: true, title: i18n.global.t("Error" ), message: reason, type: 'Ok'
    }
  });

  if (expired) {
    logout();
  }

  return { data: null };
}    
        
console.dir(import.meta.env);

let errors = [];
window.onerror = function (messageOrEvent, source, lineno, colno, error) {
  let s = "Error:" + messageOrEvent + "\n" + 
    "Source:" + source + " Line:" + lineno + " Col:" + colno;
  errors.push(s);
  return true;
}

/**
 * Axios instance for making HTTP requests.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_ROOT_API,
});

/**
 * Axios instance for making generic API requests.
 */
const axiosInstanceGeneric = axios.create({
  baseURL: "" //import.meta.env.VITE_STAC_API
});

axiosInstance.interceptors.response.use(
  (response) => handleAxiosResponse(response),
  (error) => handleAxiosError(error)
);

axiosInstance.interceptors.request.use(
  (config) => {
    if (app.config.globalProperties.$keycloak && app.config.globalProperties.$keycloak.token) {
      //console.log('Adding token to request', app.config.globalProperties.$keycloak.token);
      config.headers['Authorization'] = 'Bearer ' + app.config.globalProperties.$keycloak.token;
    }
    config.headers['LangId'] = store.langId;
    if (store.EU) config.headers['EU'] = store.EU.value;
    return config;
  },
  (error) => handleAxiosError(error)
);

axiosInstanceGeneric.interceptors.response.use(
  (response) => handleAxiosResponse(response),
  (error) => handleAxiosError(error)
);
    
const app = createApp(App);

app.config.globalProperties.axios = {
  API: axiosInstance,
  APIGen: axiosInstanceGeneric
};

let authenticated = false;

app.config.errorHandler = function (err, vm, info) {
  console.error(`Error: ${err.toString()}\nInfo: ${info}`)
  if (err.stack) {
    const stack = err.stack.split('\n')[1].trim()
    const [moduleName, lineNo, colNo] = stack.match(/at\s+(.+):(\d+):(\d+)/).slice(1)
    let s = "Error:" + err.message + "\n" + 
    "Source:" + moduleName + " Line:" + lineNo + " Col:" + colNo;
    console.error(`Module: ${moduleName}, Line: ${lineNo}, Column: ${colNo}`)
    errors.push(s);
  }
}
app.config.globalProperties.$icons = icons;
app.config.globalProperties.$logout = logout;
app.config.globalProperties.$errors = errors;
app.config.globalProperties.$store = store; 
//app.config.globalProperties.$store.version = GlobalMixin.methods.cleanDateTime(import.meta.env.VITE_BUILD);
import packageJson from '../../package.json';
app.config.globalProperties.$store.version = packageJson.version; //import.meta.env.VITE_BUILD;

app.mixin(GlobalMixin);
app.mixin(GlobalApiMixin);
app.mixin(GlobalTableMixin);

router.app = app;
app.use(router);

app.use(Quasar, {
  plugins: {
    LocalStorage,
    SessionStorage,
    Dialog,
    Notify
  }, 
  lang: {}, 
  config: store.config, 
})

// Tell app to use the I18n instance
app.use(i18n);
app.component('Header', Header);
app.component('HelpButton', HelpButton);
app.component('CustomDialog', CustomDialog);

store.app = app;
store.q = app.config.globalProperties.$q;

function checkOnlineStatusSync() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', import.meta.env.VITE_ROOT_API + 'CommonAnon/Ping', false); // false za synchronous
  try {
    xhr.send();
    console.log('Checking online status', xhr.status);
    return xhr.status >= 200 && xhr.status < 300;
  } catch (error) {
    console.log('Checking online status', error);
    return false;
  }
}

if(navigator.onLine){
  store.isOnline = checkOnlineStatusSync();
}

console.log(`Main: navigator.onLine: ${navigator.onLine}`);
console.log(`Main: store.isOnline: ${store.isOnline}`);

let keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL, 
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENTID
});

function saveTokens() {
  app.config.globalProperties.$q.localStorage.setItem('accessToken', keycloak.token);
  // localStorage.setItem('user-token', keycloak.token);
  app.config.globalProperties.$q.localStorage.setItem('refreshToken', keycloak.refreshToken);
  app.config.globalProperties.$q.localStorage.setItem('tokenExpiry', Date.now() + keycloak.tokenParsed.exp * 1000);
}

function getStoredTokens() {
  return {
    accessToken: app.config.globalProperties.$q.localStorage.getItem('accessToken'),
    // accessToken: localStorage.getItem('user-token'),
    refreshToken: app.config.globalProperties.$q.localStorage.getItem('refreshToken'),
    tokenExpiry: app.config.globalProperties.$q.localStorage.getItem('tokenExpiry')
  };
}

function startTokenRefresh() {
  setInterval(() => {
    if (navigator.onLine) {
      keycloak.updateToken(60).then(refreshed => {
        if (refreshed) {
          saveTokens();
          console.log('Token refreshed');
        }
      }).catch(() => {
        console.log('Failed to refresh token, logging in');
        // keycloak.login();
      });
    }
  }, 60000);
}

let isKeycloakInitialized = false;
let isAppInitialized = false;

function initKeycloak() {

  const tokens = getStoredTokens();
  
  if(store.isOnline){
      if (tokens.accessToken && Date.now() < tokens.tokenExpiry) {
        keycloak.init({
          onLoad: 'check-sso',
          // onLoad: store.isOnline ? 'check-sso' : undefined,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          enableLogging: true,
          checkLoginIframe: true
          // checkLoginIframe: store.isOnline
        }).then(auth => {
          isKeycloakInitialized = true;
          if (auth) {
            console.log('Authenticated with stored token');
            saveTokens();
          } else {
            console.log('Not authenticated');
            logout();
          }
          // Token refresh
          startTokenRefresh();
        }).catch(error => {
          console.error('Failed to initialize Keycloak', error);
          // keycloak.login();
        }).finally(() => {  
            app.config.globalProperties.$keycloak = keycloak;
            if(!isAppInitialized){
              app.mount("#app");
              isAppInitialized = true;
            }
        });
      } else {
        keycloak.init({
          // onLoad: 'check-sso',
          onLoad: store.isOnline ? 'check-sso' : undefined,
          enableLogging: true,
          // checkLoginIframe: true
          checkLoginIframe: store.isOnline
        }).then(auth => {
          isKeycloakInitialized = true;
          if (auth) {
            saveTokens();
            startTokenRefresh();
          } else {
            console.log('Not authenticated');
            logout();
          }
        }).catch(error => {
          console.error('Failed to initialize Keycloak', error);
        }).finally(() => {  
          app.config.globalProperties.$keycloak = keycloak;
          if(!isAppInitialized){
            app.mount("#app");
            isAppInitialized = true;
          }
      });
      }
  } else {
    // Handle offline mode
    console.log('Offline, skipping Keycloak initialization');
    // if(pp.config.globalProperties.$q.localStorage.get('userData')){
      app.config.globalProperties.$keycloak = keycloak;
      if(!isAppInitialized){
        app.mount("#app");
        isAppInitialized = true;
      }
    // }
  } 
}

console.log("main isOnline: " + store.isOnline);
initKeycloak();

// forced software updates check
function checkForSWUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.update();
      }
    });
  }
}
setInterval(checkForSWUpdates, 60000); // check every 1min
//

window.addEventListener('online', () => {
  store.isOnline = true;
  console.log(`Main: online ${navigator.onLine}`);
  // if(!isKeycloakInitialized){
    initKeycloak();
  // }
  // initKeycloak(store.isOnline);
});

window.addEventListener('offline', () => {
  console.log(`Main: offline ${navigator.onLine}`);
  store.isOnline = false;
  // initKeycloak(store.isOnline);
});

//frame-src 'self'; frame-ancestors 'self' http://localhost:8080 http://161.53.18.28:8080 https://app.ai4soilhealth.eu; object-src 'none';