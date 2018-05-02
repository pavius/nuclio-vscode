'use strict';

import * as vscode from 'vscode';
import { NuclioTreeObject } from './NuclioTreeItem';
import { EnvironmentTreeItem } from './EnvironmentTreeItem';
import { SettingsFile } from '../config/settingsFile';


export class NuclioTreeProvider implements vscode.TreeDataProvider<NuclioTreeObject> {
    private _onDidChangeTreeData: vscode.EventEmitter<NuclioTreeObject | undefined> = new vscode.EventEmitter<NuclioTreeObject | undefined>();
    readonly onDidChangeTreeData: vscode.Event<NuclioTreeObject | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: NuclioTreeObject): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getTreeItem();
    }

    public getChildren(element?: NuclioTreeObject | undefined): vscode.ProviderResult<NuclioTreeObject[]> {
        if (typeof element === 'undefined') {
            return new Promise(async resolve => {
                let settingsFile = new SettingsFile();
                let settingsData = await settingsFile.readFromFile();
                return resolve(settingsData.environments.map(env => new EnvironmentTreeItem(env)));
            });
        }

        return element.getChildren();
    }
}