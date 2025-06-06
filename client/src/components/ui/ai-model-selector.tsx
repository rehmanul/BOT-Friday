import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  endpoint?: string;
}

const DEFAULT_MODELS: AIModel[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    provider: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages'
  },
  {
    id: 'local-ollama',
    name: 'Local Ollama',
    provider: 'Ollama',
    endpoint: 'http://localhost:11434/api/generate'
  }
];

interface AIModelSelectorProps {
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  onConfigureWebhook?: () => void;
}

export function AIModelSelector({ 
  selectedModel, 
  onModelChange,
  onConfigureWebhook 
}: AIModelSelectorProps) {
  const [customModels, setCustomModels] = useState<AIModel[]>([]);

  const allModels = [...DEFAULT_MODELS, ...customModels];
  const currentModel = allModels.find(model => model.id === selectedModel);

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedModel || ''} onValueChange={onModelChange}>
        <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Select AI Model" />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          {allModels.map((model) => (
            <SelectItem 
              key={model.id} 
              value={model.id || 'default'}
              className="text-white hover:bg-slate-600"
            >
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-gray-400">{model.provider}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentModel && (
        <div className="text-xs text-gray-400">
          Provider: {currentModel.provider}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onConfigureWebhook}
        className="border-slate-600 text-white hover:bg-slate-700"
      >
        <Settings className="h-4 w-4 mr-1" />
        Configure
      </Button>
    </div>
  );
}