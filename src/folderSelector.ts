'use strict';

import { window, QuickPickItem, workspace, WorkspaceFolder, WorkspaceConfiguration, Uri } from 'vscode';
import * as path from 'path';
import { extensionPrefix } from './constants';

export async function selectFolder(placeHolder: string, subpathSettingKey?: string): Promise<string> {
    let folder: NuclioQuickPickItem<string | undefined> | undefined;
    if (workspace.workspaceFolders) {
        const folderPicks: NuclioQuickPickItem<string | undefined>[] = workspace.workspaceFolders.map((f: WorkspaceFolder) => {
            let subpath: string | undefined;
            if (subpathSettingKey) {
                subpath = getFuncExtensionSetting(subpathSettingKey, f.uri.fsPath);
            }

            const fsPath: string = subpath ? path.join(f.uri.fsPath, subpath) : f.uri.fsPath;
            return { label: path.basename(fsPath), description: fsPath, data: fsPath };
        });

        folderPicks.push({ label: '$(file-directory) Browse...', description: '', data: undefined });
        folder = await window.showQuickPick(folderPicks, { placeHolder });
    }

    return folder && folder.data ? folder.data : (await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        defaultUri: workspace.workspaceFolders ? workspace.workspaceFolders[0].uri : undefined,
        openLabel: 'Select'
    }))[0].fsPath;
}

export interface NuclioQuickPickItem<T = undefined> extends QuickPickItem {
    /**
     * An optional id to uniquely identify this item across sessions, used in persisting previous selections
     * If not specified, a hash of the label will be used
     */
    id?: string;

    data: T;

    /**
     * Optionally used to suppress persistence for this item, defaults to `false`
     */
    suppressPersistence?: boolean;
}

function getFuncExtensionSetting<T>(key: string, fsPath?: string): T | undefined {
    const projectConfiguration: WorkspaceConfiguration = workspace.getConfiguration(extensionPrefix, fsPath ? Uri.file(fsPath) : undefined);
    // tslint:disable-next-line:no-backbone-get-set-outside-model
    return projectConfiguration.get<T>(key);
}