'use strict';

import * as vscode from 'vscode';
import { ProjectConfig, Dashboard, LocalEnvironment, LocalProject, LocalFunction } from '../nuclio';
import { NuclioTreeBase, NuclioTreeObject } from './NuclioTreeItem';
import { FunctionTreeItem } from './FunctionTreeItem';
import { ContextValues } from '../constants';
import { isEmpty } from '../utils';

export class ProjectTreeItem extends NuclioTreeBase {

    constructor(
        public readonly projectConfig: LocalProject,
        public readonly environmentConfig: LocalEnvironment,
    ) {
        super(projectConfig.displayName, ContextValues.project, vscode.TreeItemCollapsibleState.Expanded);
    }

    getChildren(): vscode.ProviderResult<NuclioTreeObject[]> {
        return new Promise(async resolve => {
            let functionConfigs = await this.getFunctionsFromConfig(this.projectConfig.functions);
            if (isEmpty(functionConfigs)) {
                return resolve();
            }
            let functionTreeItems = functionConfigs.map(functionConfig =>
                new FunctionTreeItem(functionConfig, new Dashboard(this.environmentConfig.address), this.projectConfig.name));
            return resolve(functionTreeItems);
        });
    }

    async getFunctionsFromConfig(functions: LocalFunction[]): Promise<LocalFunction[]> {
        if (isEmpty(functions)) {
            return [];
        }

        return functions.map(func => {
            return new LocalFunction(func.name, func.namespace, func.path);
        });
    }
}