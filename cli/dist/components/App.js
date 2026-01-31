import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Header } from './Header.js';
import { Progress } from './Progress.js';
import { Interview } from './Interview.js';
import { Summary } from './Summary.js';
import { Export } from './Export.js';
import { INTERVIEW_SECTIONS } from '../lib/shared/interview-config.js';
export function App({ outputPath, outputFormat }) {
    const [state, setState] = useState('welcome');
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [data, setData] = useState({});
    const [coFounders, setCoFounders] = useState([]);
    const currentSection = INTERVIEW_SECTIONS[currentSectionIndex];
    const totalSections = INTERVIEW_SECTIONS.length;
    const handleDataUpdate = (newData) => {
        setData(prev => ({ ...prev, ...newData }));
    };
    const handleCoFounderAdd = (coFounder) => {
        setCoFounders(prev => [...prev, coFounder]);
    };
    const handleSectionComplete = () => {
        if (currentSectionIndex < totalSections - 1) {
            setCurrentSectionIndex(prev => prev + 1);
        }
        else {
            setState('revision');
        }
    };
    const handleRevisionComplete = (wantsRevision, sectionToRevise) => {
        if (wantsRevision && sectionToRevise) {
            const sectionIndex = INTERVIEW_SECTIONS.findIndex(s => s.id === sectionToRevise);
            if (sectionIndex >= 0) {
                setCurrentSectionIndex(sectionIndex);
                setState('interview');
            }
        }
        else {
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
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Header, {}), state !== 'done' && state !== 'welcome' && (_jsx(Progress, { currentSection: currentSectionIndex + 1, totalSections: totalSections, sectionName: currentSection?.title || 'Complete' })), state === 'welcome' && (_jsx(Welcome, { onStart: handleStart })), state === 'interview' && currentSection && (_jsx(Interview, { section: currentSection, data: data, coFounders: coFounders, onDataUpdate: handleDataUpdate, onCoFounderAdd: handleCoFounderAdd, onComplete: handleSectionComplete })), state === 'revision' && (_jsx(Revision, { data: data, coFounders: coFounders, onComplete: handleRevisionComplete })), state === 'summary' && (_jsx(Summary, { data: data, coFounders: coFounders, onConfirm: handleSummaryConfirm })), state === 'export' && (_jsx(Export, { data: data, coFounders: coFounders, outputPath: outputPath, outputFormat: outputFormat, onComplete: handleExportComplete })), state === 'done' && (_jsx(Done, { outputPath: outputPath }))] }));
}
function Welcome({ onStart }) {
    const [ready, setReady] = useState(false);
    React.useEffect(() => {
        const timer = setTimeout(() => setReady(true), 100);
        return () => clearTimeout(timer);
    }, []);
    React.useEffect(() => {
        if (ready) {
            const handleInput = (data) => {
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
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { children: "I'll help you create a founders agreement for your company." }), _jsx(Text, { dimColor: true, children: "This document helps you and any co-founders align on key decisions before incorporating." }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "We'll cover:" }) }), _jsxs(Box, { flexDirection: "column", marginLeft: 2, children: [_jsx(Text, { children: "\u2022 Company information" }), _jsx(Text, { children: "\u2022 Your details and equity" }), _jsx(Text, { children: "\u2022 Co-founder details (if any)" }), _jsx(Text, { children: "\u2022 Contributions" }), _jsx(Text, { children: "\u2022 Decision-making structure" }), _jsx(Text, { children: "\u2022 Exit scenarios" }), _jsx(Text, { children: "\u2022 Custom terms" })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { bold: true, color: "cyan", children: "Press Enter to start..." }) })] }));
}
function Revision({ data, coFounders, onComplete }) {
    const [step, setStep] = useState('ask');
    React.useEffect(() => {
        const handleInput = (inputData) => {
            const key = inputData.toString().toLowerCase();
            if (step === 'ask') {
                if (key === 'y') {
                    setStep('select');
                }
                else if (key === 'n' || key === '\r' || key === '\n') {
                    onComplete(false);
                }
            }
        };
        process.stdin.on('data', handleInput);
        return () => {
            process.stdin.off('data', handleInput);
        };
    }, [step, onComplete]);
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: "yellow", children: "Review Your Answers" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { children: ["Company: ", String(data.companyName || 'Not set')] }), _jsxs(Text, { children: ["Your role: ", String(data.ceoRole || 'Not set'), ", ", String(data.ceoEquity || '?'), "% equity"] }), _jsxs(Text, { children: ["Co-founders: ", coFounders.length] }), coFounders.map((cf, i) => (_jsxs(Text, { dimColor: true, children: ["  \u2022 ", String(cf.name), ": ", String(cf.equity), "%"] }, i)))] }), _jsxs(Box, { marginTop: 1, children: [step === 'ask' && (_jsx(Text, { children: "Want to revise anything? (y/n) " })), step === 'select' && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { children: "Which section? (Enter number)" }), INTERVIEW_SECTIONS.map((s, i) => (_jsxs(Text, { children: [i + 1, ". ", s.title] }, s.id)))] }))] })] }));
}
function Done({ outputPath }) {
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { bold: true, color: "green", children: "Agreement generated successfully." }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { children: ["Output: ", outputPath] }) }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Next steps:" }), _jsx(Text, { children: "1. Share with co-founders for review" }), _jsx(Text, { children: "2. Each co-founder signs to confirm" }), _jsx(Text, { children: "3. Consult with a startup attorney" }), _jsx(Text, { children: "4. Formalize into a legal agreement" })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "This is a preliminary alignment tool, not legal advice." }) })] }));
}
