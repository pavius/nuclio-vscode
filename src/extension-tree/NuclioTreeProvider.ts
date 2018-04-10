import * as vscode from 'vscode';
import { ProjectTreeItem } from './ProjectTreeItem';
import { NuclioTreeObject } from './NuclioTreeItem';
import { dashboard } from '../extension';
import { projectNamespace } from '../constants';


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
                let projects = await dashboard.getProjects({ namespace: projectNamespace });
                return resolve(projects.map(project => new ProjectTreeItem(project)));
            });
        }

        return element.getChildren();
    }
}