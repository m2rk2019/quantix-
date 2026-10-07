'use server';

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { getAuthUser } from '@/lib/auth/session';
import { isAdminOrAbove } from '@/lib/auth/permissions';
import { MEGAWIDE_PROJECT_ID } from '@/lib/demo/megawide-constants';

const execFileAsync = promisify(execFile);

export interface DemoActionResult {
  ok: boolean;
  message: string;
  projectId?: string;
}

async function runDemoScript(scriptName: string): Promise<DemoActionResult> {
  const { profile } = await getAuthUser();

  if (!profile || !isAdminOrAbove(profile.role)) {
    return { ok: false, message: 'Admin access required.' };
  }

  const scriptPath = path.join(process.cwd(), 'scripts', scriptName);

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
      maxBuffer: 20 * 1024 * 1024,
    });

    const output = [stdout, stderr].filter(Boolean).join('\n').trim();
    return {
      ok: true,
      message: output || 'Completed successfully.',
      projectId: MEGAWIDE_PROJECT_ID,
    };
  } catch (error) {
    const execError = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
    };
    const output = [execError.stdout, execError.stderr]
      .filter(Boolean)
      .join('\n')
      .trim();

    return {
      ok: false,
      message: output || execError.message || 'Demo script failed.',
    };
  }
}

export async function loadDemoProjectAction(): Promise<DemoActionResult> {
  return runDemoScript('load-megawide-demo.mjs');
}

export async function resetDemoDatabaseAction(): Promise<DemoActionResult> {
  return runDemoScript('reset-demo-database.mjs');
}
