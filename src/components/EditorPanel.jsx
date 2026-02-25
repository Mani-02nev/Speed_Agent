import React from 'react';
import Editor from '@monaco-editor/react';
import TabBar from '../editor/TabBar';
import { cn } from '../utils/cn';

const EditorPanel = ({
    activeFileId,
    activeFile,
    handleEditorWillMount,
    handleEditorDidMount,
    isPreviewOpen,
    activeProject
}) => {
    return (
        <div className={cn("h-full relative transition-all duration-300", isPreviewOpen ? "w-1/2 border-r border-[#1F2430]" : "w-full")}>
            <TabBar />
            <div className="flex-1 w-full flex flex-col overflow-hidden relative p-1 h-[calc(100%-40px)]">
                <div className="flex-1 overflow-hidden relative rounded-xl border border-[#1F2430] bg-[#0F1115] flex">
                    {activeFileId ? (
                        <Editor
                            height="100%"
                            theme="speed-dark"
                            beforeMount={handleEditorWillMount}
                            onMount={handleEditorDidMount}
                            language={activeFile?.language || 'javascript'}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: '"JetBrains Mono", monospace',
                                automaticLayout: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: "on",
                                scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                                lineHeight: 22,
                            }}
                        />
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="w-20 h-20 bg-[#151821] border border-[#1F2430] rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[#00E0B8]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img src="/logo.png" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" alt="Agent K" />
                            </div>
                            <h3 className="text-[14px] font-black uppercase tracking-[0.5em] text-white">Agent K</h3>
                            <p className="text-[13px] text-[#57606A] max-w-xs leading-relaxed font-medium">System awaiting core distribution. Load module from explorer to begin architectural updates.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorPanel;
