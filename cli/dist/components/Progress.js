import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function Progress({ currentSection, totalSections, sectionName }) {
    const percentage = Math.round((currentSection / totalSections) * 100);
    const barWidth = 30;
    const filledWidth = Math.round((currentSection / totalSections) * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const filledBar = '█'.repeat(filledWidth);
    const emptyBar = '░'.repeat(emptyWidth);
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: ["Section ", currentSection, "/", totalSections, ": "] }), _jsx(Text, { bold: true, children: sectionName })] }), _jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: filledBar }), _jsx(Text, { dimColor: true, children: emptyBar }), _jsxs(Text, { dimColor: true, children: [" ", percentage, "%"] })] })] }));
}
