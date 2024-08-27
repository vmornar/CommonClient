export const initTable = (databaseName, storeName, attributes) => {
    // Otvorite bazu podataka kako biste saznali trenutnu verziju
    const request = indexedDB.open(databaseName);

    request.onsuccess = function(event) {
        const db = event.target.result;
        const currentVersion = db.version;


        // Ako ne postoji tablica otvori s uvecanom verzijom
        if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            // Otvorite bazu podataka s povećanom verzijom
            const upgradeRequest = indexedDB.open(databaseName, currentVersion + 1);

            upgradeRequest.onupgradeneeded = function(event) {
                const upgradedDb = event.target.result;
                
                const objectStore = upgradedDb.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                // Dodajte atribute kao indekse
                for (let attribute of attributes) {
                    objectStore.createIndex(attribute.name, attribute.keyPath, { unique: attribute.unique || false });
                }
            };

            upgradeRequest.onsuccess = function(event) {
                console.log(`Object store "${storeName}" created successfully in database "${databaseName}".`);
                const upgradedDb = event.target.result;
                upgradedDb.close();
            };

            upgradeRequest.onerror = function(event) {
                console.error('Error upgrading database:', event.target.errorCode);
            };
        } else {
            db.close();
        }
    };

    request.onerror = function(event) {
        console.error('Error opening database:', event.target.errorCode);
    };
}
// export const setupOrUpgradeDatabase = (dbName, table, attributes) => {
//     const request = indexedDB.open(dbName);

//     request.onupgradeneeded = function(event) {
//         let db = event.target.result;

//         // Dinamički stvaranje objektne trgovine na temelju table
//         let objectStore;
        
//         if (!db.objectStoreNames.contains(table)) {
//             console.log('here' + table)
//             objectStore = db.createObjectStore(table, { keyPath: "id", autoIncrement: true });
//         } else {
//             objectStore = event.target.transaction.objectStore(table);
//             // Obrisati stare indekse ako je struktura promijenjena
//             objectStore.indexNames.forEach(indexName => {
//                 objectStore.deleteIndex(indexName);
//             });
//         }

//         // Kreiranje indeksa za svaki atribut
//         attributes.forEach(attr => {
//             if (attr.name !== 'id') {
//                 objectStore.createIndex(attr.name, attr.name, { unique: false });
//             }
//         });
//     };

//     request.onsuccess = function(event) {
//         console.log("Database is set up/updated successfully.");
//         db = event.target.result;
//         db.close();
//     };

//     request.onerror = function(event) {
//         console.log("Database error: " + event.target.errorCode)
//         console.error("Database error: " + event.target.errorCode);
//     };
// }

export const storeData = (dbName, table, data) => {
    const dbRequest = indexedDB.open(dbName);

    
    dbRequest.onsuccess = function(event) {
        
        let db = event.target.result;
        let transaction = db.transaction([table], "readwrite");
        let store = transaction.objectStore(table);
        
    
        console.log(data);
        data.data.forEach(row => {
            let record = {};
            row.forEach((value, index) => {
                record[data.attributes[index].name] = value; // Pretpostavlja da redoslijed u `data` odgovara redoslijedu u `attributes`
                
            });
            store.put(record);
        });

        transaction.oncomplete = function() {
            console.log("Data has been stored successfully.");
        };

        transaction.onerror = function(event) {
            console.error("Transaction error:", event.target.error);
        };
    };

    dbRequest.onerror = function(event) {
        console.error("Database error: " + event.target.errorCode);
    };
}

/**
 * Fetch data from the specified object store in IndexedDB using async/await.
 * @param {string} dbName - The name of the database.
 * @param {string} storeName - The name of the object store.
 * @param {IDBValidKey | IDBKeyRange | undefined} key - Optional key to fetch a specific record.
 * @returns {Promise<any[]>} - Implicitly returns a promise resolving to an array of records or a single record.
 */
export async function fetchData(dbName, storeName, key = undefined) {
    const dbRequest = indexedDB.open(dbName);

    try {
        const dbOpenResult = await new Promise((resolve, reject) => {
            dbRequest.onsuccess = () => resolve(dbRequest.result);
            dbRequest.onerror = () => reject(dbRequest.error);
        });

        const transaction = dbOpenResult.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const dataRequest = key !== undefined ? store.get(key) : store.getAll();

        return await new Promise((resolve, reject) => {
            dataRequest.onsuccess = //() => resolve(dataRequest.result);
            function() {
                const records = dataRequest.result;
                if (records.length > 0) {
                    // Pretpostavljamo da su svi zapisi istog formata
                    const attributes = Object.keys(records[0]).map(key => ({
                        name: key,
                        type: typeof records[0][key] === 'boolean' ? 'boolean' :
                              typeof records[0][key] === 'number' ? (Number.isInteger(records[0][key]) ? 'integer' : 'float') :
                              'character varying'
                    }));

                    const data = records.map(record =>
                        attributes.map(attr => record[attr.name])
                    );

                    resolve({ attributes, data });
                } else {
                    resolve({ attributes: [], data: [] });
                }
            };
            dataRequest.onerror = () => reject(dataRequest.error);
        });
    } catch (error) {
        console.error("Database error:", error);
        throw error; // Rethrowing the error to handle it further up in the call stack
    }
}



// export const  getData = (dbName, table, attributes, data) => {
//     const dbRequest = indexedDB.open(dbName);

    
//     dbRequest.onsuccess = function(event) {
        
//         let db = event.target.result;
//         let transaction = db.transaction([table], "readwrite");
//         let store = transaction.objectStore(table);
        
//         console.log(data);
//         data.forEach(row => {
//             let record = {};
//             row.forEach((value, index) => {
//                 record[attributes[index].name] = value; // Pretpostavlja da redoslijed u `data` odgovara redoslijedu u `attributes`
                
//             });
//             store.put(record);
//         });

//         transaction.oncomplete = function() {
//             console.log("Data has been stored successfully.");
//         };

//         transaction.onerror = function(event) {
//             console.error("Transaction error:", event.target.error);
//         };
//     };

//     dbRequest.onerror = function(event) {
//         console.error("Database error: " + event.target.errorCode);
//     };
// }

