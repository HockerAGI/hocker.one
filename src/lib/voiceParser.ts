export type ParsedCommand =
  | {
      type: "create_command";
      command: string;
      payload: Record<string, unknown>;
    }
  | {
      type: "chat";
      message: string;
    };

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, " ");
}

function hasAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function parseVoice(input: string): ParsedCommand {
  const text = normalize(input);

  if (!text) {
    return {
      type: "chat",
      message: input,
    };
  }

  if (
    hasAny(text, [
      "crear comando",
      "generar comando",
      "nuevo comando",
      "emite comando",
      "lanzar comando",
    ])
  ) {
    return {
      type: "create_command",
      command: "system.manual",
      payload: {
        source: "voice",
        raw: input,
      },
    };
  }

  if (
    hasAny(text, [
      "orden supply",
      "crear orden",
      "crear pedido",
      "nuevo pedido",
      "pedido supply",
    ])
  ) {
    return {
      type: "create_command",
      command: "supply.create_order",
      payload: {
        source: "voice",
        raw: input,
      },
    };
  }

  if (hasAny(text, ["activar nodo", "encender nodo", "levantar nodo"])) {
    return {
      type: "create_command",
      command: "node.activate",
      payload: {
        source: "voice",
        raw: input,
      },
    };
  }

  if (hasAny(text, ["apagar nodo", "desactivar nodo", "bajar nodo"])) {
    return {
      type: "create_command",
      command: "node.deactivate",
      payload: {
        source: "voice",
        raw: input,
      },
    };
  }

  return {
    type: "chat",
    message: input,
  };
}