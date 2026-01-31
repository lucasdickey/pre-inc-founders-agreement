import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import type { InterviewSection, InterviewQuestion } from '../lib/shared/interview-config.js';
import { COFOUNDER_QUESTIONS, VESTING_TERMS, EXIT_TERMS } from '../lib/shared/interview-config.js';

interface InterviewProps {
  section: InterviewSection;
  data: Record<string, unknown>;
  coFounders: Array<Record<string, unknown>>;
  onDataUpdate: (data: Record<string, unknown>) => void;
  onCoFounderAdd: (coFounder: Record<string, unknown>) => void;
  onComplete: () => void;
}

export function Interview({ section, data, coFounders, onDataUpdate, onCoFounderAdd, onComplete }: InterviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [coFounderMode, setCoFounderMode] = useState(false);
  const [currentCoFounder, setCurrentCoFounder] = useState<Record<string, unknown>>({});
  const [coFounderQuestionIndex, setCoFounderQuestionIndex] = useState(0);
  const [coFoundersToAdd, setCoFoundersToAdd] = useState(0);
  const [equityConfirmMode, setEquityConfirmMode] = useState(false);
  const [pendingCoFounders, setPendingCoFounders] = useState<Array<Record<string, unknown>>>([]);

  const questions = section.questions;
  const currentQuestion = coFounderMode
    ? COFOUNDER_QUESTIONS[coFounderQuestionIndex]
    : questions[currentQuestionIndex];

  // Handle section completion
  useEffect(() => {
    if (!coFounderMode && currentQuestionIndex >= questions.length) {
      // Check if we need to add co-founders
      if (section.id === 'cofounders' && data.hasCoFounders && coFoundersToAdd > 0) {
        setCoFounderMode(true);
        setCoFounderQuestionIndex(0);
        setCurrentCoFounder({});
      } else {
        onComplete();
      }
    }
  }, [currentQuestionIndex, questions.length, coFounderMode, section.id, data.hasCoFounders, coFoundersToAdd, onComplete]);

  // Handle co-founder mode completion
  useEffect(() => {
    if (coFounderMode && coFounderQuestionIndex >= COFOUNDER_QUESTIONS.length) {
      const newPending = [...pendingCoFounders, currentCoFounder];
      setPendingCoFounders(newPending);
      const remaining = coFoundersToAdd - 1;
      setCoFoundersToAdd(remaining);

      if (remaining > 0) {
        setCoFounderQuestionIndex(0);
        setCurrentCoFounder({});
      } else {
        // All co-founders collected - show equity confirmation
        setCoFounderMode(false);
        setEquityConfirmMode(true);
      }
    }
  }, [coFounderQuestionIndex, coFounderMode, currentCoFounder, coFoundersToAdd, pendingCoFounders]);

  // Handle equity confirmation
  const handleEquityConfirm = useCallback((confirmed: boolean) => {
    if (confirmed) {
      // Add all pending co-founders and complete
      pendingCoFounders.forEach(cf => onCoFounderAdd(cf));
      setPendingCoFounders([]);
      setEquityConfirmMode(false);
      onComplete();
    } else {
      // Reset and let them re-enter co-founders
      setPendingCoFounders([]);
      setEquityConfirmMode(false);
      setCoFounderMode(true);
      setCoFoundersToAdd(Number(data.coFounderCount) || 1);
      setCoFounderQuestionIndex(0);
      setCurrentCoFounder({});
    }
  }, [pendingCoFounders, onCoFounderAdd, onComplete, data.coFounderCount]);

  const handleSubmit = (value: string) => {
    if (!currentQuestion) return;

    let processedValue: unknown = value;

    // Process value based on type
    if (currentQuestion.type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (currentQuestion.type === 'confirm') {
      processedValue = value.toLowerCase() === 'y' || value.toLowerCase() === 'yes';
    }

    if (coFounderMode) {
      setCurrentCoFounder(prev => ({ ...prev, [currentQuestion.id]: processedValue }));
      setCoFounderQuestionIndex(prev => prev + 1);
    } else {
      onDataUpdate({ [currentQuestion.id]: processedValue });

      // Handle co-founder count
      if (currentQuestion.id === 'coFounderCount') {
        setCoFoundersToAdd(processedValue as number);
      }

      // Skip conditional questions
      let nextIndex = currentQuestionIndex + 1;
      while (nextIndex < questions.length) {
        const nextQ = questions[nextIndex];
        if (shouldSkipQuestion(nextQ, { ...data, [currentQuestion.id]: processedValue })) {
          nextIndex++;
        } else {
          break;
        }
      }
      setCurrentQuestionIndex(nextIndex);
    }

    setInputValue('');
    setShowHelp(false);
  };

  const handleSelect = (item: { value: string }) => {
    handleSubmit(item.value);
  };

  useInput((input, key) => {
    if (input === '?' && currentQuestion?.helpText) {
      setShowHelp(!showHelp);
    }
    if (key.escape) {
      setShowHelp(false);
    }
  });

  // Equity confirmation mode
  if (equityConfirmMode) {
    const ceoEquity = Number(data.ceoEquity) || 0;
    const coFounderEquity = pendingCoFounders.reduce((sum, cf) => sum + (Number(cf.equity) || 0), 0);
    const totalEquity = ceoEquity + coFounderEquity;
    const isValid = totalEquity === 100;

    return (
      <Box flexDirection="column">
        <Text bold color="yellow">Equity Confirmation</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>Your equity: {ceoEquity}%</Text>
          {pendingCoFounders.map((cf, i) => (
            <Text key={i}>{String(cf.name)}: {String(cf.equity)}%</Text>
          ))}
          <Box marginTop={1}>
            <Text color={isValid ? 'green' : 'red'} bold>
              Total: {totalEquity}%
            </Text>
            {!isValid && <Text color="red"> (should be 100%)</Text>}
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text>Does this add up correctly? (y/n) </Text>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={(val) => {
              const confirmed = val.toLowerCase() === 'y' || val.toLowerCase() === 'yes';
              setInputValue('');
              handleEquityConfirm(confirmed);
            }}
          />
        </Box>
        {!isValid && (
          <Box marginTop={1}>
            <Text dimColor>Tip: Enter 'n' to re-enter co-founder equity</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  // Get relevant term explanations
  const termExplanations = section.id === 'ceo_equity' ? VESTING_TERMS
    : section.id === 'exit_scenarios' ? EXIT_TERMS
    : [];

  return (
    <Box flexDirection="column">
      {coFounderMode && (
        <Box marginBottom={1}>
          <Text color="yellow">
            Co-founder {pendingCoFounders.length + 1} of {pendingCoFounders.length + coFoundersToAdd}
          </Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text bold>{currentQuestion.prompt}</Text>
        {currentQuestion.helpText && (
          <Text dimColor> (? for help)</Text>
        )}
      </Box>

      {showHelp && currentQuestion.helpText && (
        <Box marginBottom={1} borderStyle="single" borderColor="gray" paddingX={1}>
          <Text dimColor>{currentQuestion.helpText}</Text>
        </Box>
      )}

      {termExplanations.length > 0 && showHelp && (
        <Box flexDirection="column" marginBottom={1}>
          {termExplanations.map(t => (
            <Box key={t.term}>
              <Text bold>{t.term}: </Text>
              <Text dimColor>{t.explanation}</Text>
            </Box>
          ))}
        </Box>
      )}

      {currentQuestion.type === 'select' && currentQuestion.options && (
        <SelectInput
          items={currentQuestion.options.map(o => ({ label: o, value: o }))}
          onSelect={handleSelect}
        />
      )}

      {currentQuestion.type === 'confirm' && (
        <Box>
          <Text dimColor>(y/n) </Text>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
          />
        </Box>
      )}

      {(currentQuestion.type === 'text' || currentQuestion.type === 'number' || currentQuestion.type === 'date') && (
        <Box>
          <Text color="cyan">&gt; </Text>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
          />
        </Box>
      )}
    </Box>
  );
}

function shouldSkipQuestion(question: InterviewQuestion, data: Record<string, unknown>): boolean {
  // Skip co-founder count if no co-founders
  if (question.id === 'coFounderCount' && !data.hasCoFounders) {
    return true;
  }
  // Skip IP details if no IP
  if ((question.id === 'ipDescription' || question.id === 'ipValue' || question.id === 'ipPreExisting') && !data.hasIP) {
    return true;
  }
  // Skip capital amount if no capital
  if (question.id === 'capitalAmount' && !data.hasCapital) {
    return true;
  }
  // Skip equipment details if no equipment
  if ((question.id === 'equipmentDescription' || question.id === 'equipmentPreExisting') && !data.hasEquipment) {
    return true;
  }
  // Skip sweat equity details if no sweat equity
  if ((question.id === 'sweatEquityDescription' || question.id === 'sweatEquityValue') && !data.hasSweatEquity) {
    return true;
  }
  return false;
}
