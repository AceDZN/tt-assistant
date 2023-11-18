// components/AssistantForm.tsx
import React from 'react'

type AssistantFormProps = {
  prompt: string
  onPromptChange: (newValue: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  shouldGenerateTTS: boolean
  onGenerateTTSChange: (newState: boolean) => void
  shouldPlayTTS: boolean
  onPlayTTSChange: (newState: boolean) => void
  gameStartAlert: string
}

const AssistantForm: React.FC<AssistantFormProps> = ({
  prompt,
  onPromptChange,
  onSubmit,
  shouldGenerateTTS,
  onGenerateTTSChange,
  shouldPlayTTS,
  onPlayTTSChange,
  gameStartAlert,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <textarea
        className="w-full p-2 border border-gray-300 rounded text-blue-900"
        rows={4}
        placeholder="Enter your prompt"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Submit
      </button>
      <div>
        <label>
          <input type="checkbox" checked={shouldGenerateTTS} onChange={(e) => onGenerateTTSChange(e.target.checked)} />
          Generate TTS
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            disabled={!shouldGenerateTTS}
            checked={shouldPlayTTS && shouldGenerateTTS}
            onChange={(e) => onPlayTTSChange(e.target.checked)}
          />
          Play TTS
        </label>
      </div>
      <div className="p-2 border border-gray-300 rounded">
        {gameStartAlert && <p className="text-green-600">{gameStartAlert}</p>}
        <p>{prompt}</p>
      </div>
      <button
        type="button"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => onPromptChange('')}
      >
        Delete History
      </button>
    </form>
  )
}

export default AssistantForm

