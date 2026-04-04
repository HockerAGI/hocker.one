export type ParsedCommand =
  | {
      type: 'create_command';
      command: string;
      payload: Record<string, unknown>;
    }
  | {
      type: 'chat';
      message: string;
    };

export function parseVoice(input: string): ParsedCommand {
  const text = input.toLowerCase();

  if (text.includes('crear comando')) {
    return {
      type: 'create_command',
      command: 'system.manual',
      payload: { raw: input },
    };
  }

  if (text.includes('orden') || text.includes('crear orden')) {
    return {
      type: 'create_command',
      command: 'supply.create_order',
      payload: { raw: input },
    };
  }

  if (text.includes('activar nodo')) {
    return {
      type: 'create_command',
      command: 'node.activate',
      payload: { raw: input },
    };
  }

  return {
    type: 'chat',
    message: input,
  };
}