'use strict';

import * as path from 'path';
import { ProjectConfig, LocalProject } from '../nuclio';
import { confirmEditJsonFile } from '../utils';
import { SettingsFile } from './settingsFile';

const fse = require('fs-extra');


// Nuclio project settings file will be saved under project-folder/.vscode/nuclio.json
// This file will contain the project's configurations and the local function under this project.
export interface IProjectFile {
    // Returns the project config folder path (example: project-folder/.vscode) 
    getFolderPath();

    // Returns the project config file path (example: project-folder/.vscode/nuclio.json) 
    getFilePath();

    // Creates the config folder
    createConfigFolder();

    // Write the project configuration to project file
    writeToProjectConfig(projectConfig: LocalProject);

    // Write the project configuration to settings file
    writeToSettingsConfig(projectConfig: LocalProject, environmentName: string);

    // Reads the configuration from nuclio.json file
    readFromFile(): LocalProject;
}

export class ProjectFile implements IProjectFile {

    constructor(private folderPath: string) {
    }

    async createConfigFolder() {
        return await fse.ensureDir(this.getFolderPath());
    }

    getFolderPath() {
        return path.join(this.folderPath, '.vscode');
    }

    getFilePath() {
        return path.join(this.getFolderPath(), 'nuclio.json');
    }

    async writeToProjectConfig(projectConfig: LocalProject) {
        // Write to project config
        const settingsJsonPath: string = this.getFilePath();
        await confirmEditJsonFile(
            settingsJsonPath,
            (data: LocalProject): {} => {
                data.name = projectConfig.name;
                data.displayName = projectConfig.displayName;
                data.functions = projectConfig.functions;
                // Not sure if needed
                data.path = this.folderPath;

                return data;
            },
        );
    }

    async writeToSettingsConfig(projectConfig: LocalProject, environmentName: string) {
        // Write to settings file
        let settingsFile = new SettingsFile();
        let settingsData = await settingsFile.readFromFile();

        settingsData.environments.find(env => env.name === environmentName).projects.push({
            name: projectConfig.name,
            path: this.folderPath
        });

        await settingsFile.updateSettingsFile(settingsData);
    }

    readFromFile(): LocalProject {
        let projectConfigFile = fse.readJsonSync(this.getFilePath(), 'utf8');
        return new LocalProject(projectConfigFile.name, projectConfigFile.displayName, this.folderPath, projectConfigFile.functions);
    }
}