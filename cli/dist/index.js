#!/usr/bin/env node
import { jsx as _jsx } from "react/jsx-runtime";
import { render } from 'ink';
import meow from 'meow';
import { App } from './components/App.js';
const cli = meow(`
  Usage
    $ founders-agreement

  Options
    --output, -o  Output file path (default: ./founders-agreement.md)
    --format, -f  Output format: md, yaml, json (default: md)

  Examples
    $ founders-agreement
    $ founders-agreement --output ./my-agreement.md
    $ founders-agreement --format yaml
`, {
    importMeta: import.meta,
    flags: {
        output: {
            type: 'string',
            shortFlag: 'o',
            default: './founders-agreement.md',
        },
        format: {
            type: 'string',
            shortFlag: 'f',
            default: 'md',
        },
    },
});
render(_jsx(App, { outputPath: cli.flags.output, outputFormat: cli.flags.format }));
