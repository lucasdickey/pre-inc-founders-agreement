import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface SummaryProps {
  data: Record<string, unknown>;
  coFounders: Array<Record<string, unknown>>;
  onConfirm: () => void;
}

export function Summary({ data, coFounders, onConfirm }: SummaryProps) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const handleInput = (inputData: Buffer) => {
      const key = inputData.toString().toLowerCase();
      if (key === 'y' || key === '\r' || key === '\n') {
        setConfirmed(true);
        onConfirm();
      }
    };
    process.stdin.on('data', handleInput);
    return () => {
      process.stdin.off('data', handleInput);
    };
  }, [onConfirm]);

  // Calculate total equity
  const ceoEquity = Number(data.ceoEquity) || 0;
  const coFounderEquity = coFounders.reduce((sum, cf) => sum + (Number(cf.equity) || 0), 0);
  const totalEquity = ceoEquity + coFounderEquity;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color="cyan">═══ Agreement Summary ═══</Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Company</Text>
        <Text>  Name: {String(data.companyName || 'Not set')}</Text>
        <Text>  Description: {String(data.companyDescription || 'Not set')}</Text>
        <Text>  Stage: {String(data.companyStage || 'Not set')}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Founders</Text>
        <Text>  {String(data.ceoName)} ({String(data.ceoRole)})</Text>
        <Text>    Equity: {ceoEquity}%</Text>
        <Text>    Vesting: {String(data.ceoVestingPeriod)}mo / {String(data.ceoCliffPeriod)}mo cliff</Text>
        <Text>    Acceleration: {String(data.ceoAcceleration)}</Text>

        {coFounders.map((cf, i) => (
          <Box key={i} flexDirection="column" marginTop={1}>
            <Text>  {String(cf.name)} ({String(cf.role)})</Text>
            <Text>    Equity: {String(cf.equity)}%</Text>
            <Text>    Vesting: {cf.vestingMatch ? 'Matches CEO' : 'Custom'}</Text>
          </Box>
        ))}

        <Box marginTop={1}>
          <Text color={totalEquity === 100 ? 'green' : 'red'}>
            Total Equity: {totalEquity}% {totalEquity !== 100 && '(should be 100%)'}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Decision Making</Text>
        <Text>  Day-to-day: {String(data.dayToDay || 'Not set')}</Text>
        <Text>  Deadlock: {String(data.deadlockResolution || 'Not set')}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Exit Terms</Text>
        <Text>  Non-compete: {String(data.nonCompeteDuration || '?')} months</Text>
        <Text>  Sale acceleration: {String(data.saleAcceleration || 'Not set')}</Text>
      </Box>

      {!confirmed && (
        <Box marginTop={2}>
          <Text bold color="yellow">Ready to generate agreement? (y/n) </Text>
        </Box>
      )}
    </Box>
  );
}
