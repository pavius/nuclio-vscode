'use strict';

import * as fse from 'fs-extra';
import * as vscode from 'vscode';

export namespace DialogResponses {
    export const yes: vscode.MessageItem = { title: 'Yes' };
    export const no: vscode.MessageItem = { title: 'No' };
    export const cancel: vscode.MessageItem = { title: 'Cancel', isCloseAffordance: true };
    export const deleteResponse: vscode.MessageItem = { title: 'Delete' };
}

export async function writeFormattedJson(fsPath: string, data: object): Promise<void> {
    await fse.writeJson(fsPath, data, { spaces: 2 });
}

export async function confirmEditJsonFile(fsPath: string, editJson: (existingData: {}) => {}): Promise<void> {
    let newData: {};
    if (await fse.pathExists(fsPath)) {
        try {
            newData = editJson(<{}>await fse.readJson(fsPath));
        } catch (error) {
            // If we failed to parse or edit the existing file, just ask to overwrite the file completely
            if (await confirmOverwriteFile(fsPath)) {
                newData = editJson({});
            } else {
                return;
            }
        }
    } else {
        newData = editJson({});
    }

    await writeFormattedJson(fsPath, newData);
}

export async function confirmOverwriteFile(fsPath: string): Promise<boolean> {
    if (await fse.pathExists(fsPath)) {
        const result: vscode.MessageItem | undefined = await vscode.window.showWarningMessage('File' + fsPath + ' already exists. Overwrite?', DialogResponses.yes, DialogResponses.no, DialogResponses.cancel);
        return result === DialogResponses.yes;
    } else {
        return true;
    }
}

export function isEmpty(obj) {
    return typeof obj === 'undefined' || obj === null || Object.keys(obj).length === 0;
}