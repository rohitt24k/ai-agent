import { ToolCallResult } from "../../types";
import { MathPlugin } from "./mathPlugin";
import { WeatherPlugin } from "./weatherPlugin";

export class PluginManager {
  private static plugins = [MathPlugin, WeatherPlugin];

  static getPluginsDefinitions() {
    const defenitions = this.plugins.map((plugin) => plugin.getToolDetails());

    return defenitions;
  }

  static async executePlugins(
    toolCalls: Array<{ tool_name: string; args: any }>
  ): Promise<ToolCallResult[]> {
    const results: ToolCallResult[] = [];

    const toolRegistry = this.plugins.reduce((registry, plugin) => {
      registry[plugin.getName()] = plugin;
      return registry;
    }, {} as Record<string, (typeof this.plugins)[number]>);

    for (const toolCall of toolCalls) {
      let output: any;

      const toolClass =
        toolRegistry[toolCall.tool_name as keyof typeof toolRegistry];

      const result = await toolClass.execute(toolCall.args);

      results.push(result);
    }

    return results;
  }
}
