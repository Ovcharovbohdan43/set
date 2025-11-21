export const AppEvents = {
    transactionsChanged: 'transaction:changed'
};
export function emitAppEvent(name, detail) {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new CustomEvent(name, { detail }));
}
