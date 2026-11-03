const { callMistralOnce } = require("./mistral");
const { executeTool } = require("../config/tools");

const MAX_TOOL_STEPS = 4;

async function runToolLoop({ models, messages, tools, temperature, maxTokens, onToolCall, onToolResult, toolContext = {} }) {
    let workingMessages = [...messages];
    const context = { ...toolContext };
    const modelList = Array.isArray(models) ? models : [models];

    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
        let lastError = null;
        let result = null;

        for (const modelName of modelList) {
            try {
                result = await callMistralOnce({
                    model: modelName,
                    messages: workingMessages,
                    tools,
                    temperature,
                    maxTokens
                });
                break;
            } catch (e) {
                lastError = e;
                console.error(`[agent] Modèle ${modelName} échoué :`, e.message.slice(0, 150));
            }
        }

        if (!result) {
            throw lastError || new Error("Aucun modèle n'a pu répondre.");
        }

        const { message, finishReason, usage } = result;

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

                const resultTool = await executeTool(toolName, toolArgs, context);

                if ((toolName === "generate_image" || toolName === "edit_image") && resultTool && resultTool.base64) {
                    context.lastImageBase64 = resultTool.base64;
                    context.lastImageMimeType = resultTool.mimeType;
                }

                if (onToolResult) {
                    onToolResult({ name: toolName, result: resultTool });
                }

                const modelFacingResult = resultTool.base64
                    ? { success: true, type: resultTool.type, note: "Média généré et envoyé automatiquement à l'utilisateur." }
                    : resultTool;

                workingMessages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: toolName,
                    content: JSON.stringify(modelFacingResult)
                });
            }
            continue;
        }

        return {
            content: message.content || "",
            finishReason,
            usage,
            toolsUsed: step > 0,
            lastImageBase64: context.lastImageBase64 || toolContext.lastImageBase64 || null,
            lastImageMimeType: context.lastImageMimeType || toolContext.lastImageMimeType || null
        };
    }

    return {
        content: "Je n'ai pas réussi à obtenir une réponse claire après plusieurs recherches. Peux-tu reformuler ta question ?",
        finishReason: "length",
        usage: null,
        toolsUsed: true,
        lastImageBase64: context.lastImageBase64 || toolContext.lastImageBase64 || null,
        lastImageMimeType: context.lastImageMimeType || toolContext.lastImageMimeType || null
    };
}

module.exports = { runToolLoop };