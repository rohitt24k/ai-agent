import { ToolCallResult, ToolDefinition } from "../../types";

export interface MathPluginInput {
  expression: string;
}

export class MathPlugin {
  private static readonly NAME = "math_tool";

  static getName() {
    return this.NAME;
  }

  static getToolDetails(): ToolDefinition {
    return {
      type: "function",
      function: {
        name: "math_tool",
        description: "Perform mathematical calculations",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "Mathematical expression to evaluate",
            },
          },
          required: ["expression"],
        },
      },
    };
  }

  static async execute(
    input: MathPluginInput
  ): Promise<ToolCallResult<{ expression: string }, number>> {
    const { expression } = input;

    try {
      // Sanitize and validate the expression
      const sanitized = this.sanitizeExpression(expression);

      if (!this.isValidExpression(sanitized)) {
        return {
          tool_name: "math_tool",
          success: false,
          error: "Expression contains invalid characters or syntax",
          data: {
            input,
          },
        };
      }

      // Evaluate the expression safely
      const result = this.evaluateExpression(sanitized);

      return {
        tool_name: "math_tool",
        success: true,
        data: {
          input,
          output: result,
        },
      };
    } catch (error: any) {
      return {
        tool_name: "math_tool",
        success: false,
        error: "Calculation error",
        data: {
          input,
        },
      };
    }
  }

  private static sanitizeExpression(expression: string): string {
    // Remove whitespace and normalize
    return expression.replace(/\s+/g, "").toLowerCase();
  }

  private static isValidExpression(expression: string): boolean {
    // Only allow numbers, basic operators, parentheses, and decimal points
    const validPattern = /^[0-9+\-*\/().\s%^]+$/;

    if (!validPattern.test(expression)) {
      return false;
    }

    // Check for balanced parentheses
    let parenthesesCount = 0;
    for (const char of expression) {
      if (char === "(") parenthesesCount++;
      if (char === ")") parenthesesCount--;
      if (parenthesesCount < 0) return false;
    }

    return parenthesesCount === 0;
  }

  private static evaluateExpression(expression: string): number {
    let processedExpression = expression
      .replace(/\^/g, "**")
      .replace(/(\d+(\.\d+)?)%/g, "($1/100)");

    try {
      const result = new Function(`return (${processedExpression})`)();

      if (typeof result !== "number" || !isFinite(result)) {
        throw new Error("Invalid result");
      }

      return Math.round(result * 1e6) / 1e6;
    } catch (error) {
      throw new Error("Cannot evaluate expression");
    }
  }
}
