import { appDataDir, join } from '@tauri-apps/api/path';

import { assertSafeChild } from '@/utils/security/pathGuard';

const DIRECTORY_MAP = {
  db: 'storage',
  attachments: 'storage/attachments',
  logs: 'storage/logs',
  exports: 'storage/exports'
} as const;

export type PathAlias = keyof typeof DIRECTORY_MAP;

export async function resolveAppPath(alias: PathAlias) {
  const baseDir: string = await appDataDir();
  const relative = DIRECTORY_MAP[alias];
  const targetPath: string = await join(baseDir, relative);
  assertSafeChild(baseDir, targetPath);
  return targetPath;
}

export async function resolveAttachmentPath(filename: string) {
  const attachmentsDir = await resolveAppPath('attachments');
  const target: string = await join(attachmentsDir, filename);
  assertSafeChild(attachmentsDir, target);
  return target;
}

