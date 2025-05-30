import {showMessage} from "../dialog/message";
import {getAllModels} from "../layout/getAll";
import {hasClosestByClassName, hasTopClosestByTag} from "../protyle/util/hasClosest";
import {getDockByType} from "../layout/tabUtil";
/// #if !MOBILE
import {Files} from "../layout/dock/Files";
import {openFileById} from "../editor/util";
/// #endif
import {fetchPost} from "./fetch";
import {getDisplayName, getOpenNotebookCount, pathPosix} from "./pathName";
import {Constants} from "../constants";
import {replaceFileName, validateName} from "../editor/rename";
import {hideElements} from "../protyle/ui/hideElements";
import {openMobileFileById} from "../mobile/editor";
import {App} from "../index";

export const getNewFilePath = (useSavePath: boolean) => {
    let notebookId = "";
    let currentPath = "";
    /// #if !MOBILE
    getAllModels().editor.find((item) => {
        const currentElement = item.parent.headElement;
        if (currentElement.classList.contains("item--focus")) {
            notebookId = item.editor.protyle.notebookId;
            if (useSavePath) {
                currentPath = item.editor.protyle.path;
            } else {
                currentPath = pathPosix().dirname(item.editor.protyle.path);
            }
            if (hasClosestByClassName(currentElement, "layout__wnd--active")) {
                return true;
            }
        }
    });
    if (!notebookId) {
        const fileModel = getDockByType("file").data.file;
        if (fileModel instanceof Files) {
            const currentElement = fileModel.element.querySelector(".b3-list-item--focus");
            if (currentElement) {
                const topElement = hasTopClosestByTag(currentElement, "UL");
                if (topElement) {
                    notebookId = topElement.getAttribute("data-url");
                }
                const selectPath = currentElement.getAttribute("data-path");
                if (useSavePath) {
                    currentPath = selectPath;
                } else {
                    currentPath = pathPosix().dirname(selectPath);
                }
            }
        }
    }
    /// #else
    if (window.siyuan.mobile.editor && document.getElementById("empty").classList.contains("fn__none")) {
        notebookId = window.siyuan.mobile.editor.protyle.notebookId;
        if (useSavePath) {
            currentPath = window.siyuan.mobile.editor.protyle.path;
        } else {
            currentPath = pathPosix().dirname(window.siyuan.mobile.editor.protyle.path);
        }
    }
    /// #endif
    if (!notebookId) {
        window.siyuan.notebooks.find(item => {
            if (!item.closed) {
                notebookId = item.id;
                currentPath = "/";
                return true;
            }
        });
    }
    return {notebookId, currentPath};
};

export const newFile = (optios: {
    app: App,
    notebookId?: string,
    currentPath?: string,
    paths?: string[],
    useSavePath: boolean,
    name?: string,
    afterCB?: (id: string, title: string) => void
    listDocTree?: boolean
}) => {
    if (getOpenNotebookCount() === 0) {
        showMessage(window.siyuan.languages.newFileTip);
        return;
    }
    if (!optios.notebookId) {
        const resultData = getNewFilePath(optios.useSavePath);
        optios.notebookId = resultData.notebookId;
        optios.currentPath = resultData.currentPath;
    }
    fetchPost("/api/filetree/getDocCreateSavePath", {notebook: optios.notebookId}, (data) => {
        if (!optios.useSavePath) {
            data.data.box = optios.notebookId;
        }
        if ((data.data.path.indexOf("/") > -1 && optios.useSavePath) || optios.name) {
            if (data.data.path.startsWith("/") || optios.currentPath === "/") {
                const createPath = pathPosix().join(data.data.path, optios.name || (data.data.path.endsWith("/") ? window.siyuan.languages.untitled : ""));
                fetchPost("/api/filetree/createDocWithMd", {
                    notebook: data.data.box,
                    path: createPath,
                    // 根目录时无法确定 parentID
                    markdown: "",
                    listDocTree: optios.listDocTree
                }, response => {
                    if (optios.afterCB) {
                        optios.afterCB(response.data, pathPosix().basename(createPath));
                    }
                    /// #if !MOBILE
                    openFileById({
                        app: optios.app,
                        id: response.data,
                        action: [Constants.CB_GET_CONTEXT, Constants.CB_GET_OPENNEW]
                    });
                    /// #else
                    openMobileFileById(optios.app, response.data, [Constants.CB_GET_CONTEXT, Constants.CB_GET_OPENNEW]);
                    /// #endif
                });
            } else {
                fetchPost("/api/filetree/getHPathByPath", {
                    notebook: data.data.box,
                    path: optios.notebookId === data.data.box ? (optios.currentPath.endsWith(".sy") ? optios.currentPath : optios.currentPath + ".sy") : (data.data.path || "/")
                }, (responseHPath) => {
                    const createPath = pathPosix().join(responseHPath.data, data.data.path, optios.name || (data.data.path.endsWith("/") ? window.siyuan.languages.untitled : ""));
                    fetchPost("/api/filetree/createDocWithMd", {
                        notebook: data.data.box,
                        path: createPath,
                        parentID: getDisplayName(optios.currentPath, true, true),
                        markdown: "",
                        listDocTree: optios.listDocTree
                    }, response => {
                        if (optios.afterCB) {
                            optios.afterCB(response.data, pathPosix().basename(createPath));
                        }
                        /// #if !MOBILE
                        openFileById({
                            app: optios.app,
                            id: response.data,
                            action: [Constants.CB_GET_CONTEXT, Constants.CB_GET_OPENNEW]
                        });
                        /// #else
                        openMobileFileById(optios.app, response.data, [Constants.CB_GET_CONTEXT, Constants.CB_GET_OPENNEW]);
                        /// #endif
                    });
                });
            }
        } else {
            const title = pathPosix().basename(data.data.path || window.siyuan.languages.untitled);
            if (!validateName(title)) {
                return;
            }
            if (optios.notebookId !== data.data.box) {
                const createPath = pathPosix().join(data.data.path || "/", optios.name || (data.data.path.endsWith("/") ? window.siyuan.languages.untitled : ""));
                fetchPost("/api/filetree/createDocWithMd", {
                    notebook: data.data.box,
                    path: createPath,
                    markdown: "",
                    listDocTree: optios.listDocTree
                }, response => {
                    if (optios.afterCB) {
                        optios.afterCB(response.data, pathPosix().basename(createPath));
                    }
                    /// #if !MOBILE
                    openFileById({
                        app: optios.app,
                        id: response.data,
                        action: [Constants.CB_GET_CONTEXT, Constants.CB_GET_OPENNEW]
                    });
                    /// #else
                    openMobileFileById(optios.app, response.data, [Constants.CB_GET_CONTEXT, Constants.CB_GET_OPENNEW]);
                    /// #endif
                });
                return;
            }

            const id = Lute.NewNodeID();
            const newPath = (pathPosix().join(getDisplayName(optios.currentPath, false, true), id + ".sy"));
            if (optios.paths) {
                optios.paths[optios.paths.indexOf(undefined)] = newPath;
            }
            fetchPost("/api/filetree/createDoc", {
                notebook: data.data.box,
                path: newPath,
                title,
                md: "",
                sorts: optios.paths,
                listDocTree: optios.listDocTree
            }, () => {
                if (optios.afterCB) {
                    optios.afterCB(id, title);
                }
                /// #if !MOBILE
                openFileById({app: optios.app, id, action: [Constants.CB_GET_CONTEXT, Constants.CB_GET_OPENNEW]});
                /// #else
                openMobileFileById(optios.app, id, [Constants.CB_GET_CONTEXT, Constants.CB_GET_OPENNEW]);
                /// #endif
            });
        }
    });
};

export const getSavePath = (pathString: string, notebookId: string, cb: (p: string, notebookId: string) => void) => {
    fetchPost("/api/filetree/getRefCreateSavePath", {
        notebook: notebookId
    }, (data) => {
        let targetPath = pathString;
        if (notebookId !== data.data.box) {
            targetPath = data.data.path || "/";
        }
        if (data.data.path) {
            if (data.data.path.startsWith("/")) {
                cb(getDisplayName(data.data.path, false, true), data.data.box);
            } else {
                fetchPost("/api/filetree/getHPathByPath", {
                    notebook: data.data.box,
                    path: targetPath
                }, (response) => {
                    cb(getDisplayName(pathPosix().join(response.data, data.data.path), false, true), data.data.box);
                });
            }
        } else {
            fetchPost("/api/filetree/getHPathByPath", {
                notebook: data.data.box,
                path: targetPath
            }, (response) => {
                cb(getDisplayName(response.data, false, true), data.data.box);
            });
        }
    });
};

export const newFileByName = (app: App, value: string) => {
    hideElements(["dialog"]);
    newFile({
        app,
        useSavePath: true,
        name: replaceFileName(value.trim()) || window.siyuan.languages.untitled
    });
};

export const newFileBySelect = (protyle: IProtyle, selectText: string, nodeElement: HTMLElement, pathDir: string, targetNotebookId: string) => {
    const newFileName = replaceFileName(selectText.trim() ? selectText.trim() : protyle.lute.BlockDOM2Content(nodeElement.outerHTML).replace(/\n/g, "").trim()) || window.siyuan.languages.untitled;
    const hPath = pathPosix().join(pathDir, newFileName);
    fetchPost("/api/filetree/getIDsByHPath", {
        path: hPath,
        notebook: targetNotebookId
    }, (idResponse) => {
        const refText = newFileName.substring(0, window.siyuan.config.editor.blockRefDynamicAnchorTextMaxLen);
        if (idResponse.data && idResponse.data.length > 0) {
            protyle.toolbar.setInlineMark(protyle, "block-ref", "range", {
                type: "id",
                color: `${idResponse.data[0]}${Constants.ZWSP}d${Constants.ZWSP}${refText}`
            });
        } else {
            fetchPost("/api/filetree/createDocWithMd", {
                notebook: targetNotebookId,
                path: hPath,
                parentID: protyle.notebookId === targetNotebookId ? protyle.block.rootID : "",
                markdown: ""
            }, response => {
                protyle.toolbar.setInlineMark(protyle, "block-ref", "range", {
                    type: "id",
                    color: `${response.data}${Constants.ZWSP}d${Constants.ZWSP}${refText}`
                });
            });
        }
        hideElements(["toolbar"], protyle);
    });
};
