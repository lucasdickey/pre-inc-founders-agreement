import React from 'react';
import { Box, Text } from 'ink';

interface ProgressProps {
  currentSection: number;
  totalSections: number;
  sectionName: string;
}

export function Progress({ currentSection, totalSections, sectionName }: ProgressProps) {
  const percentage = Math.round((currentSection / totalSections) * 100);
  const barWidth = 30;
  const filledWidth = Math.round((currentSection / totalSections) * barWidth);
  const emptyWidth = barWidth - filledWidth;

  const filledBar = '█'.repeat(filledWidth);
  const emptyBar = '░'.repeat(emptyWidth);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text dimColor>Section {currentSection}/{totalSections}: </Text>
        <Text bold>{sectionName}</Text>
      </Box>
      <Box>
        <Text color="cyan">{filledBar}</Text>
        <Text dimColor>{emptyBar}</Text>
        <Text dimColor> {percentage}%</Text>
      </Box>
    </Box>
  );
}
