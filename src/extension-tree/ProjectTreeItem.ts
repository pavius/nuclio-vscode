import * as vscode from 'vscode';
import { ProjectConfig } from '../nuclio';
import { NuclioTreeBase, NuclioTreeObject } from './NuclioTreeItem';
import { FunctionTreeItem } from './FunctionTreeItem';
import { dashboard } from '../extension';
import { ContextValues } from '../constants';

export class ProjectTreeItem extends NuclioTreeBase {

    getChildren(): vscode.ProviderResult<NuclioTreeObject[]> {
        return new Promise(async resolve => {
            let functionConfigs = await dashboard.getFunctions({
                projectName: this.projectConfig.metadata.name,
                namespace: this.projectConfig.metadata.namespace,
            });
            let functionTreeItems = functionConfigs.map(functionConfig => new FunctionTreeItem(functionConfig));
            return resolve(functionTreeItems);
        });
    }

    constructor(
        public readonly projectConfig: ProjectConfig
    ) {
        super(projectConfig.metadata.name, ContextValues.project, vscode.TreeItemCollapsibleState.Expanded);
    }
}