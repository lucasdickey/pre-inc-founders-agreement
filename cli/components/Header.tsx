import React from 'react';
import { Box, Text } from 'ink';

export function Header() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="magenta">
        ┌─────────────────────────────────────────┐
      </Text>
      <Text bold color="magenta">
        │   Founders Agreement Assistant         │
      </Text>
      <Text bold color="magenta">
        │   Pre-Incorporation Tool               │
      </Text>
      <Text bold color="magenta">
        └─────────────────────────────────────────┘
      </Text>
    </Box>
  );
}
