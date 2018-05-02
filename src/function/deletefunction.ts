'use strict';

import * as vscode from 'vscode';
import * as nuclio from '../nuclio';
import { DialogResponses, writeFormattedJson } from '../utils';
import { FunctionTreeItem } from '../extension-tree/FunctionTreeItem';
import * as path from 'path';
import { ProjectFile } from '../config/projectFile';

const fs = require('fs-extra');

export async function deleteLocalFunction(functionTreeItem: FunctionTreeItem) {
    const message: string = `Do you want to delete local source as well?`;
    await vscode.window.showWarningMessage(message, DialogResponses.deleteResponse, DialogResponses.cancel);

    // Remove folder and files
    fs.removeSync(functionTreeItem.functionConfig.path);

    // Remove function config from json
    // Assuming the function was in sub-folder of the project
    let projectFile = new ProjectFile(path.join(functionTreeItem.functionConfig.path, '..'));

    let projectConfigFile = projectFile.readFromFile();
    projectConfigFile.functions = projectConfigFile.functions.filter(obj => obj.name !== functionTreeItem.functionConfig.name);
    await projectFile.writeToProjectConfig(projectConfigFile);
}