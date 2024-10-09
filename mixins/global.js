/**
 * A global mixin object containing commonly used methods and data.
 */
import { getComponent } from '../component-loader.js';
//import CustomDialog from '../components/custom-dialog.vue';
import { loadComponent } from '../component-loader.js';
export const GlobalMixin = {
    computed: {
        /**
         * Checks if the user is an admin.
         * @returns {boolean} True if the user is an admin, false otherwise.
         */
        isAdmin() {
            return this.$store.userData && this.$store.userData.is_admin;
        },
    },
       
    methods: {

        /**
         * Waits for a Vue component reference to be available.
         * @param {string} ref - The name of the component reference.
         * @returns {Promise<void>} - A promise that resolves when the component reference is available.
         */
        async waitForRefs(refs) {
            for (let ref of refs) {
                while (!this.$refs[ref]) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        },

        /**
         * Validates a form.
         * 
         * @param {Object} o - The form object to validate.
         * @returns {Promise<boolean>} - A promise that resolves to true if the form is valid, false otherwise.
         */
        async validateForm(o) {
            if (await o.validate()) {
                return true;
            } else {
                await this.showError(this.$t("Please correct all errors before saving"));
                return false;
            }
        },

        /**
         * Formats the value
         *
         * @param {any} value - The value to be formatted.
         * @returns {any} The formatted value.
         */
        formatValue(value) {
            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
                let v = new Date(value);
                // if time is 00:00:00, only show date
                if (v.getHours() == 0 && v.getMinutes() == 0 && v.getSeconds() == 0) {
                    v = v.toLocaleDateString();
                } else {
                    v = v.toLocaleString();
                }
                return v;
            } else {
                return value;
            }
        },

        /**
         * Retrieves the file extension from a given filename. Keeps "."" for compatibility with Path.GetExtension.
         *
         * @param {string} filename - The name of the file.
         * @returns {string} The file extension.
         */
        getFileExtension(filename) {
            let i = filename.lastIndexOf('.');
            return (i < 0) ? '' : filename.substr(i);
        },

        /**
         * Parses a time string and returns the parsed value.
         * If the time string contains a blank, only the first part is considered.
         * @param {string} s - The time string to parse.
         * @param {boolean} toSeconds - Indicates whether to return the parsed value in seconds.
         * @returns {number|string} - The parsed time value.
         */
        parseTime(s, toSeconds) {
            // if s contains a blank, take first part
            if (s.indexOf(" ") > 0) {
                s = s.split(" ")[0];
            }
            if (toSeconds) {
                return new Date(s).getTime() / 1000;
            } else {
                return s;
            }
        },

        /**
         * Rounds a number to the specified decimal places.
         * @param {number} number - The number to round.
         * @param {number} decimalPlaces - The number of decimal places to round to.
         * @returns {number} The rounded number.
         */
        roundTo(number, decimalPlaces) {
            const factor = Math.pow(10, decimalPlaces);
            return Math.round(number * factor) / factor;
        },

        /**
         * Returns the unit text with optional unit value.
         * @param {string} unit - The unit value.
         * @returns {string} The unit text with optional unit value.
         */
        unitText(unit) {
            return unit ? ' [' + unit + ']' : ''
        },

        /**
         * Extracts the file name from a given URL.
         * 
         * @param {string} url - The URL from which to extract the file name.
         * @returns {string} The file name extracted from the URL.
         */
        fileNameFromUrl(url) {
            return url.substring(url.lastIndexOf('/') + 1);
        },

        /**
         * Displays an error dialog with the given error message.
         * @param {string} err - The error message to display.
         * @returns {Promise<void>} - A promise that resolves when the error dialog is closed.
         */
        async showError(err) {
            return new Promise((resolve, reject) => {
                this.$q.dialog({
                    component: loadComponent("custom-dialog"),//CustomDialog,
                    componentProps: {
                        title: this.$t("Error"),
                        error: true,
                        message: err,
                        persistent: true
                    }
                }).onOk(() => {
                    resolve(true);
                });
            });
        },

        /**
         * Displays a dialog with the given message.
         * @param {string} message - The message to display.
         * @returns {Promise<void>} - A promise that resolves when the error dialog is closed.
         */
        async showMessage(message) {
            return new Promise((resolve, reject) => {
                this.$q.dialog({
                    component:  loadComponent("custom-dialog"),
                    componentProps: {
                        title: this.$t("Message"),
                        message: message,                   
                        persistent: false
                    }
                }).onOk(() => {
                    resolve(true);
                });
            });
        },

        /**
         * Displays a confirmation dialog with the given message.
         * @param {string} message - The message to display in the confirmation dialog.
         * @returns {Promise<boolean>} - A promise that resolves to true if the user confirms, or false if the user cancels.
         */
        async confirmDialog(message, title, okText, cancelText) {
            return new Promise((resolve, reject) => {
                this.$q.dialog({
                    component:  loadComponent("custom-dialog"),
                    componentProps: {
                        title: title ?? this.$t("Message"),
                        message: message, cancel: true, persistent: true, cancelText: cancelText, okText: okText
                    }
                }).onOk(() => {
                    resolve(true);
                }).onCancel(() => {
                    resolve(false);
                });
            });
        },

        /**
         * Saves the storable data to local storage.
         * @param {Object} data - The data object containing storable properties.
         * @param {string} routeName - The name of the route to save the data under.
         */
        saveStorable(data, routeName) {
            if (data.storable) {
                let o = {};
                for (let key of data.storable) {
                    o[key] = data[key];
                }
                this.$q.localStorage.set(routeName, o);
            }
        },

        /**
         * Loads storable data from local storage and assigns it to the corresponding properties in the data object.
         * @param {Object} data - The data object containing the properties to be assigned.
         * @param {string} routeName - The name of the route or identifier for the storable data.
         */
        loadStorable(data, routeName) {
            let o = this.$q.localStorage.getItem(routeName);
            if (o) {
                for (let key of data.storable) {
                    if (o[key] != undefined) {
                        data[key] = o[key];
                    }
                }
            }
        },

        /**
         * Replaces placeholders in the given text with corresponding Material Icons.
         * 
         * @param {string} text - The text containing placeholders to be replaced.
         * @returns {string} The modified text with placeholders replaced by Material Icons.
         */
        replaceIcons(text) {
            if (!text) return text;
            return text.replace(/{{([-a-z_]+)}}/g, '<i class="material-icons">$1</i>');
        },

        /**
         * Cleans the given date and time string by removing the seconds and replacing the 'T' separator with a space.
         * @param {string} dateTime - The date and time string to be cleaned.
         * @returns {string} The cleaned date and time string.
         */
        cleanDateTime(dateTime) {
            return dateTime.substring(0, 16).replace("T", " ");
        },

        /**
         * Splits a given date and time into its individual components.
         *
         * @param {string} inputDateTime - The input date and time string.
         * @returns {Object} An object containing the individual components of the date and time.
         * @property {number} year - The year component of the date.
         * @property {number} month - The month component of the date (1-12).
         * @property {number} day - The day component of the date.
         * @property {number} hour - The hour component of the time.
         * @property {number} minute - The minute component of the time.
         * @property {number} second - The second component of the time.
         * @property {number} millisecond - The millisecond component of the time.
         */
        splitDateComponents(inputDateTime) {
            const date = new Date(inputDateTime);

            const year = date.getFullYear();
            const month = date.getMonth() + 1; // Month is zero-based, so add 1 to get the actual month
            const day = date.getDate();
            const hour = date.getHours();
            const minute = date.getMinutes();
            const second = date.getSeconds();
            const millisecond = date.getMilliseconds();

            return {
                year,
                month,
                day,
                hour,
                minute,
                second,
                millisecond,
            };
        },

        /**
         * Formats a date into a localized string.
         * @param {Date} date - The date to be formatted.
         * @returns {string} The formatted date string.
         */
        formatDate(date) {
            return date ? (new Date(date)).toLocaleString(this.$store.locale) : "";
        },

        /**
         * Copies properties from one object to another.
         * @param {Object} from - The source object.
         * @param {Object} to - The destination object.
         * @param {boolean} [preserve] - Whether to preserve existing properties in the destination object. Defaults to false.
         */
        copyObject(from, to, preserve) {
            if (!preserve) {
                for (let key in to) delete to[key];
            }
            for (let key of Object.keys(from)) {
                to[key] = from[key];
            }
            return;

        },

        /**
         * Deep clones an object.
         * @param {Object} obj - The object to clone.
         * @returns {Object} The cloned object.
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }

            // Handle Date objects
            if (obj instanceof Date) {
                return new Date(obj);
            }

            // Handle Array objects
            if (Array.isArray(obj)) {
                const clonedArray = [];
                obj.forEach(item => {
                    clonedArray.push(this.deepClone(item));
                });
                return clonedArray;
            }

            // Handle Object objects
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        },

        deepCopyObject(obj) {
            if (typeof obj !== 'object' || obj === null) {
                return obj; // Return primitive values as is
            }
        
            const newObj = Array.isArray(obj) ? [] : {}; // Create a new object or array
        
            // Iterate through object keys and recursively copy nested objects
            for (const key in obj) {
                newObj[key] = this.deepCopyObject(obj[key]);
            }
        
            return newObj;
        },
         
        /**
         * Checks if two objects are equal by comparing their properties.
         * @param {Object} a - The first object to compare.
         * @param {Object} b - The second object to compare.
         * @returns {boolean} - Returns true if the objects are equal, false otherwise.
         */
        equalObjects(a, b) {
            if (Object.keys(a).length == 0 || Object.keys(b).length == 0) return true;// not yet existing
            if (Object.keys(a).length != Object.keys(b).length) {
                return false;
            }
            return Object.keys(a).every(field => a[field] == b[field]);
        },

        deepEqualObjects(a, b) {
            
            if (a == null && b == null) return true;
            if (a == undefined && b == undefined) return true;
            
            if (Array.isArray(a) && Array.isArray(b)) {
                if (a.length != b.length) {
                    return false;
                }
                return a.every((value, index) => this.deepEqualObjects(value, b[index]));
            }

            // both are objects
            if (typeof a == 'object' && typeof b == 'object') {
                if (Object.keys(a).length != Object.keys(b).length) {
                    return false;
                }
                return Object.keys(a).every(key => this.deepEqualObjects(a[key], b[key]));
            }
            return a == b;       
        },

        /**
         * Copies the elements from one array to another.
         * @param {Array} from - The source array.
         * @param {Array} to - The destination array.
         */
        copyArray(from, to) {
            to.length = 0;
            let copy = from.map(e => ({ ...e }));
            to.push(...copy);
        },

        /**
         * Checks if two arrays are equal by comparing their elements.
         * @param {Array} a - The first array.
         * @param {Array} b - The second array.
         * @returns {boolean} - True if the arrays are equal, false otherwise.
         */
        equalArrays(a, b) {
            if (!a || !b) return true; // not yet existing
            if (a.length != b.length) return false;
            return a.every((value, index) => this.equalObjects(value, b[index]));
        },

        /**
         * Converts an RGBA color array to a hexadecimal color string.
         * @param {number[]} colorArray - The RGBA color array.
         * @returns {string} The hexadecimal color string.
         * @throws {Error} If the colorArray is not a valid RGBA color array.
         */
        rgbaToHex(colorArray) {
            // Ensure the colorArray has the correct length
            if (colorArray.length !== 4) {
                throw new Error('Invalid color array');
            }
            // Convert each channel value to a two-digit hexadecimal string
            var hexR = colorArray[0].toString(16).padStart(2, '0');
            var hexG = colorArray[1].toString(16).padStart(2, '0');
            var hexB = colorArray[2].toString(16).padStart(2, '0');
            var hexA = Math.round(colorArray[3] * 255).toString(16).padStart(2, '0');

            // Concatenate the hex values
            var hexColor = '#' + hexR + hexG + hexB + hexA;

            return hexColor;
        },

        /**
         * get the current position
         * @returns {Promise} - A promise that resolves to the current position.
         */
        getCurrentPosition() {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve(position);
                    },
                    (error) => {
                        let errorMessage;
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = "User denied the request for Geolocation.";
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = "Location information is unavailable.";
                                break;
                            case error.TIMEOUT:
                                errorMessage = "The request to get user location timed out.";
                                break;
                            default:
                                errorMessage = "An unknown error occurred.";
                                break;
                        }
                        this.showError(errorMessage);
                        reject({
                            coords: { latitude: null, longitude: null }
                        });
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000, // 10 seconds timeout (adjust as needed)
                        maximumAge: 0 // Do not use a cached position
                    }
                );
            });
        },

        /**
         * Converts a value to a string if it is not null or undefined.
         * 
         * @param {*} value - The value to convert to a string.
         * @returns {string} - The string representation of the value, or null if the value is null or undefined.
         */
        toStringIfNotNull(value) {
            return value != null ? value.toString() : null;
        },

        /**
         * Handles Escape and Ctrl-s event.
         * 
         * @param {Event} event - The keydown event object.
        */
        handleSaveCancelKeydown(event) {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                event.stopPropagation();
                if (this.save) this.save();
                this.$emit('save');
            } else if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                if (this.cancel) this.cancel();
                this.$emit('cancel');
            }
        },

        /**
         * Creates a ISO like date string from the given UTC date, in local timezone 
         * @param {*} date 
         * * @returns converted date string
         */
        toLocalISOString(date) {

            // Get individual components of the date
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
        },

        /**
         * Translates the selected text in the active input field.
         */
        async translate() {

            let sourceLang = "en";
            let targetLang = this.$store.contextValues.lang_id ?? this.$store.locale.substring(0, 2);

            let el = document.activeElement;
            let sel = this.getInputSelection(el);
            let val = el.value;

            let p = {
                value: val.substring(sel.start, sel.end),
                sourceLang: sourceLang,
                targetLang: targetLang,
            };

            let res = await this.get("Misc/TranslateSingle", p);
            if (res) {
                el.value = val.slice(0, sel.start) + res.text + val.slice(sel.end);
                let event = new Event('input', { bubbles: true });
                el.dispatchEvent(event);
                //send enter key
                // let event = new KeyboardEvent("keyup", { key: "Enter" });
                // el.dispatchEvent(event);
            }
        },

        /**
         * Gets the selected text in the active input field.
         * @param {Element} el - The active input element.
         * @returns {Object} - An object containing the start and end indices of the selected text.
         * @property {number} start - The start index of the selected text.
         * @property {number} end - The end index of the selected text.
         * @see https://stackoverflow.com/a/4812022
         */
        getInputSelection(el) {
            let start = 0,
                end = 0,
                normalizedValue,
                range,
                textInputRange,
                len,
                endRange;

            if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
                start = el.selectionStart;
                end = el.selectionEnd;
            } else {
                range = document.selection.createRange();

                if (range && range.parentElement() == el) {
                    len = el.value.length;
                    normalizedValue = el.value.replace(/\r\n/g, "\n");

                    // Create a working TextRange that lives only in the input
                    textInputRange = el.createTextRange();
                    textInputRange.moveToBookmark(range.getBookmark());

                    // Check if the start and end of the selection are at the very end
                    // of the input, since moveStart/moveEnd doesn't return what we want
                    // in those cases
                    endRange = el.createTextRange();
                    endRange.collapse(false);

                    if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                        start = end = len;
                    } else {
                        start = -textInputRange.moveStart("character", -len);
                        start += normalizedValue.slice(0, start).split("\n").length - 1;

                        if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                            end = len;
                        } else {
                            end = -textInputRange.moveEnd("character", -len);
                            end += normalizedValue.slice(0, end).split("\n").length - 1;
                        }
                    }
                }
            }

            return {
                start: start,
                end: end,
            };
        },

        initializeComponent() {
            if (this.asPopup) {
                this.copyObject(this.$store.popups.default.props, this, true);
            } else {
                this.copyObject(this.$store.props, this, true);
            }
        },

        copyToClipboard(text) {
            navigator.clipboard.writeText(text);
            this.$q.notify({
                message: this.$t("URL copied to clipboard"),
                color: "positive",
                timeout: 1000,
                position: "bottom"
            });
        },

        /**
         * Activates a route by adding it to the Vue Router if it doesn't exist, and then navigates to the activated route.
         *
         * @param {Object} route - The route object containing information about the route.
         */
        activateRoute(route) {
            let routerRoute = this.$router.getRoutes().find((item) => item.path == route.path);
            if (routerRoute == null) {
                //let importedComponent = () => import(`../../${route.component}.vue`);
                let importedComponent = getComponent(route.component);
                this.$router.addRoute({
                    path: route.path,
                    name: route.name,
                    component: importedComponent
                });
            }
            // because of https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md#414-2022-08-22
            try {
                this.$store.props[route.path] = { name: route.name, ...route.props };   
                let ts = new Date().toISOString();
                this.$store.level++;
                this.$router.push({ name: route.name, query: { timestamp: ts }, props: route.props });
            } catch (e) {
                this.showError(this.$t("Error activating component. Are props a valid JSON?"));
            }
        },

    }
}