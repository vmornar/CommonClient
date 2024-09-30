/**
 * @desc A global mixin object containing common API calls
 * @module GlobalApiMixin
 */
import { initTable, storeData, fetchData } from './indexed-db';
export const GlobalApiMixin = {
    methods: {

         /**
         * Makes an API request using Axios.
         * @param {AxiosInstance} axios - The Axios instance to use for the request.
         * @param {string} url - The URL to make the request to.
         * @param {object} options - The options to pass to the Axios request.
         * @param {boolean} cache - Indicates whether to cache the response.
         * @returns {Promise<any>} - A promise that resolves to the response data.
         */
        async api(axios, url, options, cache) {
            this.$store.working = true;
            let data = await this.apiCache(axios, url, options, cache);
            this.$store.working = false;
            return data;
        },
        async apiCache(axios, url, options, cache){
            let data;

             // Parsiranje URL-a da se dobije ime tablice i ključ            
            let path = url.split('/');
          
            if (!this.$store.isOnline && cache && this.$store.pwa) {
                // if(path[0] == 'User' && path[1] == 'GetCustomGeometryProps'){
                    
                // } else 
                if(path[0] == 'Table') {
                    //GetTable processing
                    //params.dbFunction -> "tablica"/stora
                    // if (path[1] != 'GetTable')?
                    // let table = path[1]; // Pretpostavljamo strukturu URL-a Table/[tablename])
                    let table = ''
                    if(path[1] == 'GetTable'){
                        table = options.params.dbFunction.replace(/\./g, '_');
                    } else {
                        table = path[1]; // Pretpostavljamo strukturu URL-a Table/[tablename])
                    }

                    if(axios == this.axios.API.get){
                        data = await fetchData('ai4soilhealth', table);
                    } else if(axios == this.axios.API.post){
                        console.log('post');
                    } else if(axios == this.axios.API.put){
                        console.log('put');
                    } else if(axios == this.axios.API.delete){
                        console.log('delete');
                    }
                } else {
                    data = this.$q.localStorage.getItem(url);
                }
            } else {
                let ret = await axios(url, options);
                data = ret.data;
                if (cache) {
                    if(path[0] != 'Table'){
                        this.$q.localStorage.set(url, data);
                    } else {
                        let table = ''
                        if(path[1] == 'GetTable'){
                            table = options.params.dbFunction.replace(/\./g, '_');
                        } else {
                            table = path[1]; // Pretpostavljamo strukturu URL-a Table/[tablename])
                        }
                        initTable('ai4soilhealth', table, data.attributes);
                        if(axios == this.axios.API.get){

                            storeData('ai4soilhealth', table, data)
                            console.log('get');
                        }
                    }
                }
            }
            return data;
        },

        /**
         * Fetches data from an API and stores it in the store if it is not already present.
         * @param {string} name - The name of the store property to store the data.
         * @param {object} axios - The Axios instance used for making API requests.
         * @param {string} url - The URL of the API endpoint.
         * @param {object} options - The options object to be passed to the Axios request.
         * @param {boolean} cache - Indicates whether the response should be cached.
         * @returns {Promise<void>} - A Promise that resolves when the API request is complete.
         */
        async apiArray(name, axios, url, options, cache) {
            if (this.$store[name].length == 0) {
                let r = await this.api(axios, url, options, cache);
                this.$store[name].push(...r); // to keep references to orig array
            }
        },

        /**
         * Fetches data from an API and stores it in the store if it doesn't already exist.
         * @param {string} name - The name of the store property to store the fetched data.
         * @param {object} axios - The Axios instance used for making API requests.
         * @param {string} url - The URL of the API endpoint.
         * @param {string} key - The key to use for mapping the fetched data to an object.
         * @param {string} value - The value to use for mapping the fetched data to an object.
         * @param {object} options - Additional options for the API request.
         * @param {boolean} cache - Indicates whether to cache the fetched data.
         * @returns {Promise<void>} - A Promise that resolves when the API request is complete.
         */
        async apiDict(name, axios, url, key, value, options, cache) {
            if (Object.keys(this.$store[name]).length == 0) {
                let r = await this.api(axios, url, options, cache);
                let o = this.arrayToObject(r, key, value);
                this.copyObject(o, this.$store[name]);
            }
        },
        /**
         * Fetches data from an API and populates multiple dictionaries in the store.
         * @param {Array} names - The names of the dictionaries to populate.
         * @param {Object} axios - The Axios instance for making API requests.
         * @param {string} url - The URL of the API endpoint.
         * @param {string} key - The key to use for mapping objects in the response to the dictionaries.
         * @param {string} value - The value to use for mapping objects in the response to the dictionaries.
         * @param {Object} options - Additional options for the API request.
         * @param {boolean} cache - Indicates whether to cache the API response.
         * @returns {Promise<void>} - A promise that resolves when the dictionaries are populated.
         */
        async apiDictMulti(names, axios, url, key, value, options, cache) {
            if (Object.keys(this.$store[names[0]]).length > 0) return;
            let r = await this.api(axios, url, options, cache);
            if (r) {
                for (let name of names) {
                    let o = this.arrayToObject(r[name], key, value);
                    this.copyObject(o, this.$store[name]);
                }
            }
        },
        /**
         * Calls the API using the provided axios instance, URL, options, and cache.
         * Updates the specified store properties with the response data.
         * @param {string[]} names - The names of the store properties to update.
         * @param {object} axios - The axios instance to use for the API call.
         * @param {string} url - The URL to make the API call to.
         * @param {object} options - The options to pass to the API call.
         * @param {boolean} cache - Indicates whether to cache the API response.
         * @returns {Promise<void>} - A promise that resolves when the API call is complete.
         */
        async apiMultiForce(names, axios, url, options, cache) {
            let r = await this.api(axios, url, options, cache);
            if (r) {
                for (let name of names) {
                    if (r[name]) {
                        if (Array.isArray(this.$store[name])) {
                            this.$store[name].length = 0;
                            this.$store[name].push(...r[name]);
                        } else {
                            if (r[name].length > 0) {
                                this.copyObject(r[name][0], this.$store[name]);
                            }
                        }
                    }
                }
            }
        },
        /**
         * Fetches data from an API and updates an array in the store.
         * @param {string} name - The name of the array in the store.
         * @param {object} axios - The Axios instance used for making API requests.
         * @param {string} url - The URL of the API endpoint.
         * @param {object} options - The options object for the API request.
         * @param {boolean} cache - Indicates whether the response should be cached.
         * @returns {Promise<void>} - A promise that resolves when the API request is complete.
         */
        async apiArrayForce(name, axios, url, options, cache) {
            let r = await this.api(axios, url, options, cache);
            if (r) {
                this.$store[name].length = 0;
                this.$store[name].push(...r);
            }
        },
        /**
         * Fetches the API object from the store if it is not already available.
         * @param {string} name - The name of the API object.
         * @param {object} axios - The Axios instance for making HTTP requests.
         * @param {string} url - The URL for fetching the API object.
         * @param {object} options - The options for the API request.
         * @param {boolean} cache - Indicates whether to cache the API response.
         * @returns {Promise<void>} - A Promise that resolves when the API object is fetched.
         */
        async apiObject(name, axios, url, options, cache) {
            if (Object.keys(this.$store[name]).length == 0) await this.apiObjectForce(name, axios, url, options, cache);
        },
        /**
         * Updates the specified object in the store with the response from an API call.
         * @param {string} name - The name of the object in the store.
         * @param {object} axios - The axios instance used for the API call.
         * @param {string} url - The URL for the API call.
         * @param {object} options - The options for the API call.
         * @param {boolean} cache - Indicates whether to cache the API response.
         * @returns {Promise<void>} - A promise that resolves when the API call is complete.
         */
        async apiObjectForce(name, axios, url, options, cache) {
            let r = await this.api(axios, url, options, cache);
            if (r) {
                for (let key of Object.keys(r)) {
                    this.$set(this.$store[name], key, r[key]);
                }
            }
        },
        /**
         * Executes an API request using the provided axios instance.
         * @param {Object} axios - The axios instance to use for the API request.
         * @param {string} url - The URL of the API endpoint.
         * @param {Object} options - The options for the API request.
         * @param {boolean} cache - Indicates whether to cache the API response.
         * @returns {Promise} - A promise that resolves to the API response.
         */
        async apiExec(axios, url, options, cache) {
            return await this.api(axios, url, options, cache);
        },
        /**
         * Makes a GET request to the specified URL.
         * @param {string} url - The URL to make the GET request to.
         * @param {object} options - The options to be passed as query parameters.
         * @param {boolean} cache - Indicates whether the response should be cached.
         * @returns {Promise} - A promise that resolves to the response data.
         */
        async get(url, options, cache) {
            if (options) {
                return await this.api(this.axios.API.get, url, { params: options }, cache);
            } else {
                return await this.api(this.axios.API.get, url, null, cache);
            }   
        },
        /**
         * Sends a POST request to the specified URL.
         * @param {string} url - The URL to send the request to.
         * @param {object} options - The options for the request.
         * @param {boolean} cache - Indicates whether to cache the response.
         * @returns {Promise} - A promise that resolves with the response data.
         */
        async post(url, options, cache) {
            return await this.api(this.axios.API.post, url, options, cache);
        },
                /**
         * Sends a PUT request to the specified URL.
         * @param {string} url - The URL to send the request to.
         * @param {object} options - The options for the request.
         * @returns {Promise} - A promise that resolves with the response data.
         */
        async put(url, options, cache) {
            return await this.api(this.axios.API.put, url, options);
        },
        /**
         * Sends a DELETE request to the specified URL.
         * @param {string} url - The URL to send the request to.
         * @param {object} options - The options for the request.
         * @returns {Promise} - A promise that resolves with the response data.
         */
        async delete(url, options) {
            return await this.api(this.axios.API.delete, url, options);
        },

        /**
         * Retrieves an image from the specified URL.
         * @param {string} url - The URL of the image to retrieve.
         * @returns {Promise<string|null>} A Promise that resolves to the URL of the retrieved image, or null if the retrieval fails.
         */
        async getImage(url) {
            this.$store.working = true;
            let response = await this.axios.API.get(url, { responseType: 'blob' });
            if (response) {            
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                let o = URL.createObjectURL(blob);
                this.$store.working = false;
                return o;               
            }
            this.$store.working = false;
            return null;
        },

        /**
         * Checks if the response is OK.
         * @param {Object} response - The response object.
         * @returns {boolean} - Returns true if the response is OK, otherwise false.
         */
        responseOk(response) {
            return response?.error == undefined;
        },
        
        async getRoutes() {
            this.$store.routes = await this.get("Auth/GetRoutes", null, true);
        },

        async getIcons() {
            if (this.$store.icons.length == 0) this.$store.icons = await this.get("CommonUser/GetIcons");
        },

        // async uploadFiles(fileList, url, params) {
        //     let formData = new FormData();
        //     for (let i = 0; i < fileList.length; i++) {
        //         let file = fileList[i];
        //         formData.append("files", file, file.name);
        //     }
        //     formData.append("params", JSON.stringify(params));
        //     return await this.post(url, formData);
        // }
    }
}