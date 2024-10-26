/**
 * Event bus for handling events across components
 * @module eventBus
 */
console.log('event-bus.js');
// import mitt from 'mitt';
// const eventBus = mitt();
// export default eventBus;
const eventBus = {
    events: {},
    
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    },

    emit(event, payload) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(payload));
        }
    },

    off(event, listener) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(l => l !== listener);
    }
};

export default eventBus;