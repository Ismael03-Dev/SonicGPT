const { callMistralOnce } = require("./mistral");
const { executeTool } = require("../config/tools");

const MAX_TOOL_STEPS = 4;

async function runToolLoop({ model, messages, tools, temperature, maxTokens, onToolCall, onToolResult }) {
    let workingMessages = [...messages];

    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
        const { message, finishReason, usage } = await callMistralOnce({
            model,
            messages: workingMessages,
            tools,
            temperature,
            maxTokens
        });

        if (message.tool_calls && message.tool_calls.length > 0) {
            workingMessages.push({
                role: "assistant",
                content: message.content || null,
                tool_calls: message.tool_calls
            });

            for (const toolCall of message.tool_calls) {
                const toolName = toolCall.function.name;
                const toolArgs = toolCall.function.arguments;

                if (onToolCall) {
                    let parsedArgs = {};
                    try {
                        parsedArgs = JSON.parse(toolArgs || "{}");
                    } catch (e) {
                        parsedArgs = {};
                    }
                    onToolCall({ name: toolName, args: parsedArgs });
                }

                const result = await executeTool(toolName, toolArgs);

                if (onToolResult) {
                    onToolResult({ name: toolName, result });
                }

                workingMessages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: toolName,
                    content: JSON.stringify(result)
                });
            }
            continue;
        }

        return {
            content: message.content || "",
            finishReason,
            usage,
            toolsUsed: step > 0
        };
    }

    return {
        content: "Je n'ai pas réussi à obtenir une réponse claire après plusieurs recherches. Peux-tu reformuler ta question ?",
        finishReason: "length",
        usage: null,
        toolsUsed: true
    };
}

module.exports = { runToolLoop };
