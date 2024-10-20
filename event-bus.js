/**
 * Event bus for handling events across components
 * @module eventBus
 */
import mitt from 'mitt';
const eventBus = mitt();
export default eventBus;
