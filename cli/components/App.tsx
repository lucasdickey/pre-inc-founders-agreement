import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Header } from './Header.js';
import { Progress } from './Progress.js';
import { Interview } from './Interview.js';
import { Summary } from './Summary.js';
import { Export } from './Export.js';
import { INTERVIEW_SECTIONS } from '../lib/shared/interview-config.js';

type AppState = 'welcome' | 'interview' | 'revision' | 'summary' | 'export' | 'done';

interface AppProps {
  outputPath: string;
  outputFormat: string;
}

export function App({ outputPath, outputFormat }: AppProps) {
  const [state, setState] = useState<AppState>('welcome');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [coFounders, setCoFounders] = useState<Array<Record<string, unknown>>>([]);

  const currentSection = INTERVIEW_SECTIONS[currentSectionIndex];
  const totalSections = INTERVIEW_SECTIONS.length;

  const handleDataUpdate = (newData: Record<string, unknown>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleCoFounderAdd = (coFounder: Record<string, unknown>) => {
    setCoFounders(prev => [...prev, coFounder]);
  };

  const handleSectionComplete = () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      setState('revision');
    }
  };

  const handleRevisionComplete = (wantsRevision: boolean, sectionToRevise?: string) => {
    if (wantsRevision && sectionToRevise) {
      const sectionIndex = INTERVIEW_SECTIONS.findIndex(s => s.id === sectionToRevise);
      if (sectionIndex >= 0) {
        setCurrentSectionIndex(sectionIndex);
        setState('interview');
      }
    } else {
      setState('summary');
    }
  };

  const handleSummaryConfirm = () => {
    setState('export');
  };

  const handleExportComplete = () => {
    setState('done');
  };

  const handleStart = () => {
    setState('interview');
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header />

      {state !== 'done' && state !== 'welcome' && (
        <Progress
          currentSection={currentSectionIndex + 1}
          totalSections={totalSections}
          sectionName={currentSection?.title || 'Complete'}
        />
      )}

      {state === 'welcome' && (
        <Welcome onStart={handleStart} />
      )}

      {state === 'interview' && currentSection && (
        <Interview
          section={currentSection}
          data={data}
          coFounders={coFounders}
          onDataUpdate={handleDataUpdate}
          onCoFounderAdd={handleCoFounderAdd}
          onComplete={handleSectionComplete}
        />
      )}

      {state === 'revision' && (
        <Revision
          data={data}
          coFounders={coFounders}
          onComplete={handleRevisionComplete}
        />
      )}

      {state === 'summary' && (
        <Summary
          data={data}
          coFounders={coFounders}
          onConfirm={handleSummaryConfirm}
        />
      )}

      {state === 'export' && (
        <Export
          data={data}
          coFounders={coFounders}
          outputPath={outputPath}
          outputFormat={outputFormat}
          onComplete={handleExportComplete}
        />
      )}

      {state === 'done' && (
        <Done outputPath={outputPath} />
      )}
    </Box>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  const [ready, setReady] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (ready) {
      const handleInput = (data: Buffer) => {
        const key = data.toString();
        if (key === '\r' || key === '\n' || key === ' ') {
          onStart();
        }
      };
      process.stdin.on('data', handleInput);
      return () => {
        process.stdin.off('data', handleInput);
      };
    }
  }, [ready, onStart]);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>
        I'll help you create a founders agreement for your company.
      </Text>
      <Text dimColor>
        This document helps you and any co-founders align on key decisions before incorporating.
      </Text>
      <Box marginTop={1}>
        <Text>We'll cover:</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2}>
        <Text>• Company information</Text>
        <Text>• Your details and equity</Text>
        <Text>• Co-founder details (if any)</Text>
        <Text>• Contributions</Text>
        <Text>• Decision-making structure</Text>
        <Text>• Exit scenarios</Text>
        <Text>• Custom terms</Text>
      </Box>
      <Box marginTop={1}>
        <Text bold color="cyan">Press Enter to start...</Text>
      </Box>
    </Box>
  );
}

interface RevisionProps {
  data: Record<string, unknown>;
  coFounders: Array<Record<string, unknown>>;
  onComplete: (wantsRevision: boolean, sectionToRevise?: string) => void;
}

function Revision({ data, coFounders, onComplete }: RevisionProps) {
  const [step, setStep] = useState<'ask' | 'select'>('ask');

  React.useEffect(() => {
    const handleInput = (inputData: Buffer) => {
      const key = inputData.toString().toLowerCase();
      if (step === 'ask') {
        if (key === 'y') {
          setStep('select');
        } else if (key === 'n' || key === '\r' || key === '\n') {
          onComplete(false);
        }
      }
    };
    process.stdin.on('data', handleInput);
    return () => {
      process.stdin.off('data', handleInput);
    };
  }, [step, onComplete]);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="yellow">Review Your Answers</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>Company: {String(data.companyName || 'Not set')}</Text>
        <Text>Your role: {String(data.ceoRole || 'Not set')}, {String(data.ceoEquity || '?')}% equity</Text>
        <Text>Co-founders: {coFounders.length}</Text>
        {coFounders.map((cf, i) => (
          <Text key={i} dimColor>  • {String(cf.name)}: {String(cf.equity)}%</Text>
        ))}
      </Box>
      <Box marginTop={1}>
        {step === 'ask' && (
          <Text>Want to revise anything? (y/n) </Text>
        )}
        {step === 'select' && (
          <Box flexDirection="column">
            <Text>Which section? (Enter number)</Text>
            {INTERVIEW_SECTIONS.map((s, i) => (
              <Text key={s.id}>{i + 1}. {s.title}</Text>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Done({ outputPath }: { outputPath: string }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="green">Agreement generated successfully.</Text>
      <Box marginTop={1}>
        <Text>Output: {outputPath}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Next steps:</Text>
        <Text>1. Share with co-founders for review</Text>
        <Text>2. Each co-founder signs to confirm</Text>
        <Text>3. Consult with a startup attorney</Text>
        <Text>4. Formalize into a legal agreement</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>This is a preliminary alignment tool, not legal advice.</Text>
      </Box>
    </Box>
  );
}
