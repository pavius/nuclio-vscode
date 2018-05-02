'use strict';

import * as path from 'path';
import { LocalEnvironment, EnvironmentsConfig } from '../nuclio';
import { writeFormattedJson } from '../utils';
import { userConfigurationFolder, userConfigurationFileName } from '../constants';
const fse = require('fs-extra');

// Nuclio global settings file will be saved under Home/.nuclio-vscode/nuclio.json
// This file will contain the different Nuclio Dashboard configurations and the local projects folder mapping.
interface ISettingsFile {
    
    // return the user home directory - compatible for different operation systems.
    getUserHome();

    // gets the settings file path
    getFolderPath();

    // Create .nuclio-vscode folder on ~Home folder if not exist
    createSettingsFolder();

    // Get the full Home/.nuclio-vscode/nuclio.json file path
    getFilePath();

    // Write the project configuration to nuclio.json file
    addNewEnvironment(newEnv: LocalEnvironment);

    // Reads the configuration from Home/.nuclio-vscode/nuclio.json file
    readFromFile(folderPath: string): Promise<EnvironmentsConfig>;
}

export class SettingsFile implements ISettingsFile {

    getUserHome() {
        return process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
    }

    getFolderPath() {
        return path.join(this.getUserHome(), userConfigurationFolder);
    }

    async createSettingsFolder() {
        return await fse.ensureDir(this.getFolderPath());
    }

    getFilePath() {
        return path.join(this.getFolderPath(), userConfigurationFileName);
    }

    async updateSettingsFile(data: EnvironmentsConfig){
        await writeFormattedJson(this.getFilePath(), data);
    }

    // Write the environment configuration to nuclio.json file
    async addNewEnvironment(newEnv: LocalEnvironment) {
        let data;
        let filePath = this.getFilePath();
        if (await fse.pathExists(filePath)) {
            data = await fse.readJson(filePath);
            data.environments.push(newEnv);
        } else {
            data = { environments: [newEnv] };
        }

        this.updateSettingsFile(data);
    }

    // Reads the configuration from nuclio.json file
    async readFromFile(): Promise<EnvironmentsConfig> {
        let environmentConfigPath = this.getFilePath();
        if (await fse.pathExists(this.getFilePath())) {
            let environmentConfig = await fse.readJson(environmentConfigPath);
            return environmentConfig;
        }

        return new EnvironmentsConfig();
    }
}