import { appDataDir, join } from '@tauri-apps/api/path';
import { assertSafeChild } from '@/utils/security/pathGuard';
const DIRECTORY_MAP = {
    db: 'storage',
    attachments: 'storage/attachments',
    logs: 'storage/logs',
    exports: 'storage/exports'
};
export async function resolveAppPath(alias) {
    const baseDir = await appDataDir();
    const relative = DIRECTORY_MAP[alias];
    const targetPath = await join(baseDir, relative);
    assertSafeChild(baseDir, targetPath);
    return targetPath;
}
export async function resolveAttachmentPath(filename) {
    const attachmentsDir = await resolveAppPath('attachments');
    const target = await join(attachmentsDir, filename);
    assertSafeChild(attachmentsDir, target);
    return target;
}
