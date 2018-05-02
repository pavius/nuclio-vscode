'use strict';

import * as nuclio from '../nuclio';
import * as vscode from 'vscode';
import { selectFolder } from '../folderSelector';
import { ProjectConfig } from '../nuclio';
import { ProjectFile } from '../config/projectFile';

const fse = require('fs-extra');

export async function CreateProject(environmentConfig: nuclio.LocalEnvironment) {
    let dashboard = new nuclio.Dashboard(environmentConfig.address);

    let displayName = await vscode.window.showInputBox({ prompt: 'Enter the project\'s name' });
    let namespace = await vscode.window.showInputBox({ prompt: 'Enter the new project namespace' });
    let description = await vscode.window.showInputBox({ prompt: 'Enter the project\'s description' });
    let filePath = await selectFolder('Select the folder for the project');

    let projectConfig = new nuclio.ProjectConfig();
    projectConfig.metadata.namespace = namespace;
    projectConfig.spec.description = description;
    projectConfig.spec.displayName = displayName;

    let projectFileConfig = new ProjectFile(filePath);

    // Create .vscode file
    await projectFileConfig.createConfigFolder();

    // Create the project in nuclio
    let remoteProjConfig = await dashboard.createProject(projectConfig);

    vscode.window.showInformationMessage('Project created successfully');

    let projectInEnvironment = new nuclio.LocalProject(remoteProjConfig.metadata.name, displayName, filePath, []);
    await projectFileConfig.writeToProjectConfig(projectInEnvironment);
    await projectFileConfig.writeToSettingsConfig(projectInEnvironment, environmentConfig.name);

    vscode.window.showInformationMessage('Settings files were updated successfully');
}