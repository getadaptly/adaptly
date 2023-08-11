import { File, IndirectFile, findFiles } from '@adaptly/services/adaptly/importsFinder';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { Octokit } from '@octokit/core';
import { IssueCommentEvent } from '@octokit/webhooks-types';
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, CreateChatCompletionResponse } from 'openai';
import { RoleSystem, RoleUser } from '@adaptly/services/openai/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { ErrorHandler, OpenAiError } from '@adaptly/errors/types';
import { BreakingChange } from '../breaking-changes/findBreakingChanges';
import { parseJSON } from '@adaptly/utils/json/parseJson';
import { chatCompletion } from '@adaptly/services/openai/utils/chatCompletion';
import { getMessageContent } from '@adaptly/services/openai/utils/getMessageContent';
import { GPT4_MODEL, MODEL } from '@adaptly/services/openai/client';
import { DependencyUpdate } from '../pr-dependencies/getDependenciesUpdated';

const filesAtRiskDirectPrompt = `You are a senior software engineer tasked with evaluating the impact of upgrading a package to its latest version. You will be provided with a source code file that uses the package, and a changelog entry detailing the updates in the new version.

Tasks:
1. Extract the provided source code file, package name, and changelog entry from the given JSON input.
2. Check whether the source code directly imports the package you are looking to upgrade.
3. Parse the changelog entry to identify specific modules and functionalities that are impacted by the update.
4. Scan the source code to see if it directly uses the impacted modules or functionalities. Do not assume that all methods used in the code are affected unless they are explicitly stated as such in the changelog. Ignore any indirect usage or internal changes within the package.
5. Assess if the changes described in the changelog would cause the existing code to fail. Consider only functional changes, excluding environmental or runtime changes such as minimum software version requirements.
6. Determine whether the code needs refactoring to adapt to the new version of the package. The code only needs refactoring if it directly uses a feature that has been altered or removed in the new version. The refactoring should be feasible within the provided source code. If the necessary changes affect a different file or part of the codebase, return false for this task.

Input format:
{
   "file": {
        "type": "string",
        "description": "Source code of the file under inspection"   
    },
   "package_name": {
        "type": "string",
        "description": "Name of the package to be upgraded"   
    },
   "changelog_entry": {
        "type": "string",
        "description": "Changelog entry for the new package version"   
    }
}

Your output should be a comprehensive JSON object containing the following fields:

{
  "imports_package": {
        "type": "boolean",
        "description": "Indicates whether the provided code directly imports the package"
   },
   "functionality_directly_used": {
        "type": "boolean",
        "description": "Indicates whether the functionality mentioned in the changelog is directly used in the given source code"   
    },
   "change_breaks_given_code": {
        "type": "boolean",
        "description": "Indicates whether the changes will cause the given code to fail"   
    },
   "given_code_needs_refactor": {
        "type": "boolean",
        "description": "Indicates whether the given piece of code needs to be changed"   
    },
    "explanation": {
        "type": "string",
        "description": "Explain the reasoning that you carried out. Format this string correctly for JSON parsing, including escaping new lines. Explanation can be maximum 3 sentences."   
    },
}`;

const filesAtRiskDirectConfirmationPrompt = `Please review your analysis, paying close attention to the following:

- Does the "functionality_used" field accurately reflect the direct usage of identified functionalities within the code?
- Does the "change_breaks_given_code" field accurately indicate if the update will break the given source code?
- Does the "given_code_needs_refactor" field accurately represent if the given code requires modifications, and are these modifications possible within the provided source code?
- Does the "explanation" field provide a comprehensive, understandable rationale for each decision?

Precision and detail are key for this task. If any inaccuracies are found, ensure you make the necessary corrections and respond with the expected JSON format.
`;

const filesAtRiskIndirectPrompt = `You are a senior software engineer tasked with evaluating the impact of upgrading a package to its latest version. You will be provided with two source code files: one that directly imports the package and another that indirectly uses the package through imported objects from the directly importing file. A changelog entry detailing the updates in the new version will also be given.

Tasks:
1. Extract the provided source code files, package name, and changelog entry from the given JSON input.
2. Parse the changelog entry to identify specific modules and functionalities that are impacted by the update.
3. Check whether the source code file that indirectly uses the package, utilizes the updated functionalities or modules through any of its imported objects, directly or indirectly. This counts as "direct use" in our context.
4. Assess if the changes described in the changelog would cause the indirectly importing code to fail or behave unexpectedly. 
5. Determine whether the indirectly importing code needs refactoring to adapt to the new version of the package.

Input format:
{
   "direct_import_file_content": {
        "type": "string",
        "description": "Source code of the file that directly imports the package"   
    },
   "indirect_import_file_content": {
        "type": "string",
        "description": "Source code of the file that indirectly imports and uses objects from the directly importing file"   
    },
   "package_name": {
        "type": "string",
        "description": "Name of the package to be upgraded"   
    },
   "changelog_entry": {
        "type": "string",
        "description": "Changelog entry for the new package version"   
    }
}

Your output should be a comprehensive JSON object containing the following fields:

{
  "functionality_directly_used": {
        "type": "boolean",
        "description": "Indicates whether the functionality mentioned in the changelog is directly used in the indirectly importing code through any imported objects (directly or indirectly)"   
    },
   "change_breaks_indirect_code": {
        "type": "boolean",
        "description": "Indicates whether the changes will cause the indirectly importing code to fail or behave unexpectedly"   
    },
   "indirect_code_needs_refactor": {
        "type": "boolean",
        "description": "Indicates whether the indirectly importing code needs to be refactored due to the changes in the package version"   
    },
    "explanation": {
        "type": "string",
        "description": "Explain the reasoning that you carried out in maximum 2 sentences. Format this string correctly for JSON parsing, including escaping new lines."   
    },
}`;

const filesAtRiskIndirectConfirmationPrompt = `Please review your analysis, paying close attention to the following:

- Does the "functionality_directly_used" field accurately reflect the usage of identified functionalities within the indirectly importing code?
- Does the "change_breaks_indirect_code" field accurately indicate if the update will break or cause the indirectly importing code to behave unexpectedly?
- Does the "indirect_code_needs_refactor" field accurately represent if the indirectly importing code requires modifications, and are these modifications feasible within the provided source code?
- Does the "explanation" field provide a comprehensive, understandable rationale for each decision?

Precision and detail are key for this task. If any inaccuracies are found, ensure you make the necessary corrections and respond with the expected JSON format.`;

export type Refactor = {
    breakingChange: BreakingChange;
    filesAtRisk: string[];
};

export async function findRefactors(update: DependencyUpdate, breakingChanges: BreakingChange[], payload: IssueCommentEvent): Promise<Refactor[]> {
    if (!breakingChanges.length) {
        return [];
    }

    const refactors: Refactor[] = [];

    const importingFiles = await findFiles(payload.repository.full_name, update.dependencyName, update.manifestFilename, update.dirName);

    Logger.info('Files that import dependency', {
        repository: payload.repository.full_name,
        PR: `#${payload.issue.number}`,
        dependency: update.dependencyName,
        importingFiles
    });

    for (let breakingChange of breakingChanges) {
        const filesAtRisk = await getFilesAtRisk(update.dependencyName, breakingChange, importingFiles);

        if (filesAtRisk.length) {
            refactors.push({
                breakingChange: breakingChange,
                filesAtRisk: filesAtRisk
            });
        }
    }

    return refactors;
}

async function getFilesAtRisk(packageName: string, breakingChange: BreakingChange, filesUsingDependency: (File | IndirectFile)[]): Promise<string[]> {
    const filesAtRisk: string[] = [];

    for (let file of filesUsingDependency) {
        const fileAffected = await isFileAffected(packageName, breakingChange, file);
        if (fileAffected) {
            filesAtRisk.push(file.path);
        }
    }

    return filesAtRisk;
}

type ModelResponse = {
    imports_package: boolean;
    functionality_directly_used: boolean;
    change_breaks_given_code: boolean;
    given_code_needs_refactor: boolean;
    explanation: string;
};

function isValidModelResponse(response: any): response is ModelResponse {
    if (typeof response !== 'object') {
        return false;
    }

    if (
        !response.hasOwnProperty('functionality_directly_used') ||
        (!response.hasOwnProperty('change_breaks_given_code') && !response.hasOwnProperty('change_breaks_indirect_code')) ||
        (!response.hasOwnProperty('given_code_needs_refactor') && !response.hasOwnProperty('indirect_code_needs_refactor')) ||
        !response.hasOwnProperty('explanation')
    ) {
        return false;
    }

    return true;
}

export async function isFileAffected(packageName: string, breakingChange: BreakingChange, file: File): Promise<boolean> {
    const { filesAtRiskConversation, modelMessage } = await askChatGptRefactors(packageName, breakingChange, file);

    if (!modelMessage.content) {
        throwOpenAiError('Empty model message content', { content: modelMessage.content });
    }

    const modelResponse = parseJSON(modelMessage.content);

    if (!isValidModelResponse(modelResponse)) {
        throwOpenAiError('Invalid isFileAffected 1st check model response', { response: modelResponse });
    }

    let isAffected = modelResponse.functionality_directly_used && modelResponse.given_code_needs_refactor && modelResponse.change_breaks_given_code;

    Logger.info('ChatGPT: Checked if file affected', {
        file: file.path,
        dependency: packageName,
        breakingChange,
        isAffected,
        filesAtRiskConversation
    });

    if (!isAffected || !modelMessage) {
        return false;
    }

    let doubleCheckCompletionData: CreateChatCompletionResponse;

    try {
        filesAtRiskConversation.push(modelMessage);
        filesAtRiskConversation.push({
            role: RoleUser,
            content: isIndirectFile(file) ? filesAtRiskIndirectConfirmationPrompt : filesAtRiskDirectConfirmationPrompt
        });

        const doubleCheckCompletion = await chatCompletion(filesAtRiskConversation, GPT4_MODEL);
        doubleCheckCompletionData = doubleCheckCompletion.data;
    } catch (error) {
        throwOpenAiError(error, filesAtRiskConversation);
    }

    const messageContent = getMessageContent(doubleCheckCompletionData);

    const doubleCheckModelResponse = parseJSON(messageContent);

    if (!isValidModelResponse(doubleCheckModelResponse)) {
        throwOpenAiError('Invalid isFileAffected 2nd check model response', { response: modelResponse });
    }

    isAffected = doubleCheckModelResponse.functionality_directly_used && doubleCheckModelResponse.given_code_needs_refactor;

    Logger.info('ChatGPT: Double checked if file affected', {
        file: file.path,
        dependency: packageName,
        breakingChange,
        isAffected,
        filesAtRiskConversation
    });

    return isAffected;
}

type ChatGptRefactors = {
    filesAtRiskConversation: ChatCompletionRequestMessage[];
    modelMessage: ChatCompletionResponseMessage;
};

async function askChatGptRefactors(packageName: string, breakingChange: BreakingChange, file: File | IndirectFile): Promise<ChatGptRefactors> {
    const filesAtRiskConversation: ChatCompletionRequestMessage[] = [];

    let prompt = isIndirectFile(file) ? filesAtRiskIndirectPrompt : filesAtRiskDirectPrompt;

    filesAtRiskConversation.push({
        role: RoleSystem,
        content: `${prompt}`
    });

    let content;
    if (isIndirectFile(file)) {
        content = {
            direct_import_file_content: file.importsFrom.content,
            indirect_import_file_content: file.content,
            package_name: packageName,
            changelog_entry: breakingChange
        };
    } else {
        content = {
            file: file.content,
            package_name: packageName,
            changelog_entry: breakingChange
        };
    }

    filesAtRiskConversation.push({
        role: RoleUser,
        content: JSON.stringify(content)
    });

    let completionData: CreateChatCompletionResponse;

    try {
        const completion = await chatCompletion(filesAtRiskConversation, MODEL);
        completionData = completion.data;
    } catch (error) {
        throwOpenAiError(error, filesAtRiskConversation);
    }

    const modelMessage = completionData.choices[0].message;

    if (!modelMessage) {
        throwOpenAiError('Empty model message', { modelMessage });
    }

    return {
        filesAtRiskConversation,
        modelMessage
    };
}

function isIndirectFile(file: File | IndirectFile): file is IndirectFile {
    return (file as IndirectFile).importsFrom !== undefined;
}

const throwOpenAiError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.openAiFailedRefactors), error, context);

    throw new OpenAiError(ADAPTLY_ERRORS.openAiFailedRefactors, context);
};
