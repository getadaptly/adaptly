import { getChangelog } from '@adaptly/services/adaptly/changelogHunter';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import { DependencyUpdate } from '@adaptly/events/issue_handler/actions/created/commands/go/source/pr-dependencies/getDependenciesUpdated';
import { RoleSystem, RoleUser } from '@adaptly/services/openai/types';
import { ErrorHandler, OpenAiError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { parseJSON } from '@adaptly/utils/json/parseJson';
import { chatCompletion } from '@adaptly/services/openai/utils/chatCompletion';
import { getMessageContent } from '@adaptly/services/openai/utils/getMessageContent';
import { tokenCount } from '@adaptly/services/openai/utils/tokenCount';
import { GPT35_MODEL, GPT4_MODEL, MAX_NUM_TOKENS_8K } from '@adaptly/services/openai/client';
import { getConversationContents } from '@adaptly/services/openai/utils/getConversationContents';
import { Octokit } from '@octokit/core';

export type BreakingChanges = {
    cursorVersion: string;
    changes: BreakingChange[];
};

export type BreakingChange = {
    title: string;
    description: string;
};

const breakingChangesPrompt = `You are a senior software engineer with the task to analyze the changelog of a new version of a package and find breaking changes.

A "breaking change" is an update that:
- Changes the behavior of an existing function or feature in a way that is not backward-compatible.
- Removes or deprecates an existing function or feature.

Note: Unless explicitly stated in the changelog, assume that the new or modified feature is backward compatible.

You task can be broken down into the following steps:

1. Extract the changelog content and the version from the text enclosed within <changelog> and <version> tags respectively. If a TL;DR is provided, ignore it.
2. Segment the changelog into individual updates, using cues such as headers, bullet points, or semantic indicators.
3. For each update, using the definition of "breaking change" above, identify if the update classifies as one.
4. For breaking changes, copy over the title and write a short and concise description of the change. The goal is to provide software engineers with an immediate understanding of the potential impact on their codebase, without overwhelming them with unnecessary details. 
   If possible, provide code refactoring examples using \`\`\`diff \`\`\` syntax showing before and after. 

Avoid explanations and reply with a JSON following this schema. If it's not possible to determine breaking changes,
then return "breaking_changes" as empty array "[]".

{
  "type": "object",
  "properties": {
    "breaking_changes": {
      "type": "array",
      "description": "List of breaking changes from the changelog",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "The title of the breaking change update"
          },
          "description": {
            "type": "string",
            "description": "Summary to present to a software engineer using the library in his codebase."
          }
        },
        "required": ["title", "description"]
      }
    }
  },
  "required": ["breaking_changes"]
}`;

const breakingChangesDoubleCheckPrompt = `Please review your analysis, paying close attention to the following:

- For each breaking change found, double check that is fits the provided definition of "breaking change". If it doesn't, remove it from the list.
- For each entry, confirm that the titles and descriptions are clear, concise, and would provide software engineers with an immediate understanding of the impact to their code and how to mitigate it.`;

export async function findBreakingChanges(dependencyUpdate: DependencyUpdate, octokit: Octokit): Promise<BreakingChanges> {
    let cursorVersion: string | undefined = moveCursorVersion(dependencyUpdate);

    if (dependencyUpdate.dependencyName.startsWith('@types/')) {
        return {
            cursorVersion: dependencyUpdate.cursorVersion,
            changes: [
                {
                    title: 'Adaptly ignores Type updates',
                    description: 'Types have no clear source of change logs so Adaptly does not check Type updates'
                }
            ]
        };
    }

    while (cursorVersion) {
        const breakingChanges = await extractBreakingChanges(
            dependencyUpdate.dependencyName,
            cursorVersion,
            dependencyUpdate.dependencyRepoUrl,
            octokit
        );

        if (breakingChanges.length) {
            return {
                cursorVersion: cursorVersion,
                changes: breakingChanges
            };
        }

        cursorVersion = moveCursorVersion(dependencyUpdate);
    }

    return {
        cursorVersion: dependencyUpdate.targetVersion,
        changes: []
    };
}

export async function extractBreakingChanges(
    packageName: string,
    cursorVersion: string,
    dependecyRepoUrl: string,
    octokit: Octokit
): Promise<BreakingChange[]> {
    const breakingChangesConversation: ChatCompletionRequestMessage[] = [];

    breakingChangesConversation.push({
        role: RoleSystem,
        content: `${breakingChangesPrompt}`
    });

    const changelog = await getChangelog(dependecyRepoUrl, cursorVersion, packageName, octokit);

    breakingChangesConversation.push({
        role: RoleUser,
        content: `
        <changelog>
        ${changelog}
        </changelog>
        <version>${cursorVersion}</version>`
    });

    let completionData: CreateChatCompletionResponse;

    try {
        const conversationContents = getConversationContents(breakingChangesConversation);
        const firstCheckModel = tokenCount([...conversationContents, changelog], GPT4_MODEL) < MAX_NUM_TOKENS_8K ? GPT4_MODEL : GPT35_MODEL;
        // here we need to specify function to have good JSON reply structure
        const completion = await chatCompletion(breakingChangesConversation, firstCheckModel);
        Logger.info('ChatGPT: Breaking changes extracted', { packageName, cursorVersion, breakingChanges: completion.data.choices });
        completionData = completion.data;
    } catch (error) {
        throwOpenAiError(error, breakingChangesConversation);
    }

    let breakingChanges = getBreakingChangesFromChatCompletion(completionData);

    if (breakingChanges.length > 0) {
        const modelMessage = completionData.choices[0].message;

        if (modelMessage) {
            breakingChangesConversation.push(modelMessage);
        }

        breakingChangesConversation.push({
            role: RoleSystem,
            content: `${breakingChangesDoubleCheckPrompt}`
        });

        const nextConversationContents = getConversationContents(breakingChangesConversation);
        const secondCheckModel =
            tokenCount([...nextConversationContents, JSON.stringify(completionData)], GPT4_MODEL) < MAX_NUM_TOKENS_8K ? GPT4_MODEL : GPT35_MODEL;

        const completion = await chatCompletion(breakingChangesConversation, secondCheckModel);
        Logger.info('Double check ChatGPT: Breaking changes extracted', { packageName, cursorVersion, breakingChanges: completion.data.choices });
        completionData = completion.data;
        breakingChanges = getBreakingChangesFromChatCompletion(completionData);
    }

    return breakingChanges;
}

export function getBreakingChangesFromChatCompletion(completionData: CreateChatCompletionResponse): BreakingChange[] {
    const messageContent = getMessageContent(completionData);
    const breakingChanges = parseJSON(messageContent).breaking_changes;

    if (!breakingChanges || !Array.isArray(breakingChanges)) {
        throwOpenAiError(new Error('Breaking changes falsy value received, instead array'), { breakingChanges });
    }

    return breakingChanges;
}

export function moveCursorVersion(dependencyUpdate: DependencyUpdate): string | undefined {
    const nextIndex = dependencyUpdate.intermediaryVersions.indexOf(dependencyUpdate.cursorVersion) + 1;

    if (nextIndex === dependencyUpdate.intermediaryVersions.length) {
        return undefined;
    }

    const nextCursor = dependencyUpdate.intermediaryVersions[nextIndex];
    dependencyUpdate.cursorVersion = nextCursor;

    return nextCursor;
}

const throwOpenAiError: ErrorHandler = (error: any, context?: any) => {
    Logger.error(getMessage(ADAPTLY_ERRORS.openAiFailedBreakingChanges), error, context);

    throw new OpenAiError(ADAPTLY_ERRORS.openAiFailedBreakingChanges, context);
};
