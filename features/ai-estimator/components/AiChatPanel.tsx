'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createChatMessage } from '@/lib/ai-estimator/chat-responses';
import { askAiEstimatorAction } from '@/services/ai-estimator/ai-estimator-actions';
import type { AiChatMessage, AiEstimatePlan } from '@/types/ai-estimator';

interface AiChatPanelProps {
  projectId: string;
  plan: AiEstimatePlan | null;
}

const STARTER_QUESTIONS = [
  'Explain the WBS structure',
  'How were quantities calculated?',
  'Any scope issues?',
  'Which rates are AI estimated?',
];

export function AiChatPanel({
  projectId,
  plan,
}: AiChatPanelProps): React.JSX.Element {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    createChatMessage(
      'assistant',
      'I am your construction estimating copilot. Generate a plan or ask about WBS, BOQ, quantities, rates, and scope.'
    ),
  ]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function sendQuestion(question: string): Promise<void> {
    const trimmed = question.trim();
    if (!trimmed || isSending) {
      return;
    }

    setMessages((current) => [...current, createChatMessage('user', trimmed)]);
    setDraft('');
    setIsSending(true);

    try {
      const result = await askAiEstimatorAction(projectId, trimmed, plan);
      setMessages((current) => [
        ...current,
        createChatMessage(
          'assistant',
          result.success
            ? (result.answer ?? 'No answer available.')
            : (result.error ?? 'Failed to get a response.')
        ),
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Chat
        </CardTitle>
        <CardDescription>
          Ask about WBS, BOQ, quantities, rates, scope, and assumptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-[320px] flex-1 flex-col gap-3">
        <div className="flex-1 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === 'user'
                  ? 'ml-8 rounded-lg bg-primary/10 px-3 py-2 text-sm'
                  : 'mr-8 rounded-lg border bg-background px-3 py-2 text-sm'
              }
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {STARTER_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
              onClick={() => void sendQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion(draft);
          }}
        >
          <Input
            value={draft}
            placeholder="Ask the copilot…"
            onChange={(event) => setDraft(event.target.value)}
            disabled={isSending}
          />
          <Button type="submit" size="icon" disabled={isSending || !draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
