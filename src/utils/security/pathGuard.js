import path from 'node:path';
function normalizePath(value) {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}
function withTrailingSeparator(value) {
    return value.endsWith(path.sep) ? value : `${value}${path.sep}`;
}
export function isSafeChild(base, candidate) {
    const normalizedBase = normalizePath(base);
    const normalizedCandidate = normalizePath(candidate);
    if (normalizedBase === normalizedCandidate) {
        return true;
    }
    return normalizedCandidate.startsWith(withTrailingSeparator(normalizedBase));
}
export function assertSafeChild(base, candidate) {
    if (!isSafeChild(base, candidate)) {
        throw new Error(`Path traversal detected: ${candidate}`);
    }
}
