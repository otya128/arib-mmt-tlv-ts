export class CustomEventTarget<M> {
    private events: { [K in keyof M]?: Set<(event: M[K]) => void> } = {};
    addEventListener<K extends keyof M>(type: K, callback: (event: M[K]) => void) {
        let listeners = this.events[type];
        if (listeners == null) {
            listeners = new Set();
            this.events[type] = listeners;
        }
        listeners.add(callback);
    }
    getListenerCount<K extends keyof M>(type: K): number {
        return this.events[type]?.size ?? 0;
    }
    dispatchEvent<K extends keyof M>(type: K, event: M[K]) {
        let listeners = this.events[type];
        if (listeners == null) {
            return;
        }
        listeners.forEach((x) => x(event));
    }
    removeEventListener<K extends keyof M>(type: K, callback: (event: M[K]) => void) {
        let listeners = this.events[type];
        if (listeners == null) {
            return;
        }
        listeners.delete(callback);
    }
}
