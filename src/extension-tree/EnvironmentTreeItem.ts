'use strict';

import * as vscode from 'vscode';
import { LocalEnvironment, LocalProject } from '../nuclio';
import { NuclioTreeBase, NuclioTreeObject } from './NuclioTreeItem';
import { ContextValues } from '../constants';
import { ProjectTreeItem } from './ProjectTreeItem';
import { isEmpty } from '../utils';
import { ProjectFile } from '../config/projectFile';

export class EnvironmentTreeItem extends NuclioTreeBase {

    getChildren(): vscode.ProviderResult<NuclioTreeObject[]> {
        return new Promise(async resolve => {
            let projects = await this.getProjectsFromConfig(this.environmentConfig);
            if (!isEmpty(projects)) {
                return resolve(projects.map(project => new ProjectTreeItem(project, this.environmentConfig)));
            }
            return resolve([]);
        });
    }

    constructor(
        public readonly environmentConfig: LocalEnvironment
    ) {
        super(environmentConfig.name, ContextValues.environment, vscode.TreeItemCollapsibleState.Expanded);
    }

    async getProjectsFromConfig(environmentConfig: LocalEnvironment): Promise<LocalProject[]> {
        if (isEmpty(environmentConfig.projects)) {
            return [];
        }

        return environmentConfig.projects.map(project => {
            let projectFileConfig = new ProjectFile(project.path);
            return projectFileConfig.readFromFile();
        });
    }
}