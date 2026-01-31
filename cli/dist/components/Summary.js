import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
export function Summary({ data, coFounders, onConfirm }) {
    const [confirmed, setConfirmed] = useState(false);
    useEffect(() => {
        const handleInput = (inputData) => {
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
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "\u2550\u2550\u2550 Agreement Summary \u2550\u2550\u2550" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Company" }), _jsxs(Text, { children: ["  Name: ", String(data.companyName || 'Not set')] }), _jsxs(Text, { children: ["  Description: ", String(data.companyDescription || 'Not set')] }), _jsxs(Text, { children: ["  Stage: ", String(data.companyStage || 'Not set')] })] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Founders" }), _jsxs(Text, { children: ["  ", String(data.ceoName), " (", String(data.ceoRole), ")"] }), _jsxs(Text, { children: ["    Equity: ", ceoEquity, "%"] }), _jsxs(Text, { children: ["    Vesting: ", String(data.ceoVestingPeriod), "mo / ", String(data.ceoCliffPeriod), "mo cliff"] }), _jsxs(Text, { children: ["    Acceleration: ", String(data.ceoAcceleration)] }), coFounders.map((cf, i) => (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { children: ["  ", String(cf.name), " (", String(cf.role), ")"] }), _jsxs(Text, { children: ["    Equity: ", String(cf.equity), "%"] }), _jsxs(Text, { children: ["    Vesting: ", cf.vestingMatch ? 'Matches CEO' : 'Custom'] })] }, i))), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: totalEquity === 100 ? 'green' : 'red', children: ["Total Equity: ", totalEquity, "% ", totalEquity !== 100 && '(should be 100%)'] }) })] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Decision Making" }), _jsxs(Text, { children: ["  Day-to-day: ", String(data.dayToDay || 'Not set')] }), _jsxs(Text, { children: ["  Deadlock: ", String(data.deadlockResolution || 'Not set')] })] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Exit Terms" }), _jsxs(Text, { children: ["  Non-compete: ", String(data.nonCompeteDuration || '?'), " months"] }), _jsxs(Text, { children: ["  Sale acceleration: ", String(data.saleAcceleration || 'Not set')] })] }), !confirmed && (_jsx(Box, { marginTop: 2, children: _jsx(Text, { bold: true, color: "yellow", children: "Ready to generate agreement? (y/n) " }) }))] }));
}
