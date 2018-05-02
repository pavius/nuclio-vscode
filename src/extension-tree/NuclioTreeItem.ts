import * as vscode from 'vscode';
import * as path from 'path';

export interface NuclioTreeObject extends vscode.TreeItem {
    readonly id: string;
    readonly contextValue: string;

    getChildren(): vscode.ProviderResult<NuclioTreeObject[]>;
    getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem>;
    getIconPath(): string;

}

export class NuclioTreeBase implements NuclioTreeObject {
    id: string;
    contextValue: string;
    collapsibleState: vscode.TreeItemCollapsibleState;

    constructor(id: string, contextValue: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        this.id = id;
        this.contextValue = contextValue;
        this.collapsibleState = collapsibleState;
    }

    getChildren(): vscode.ProviderResult<NuclioTreeObject[]> {
        throw new Error('Base Class: Method not implemented.');
    }

    getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem> {
        let treeItem: vscode.TreeItem = {
            label: this.id,
            collapsibleState: this.collapsibleState,
            iconPath: this.getIconPath(),
            contextValue: this.contextValue
        };

        return treeItem;
    }

    // Using the same icon for projects and functions for now
    getIconPath(): string {
        return path.join(__filename, '..', '..', '..', 'resources', `nuclioIcon.svg`);
    }
}