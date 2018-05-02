'use strict';

import * as vscode from 'vscode';
import { FunctionConfig, Dashboard, LocalFunction } from '../nuclio';
import { NuclioTreeBase, NuclioTreeObject } from './NuclioTreeItem';
import { ContextValues } from '../constants';

export class FunctionTreeItem extends NuclioTreeBase {

	// function have no children in tree view.
	getChildren(): vscode.ProviderResult<NuclioTreeObject[]> {
		return null;
	}

	constructor(
		public readonly functionConfig: LocalFunction,
		public readonly dashboard: Dashboard,
		public readonly projectName: string
	) {
		super(functionConfig.name, ContextValues.function, vscode.TreeItemCollapsibleState.None);
		this.functionConfig = functionConfig;
	}
}