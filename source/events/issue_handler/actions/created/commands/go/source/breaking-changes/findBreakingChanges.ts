import { getChangelog } from '@adaptly/services/adaptly/changelogHunter';
import Logger, { getMessage } from '@adaptly/logging/logger';
import { ChatCompletionRequestMessage, CreateChatCompletionResponse } from 'openai';
import { DependencyUpdate } from '@adaptly/events/issue_handler/actions/created/commands/go/source/pr-dependencies/getDependenciesUpdated';
import { openai, MAX_NUM_TOKENS, MODEL, GPT4_MODEL } from '@adaptly/services/openai/client';
import { RoleSystem, RoleUser } from '@adaptly/services/openai/types';
import { ErrorHandler, OpenAiError } from '@adaptly/errors/types';
import { ADAPTLY_ERRORS } from '@adaptly/errors';
import { parseJSON } from '@adaptly/utils/json/parseJson';
import { chatCompletion } from '@adaptly/services/openai/utils/chatCompletion';
import { getMessageContent } from '@adaptly/services/openai/utils/getMessageContent';

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
- Changes the behavior of an existing function or feature in a way that is not backward-compatible. This could be changes to method signatures, return values, or exception types, etc.
- Removes or deprecates an existing function or feature.

Note: Unless explicitly stated in the changelog, assume that the new or modified feature is backward compatible.

You task can be broken down into the following steps:

1. Extract the changelog content and the version from the text enclosed within <changelog> and <version> tags respectively. If a TL;DR is provided, ignore it.
2. Segment the changelog into individual updates, using cues such as headers, bullet points, or semantic indicators.
3. For each update, using the definition of "breaking change" above, identify if the update classifies as one.
4. For breaking changes, copy over the title and write a short and concise description of the change. The goal is to provide software engineers with an immediate understanding of the potential impact on their codebase, without overwhelming them with unnecessary details. 
   If possible, provide code refactoring examples using \`\`\`diff \`\`\` syntax showing before and after. 

Avoid explanations and reply with a JSON following this schema:

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

const breakingChangesDoubleCheckPrompt = ``;

export async function findBreakingChanges(dependencyUpdate: DependencyUpdate): Promise<BreakingChanges> {
    let cursorVersion: string | undefined = moveCursorVersion(dependencyUpdate);

    while (cursorVersion) {
        const breakingChanges = await extractBreakingChanges(dependencyUpdate.dependencyName, cursorVersion, dependencyUpdate.dependencyRepoUrl);

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

async function extractBreakingChanges(packageName: string, cursorVersion: string, dependecyRepoUrl: string): Promise<BreakingChange[]> {
    const breakingChangesConversation: ChatCompletionRequestMessage[] = [];

    breakingChangesConversation.push({
        role: RoleSystem,
        content: `${breakingChangesPrompt}`
    });

    const changelog = await getChangelog(dependecyRepoUrl, cursorVersion);

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
        // here we need to specify function to have good JSON reply structure
        const completion = await chatCompletion(breakingChangesConversation, MODEL);

        Logger.info('ChatGPT: Breaking changes extracted', { packageName, cursorVersion, breakingChanges: completion.data.choices });

        completionData = completion.data;
    } catch (error) {
        throwOpenAiError(error, breakingChangesConversation);
    }

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
