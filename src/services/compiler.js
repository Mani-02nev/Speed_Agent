/**
 * Unified compiler / preview services
 */

export {
    getSandpackProviderOptions,
    getSandpackCustomSetup,
    getSandpackPreviewStatus,
} from './sandpackPreview';

export {
    getOnlineCompilerApiKey,
    isOnlineCompilerConfigured,
    resolveCompilerForFileName,
    isRunnableOnOnlineCompiler,
    runCodeSync,
    runProjectFile,
    formatRunResult,
    fetchCompilersList,
    getOnlineCompilerStatus,
    COMPILER_BY_EXTENSION,
    ONLINE_COMPILER_BASE,
} from './onlineCompiler';

import { getOnlineCompilerStatus } from './onlineCompiler';
import { getSandpackPreviewStatus } from './sandpackPreview';

export function getCompilerStatus() {
    const online = getOnlineCompilerStatus();
    const preview = getSandpackPreviewStatus();
    return {
        preview,
        online,
        configured: online.configured,
    };
}
