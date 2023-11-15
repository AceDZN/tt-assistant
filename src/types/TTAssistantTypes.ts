// types/TTAssistantTypes.ts

export interface SearchGamesParams {
  endpoint: string
  params: Record<string, any>
}

export interface ToolCall {
  type: string
  function: {
    name: string
    arguments: string
  }
}

export interface RunStatus {
  status: string
  required_action?: {
    type: string
    submit_tool_outputs?: {
      tool_calls: ToolCall[]
    }
  }
}

export interface MessageForRun {
  run_id: string
  role: string
  content: {
    text: {
      value: string
    }
  }[]
}

