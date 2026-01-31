import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { COFOUNDER_QUESTIONS, VESTING_TERMS, EXIT_TERMS } from '../lib/shared/interview-config.js';
export function Interview({ section, data, coFounders, onDataUpdate, onCoFounderAdd, onComplete }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [coFounderMode, setCoFounderMode] = useState(false);
    const [currentCoFounder, setCurrentCoFounder] = useState({});
    const [coFounderQuestionIndex, setCoFounderQuestionIndex] = useState(0);
    const [coFoundersToAdd, setCoFoundersToAdd] = useState(0);
    const [equityConfirmMode, setEquityConfirmMode] = useState(false);
    const [pendingCoFounders, setPendingCoFounders] = useState([]);
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
            }
            else {
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
            }
            else {
                // All co-founders collected - show equity confirmation
                setCoFounderMode(false);
                setEquityConfirmMode(true);
            }
        }
    }, [coFounderQuestionIndex, coFounderMode, currentCoFounder, coFoundersToAdd, pendingCoFounders]);
    // Handle equity confirmation
    const handleEquityConfirm = useCallback((confirmed) => {
        if (confirmed) {
            // Add all pending co-founders and complete
            pendingCoFounders.forEach(cf => onCoFounderAdd(cf));
            setPendingCoFounders([]);
            setEquityConfirmMode(false);
            onComplete();
        }
        else {
            // Reset and let them re-enter co-founders
            setPendingCoFounders([]);
            setEquityConfirmMode(false);
            setCoFounderMode(true);
            setCoFoundersToAdd(Number(data.coFounderCount) || 1);
            setCoFounderQuestionIndex(0);
            setCurrentCoFounder({});
        }
    }, [pendingCoFounders, onCoFounderAdd, onComplete, data.coFounderCount]);
    const handleSubmit = (value) => {
        if (!currentQuestion)
            return;
        let processedValue = value;
        // Process value based on type
        if (currentQuestion.type === 'number') {
            processedValue = parseFloat(value) || 0;
        }
        else if (currentQuestion.type === 'confirm') {
            processedValue = value.toLowerCase() === 'y' || value.toLowerCase() === 'yes';
        }
        if (coFounderMode) {
            setCurrentCoFounder(prev => ({ ...prev, [currentQuestion.id]: processedValue }));
            setCoFounderQuestionIndex(prev => prev + 1);
        }
        else {
            onDataUpdate({ [currentQuestion.id]: processedValue });
            // Handle co-founder count
            if (currentQuestion.id === 'coFounderCount') {
                setCoFoundersToAdd(processedValue);
            }
            // Skip conditional questions
            let nextIndex = currentQuestionIndex + 1;
            while (nextIndex < questions.length) {
                const nextQ = questions[nextIndex];
                if (shouldSkipQuestion(nextQ, { ...data, [currentQuestion.id]: processedValue })) {
                    nextIndex++;
                }
                else {
                    break;
                }
            }
            setCurrentQuestionIndex(nextIndex);
        }
        setInputValue('');
        setShowHelp(false);
    };
    const handleSelect = (item) => {
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
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: "yellow", children: "Equity Confirmation" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { children: ["Your equity: ", ceoEquity, "%"] }), pendingCoFounders.map((cf, i) => (_jsxs(Text, { children: [String(cf.name), ": ", String(cf.equity), "%"] }, i))), _jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { color: isValid ? 'green' : 'red', bold: true, children: ["Total: ", totalEquity, "%"] }), !isValid && _jsx(Text, { color: "red", children: " (should be 100%)" })] })] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { children: "Does this add up correctly? (y/n) " }), _jsx(TextInput, { value: inputValue, onChange: setInputValue, onSubmit: (val) => {
                                const confirmed = val.toLowerCase() === 'y' || val.toLowerCase() === 'yes';
                                setInputValue('');
                                handleEquityConfirm(confirmed);
                            } })] }), !isValid && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Tip: Enter 'n' to re-enter co-founder equity" }) }))] }));
    }
    if (!currentQuestion) {
        return null;
    }
    // Get relevant term explanations
    const termExplanations = section.id === 'ceo_equity' ? VESTING_TERMS
        : section.id === 'exit_scenarios' ? EXIT_TERMS
            : [];
    return (_jsxs(Box, { flexDirection: "column", children: [coFounderMode && (_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { color: "yellow", children: ["Co-founder ", pendingCoFounders.length + 1, " of ", pendingCoFounders.length + coFoundersToAdd] }) })), _jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { bold: true, children: currentQuestion.prompt }), currentQuestion.helpText && (_jsx(Text, { dimColor: true, children: " (? for help)" }))] }), showHelp && currentQuestion.helpText && (_jsx(Box, { marginBottom: 1, borderStyle: "single", borderColor: "gray", paddingX: 1, children: _jsx(Text, { dimColor: true, children: currentQuestion.helpText }) })), termExplanations.length > 0 && showHelp && (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: termExplanations.map(t => (_jsxs(Box, { children: [_jsxs(Text, { bold: true, children: [t.term, ": "] }), _jsx(Text, { dimColor: true, children: t.explanation })] }, t.term))) })), currentQuestion.type === 'select' && currentQuestion.options && (_jsx(SelectInput, { items: currentQuestion.options.map(o => ({ label: o, value: o })), onSelect: handleSelect })), currentQuestion.type === 'confirm' && (_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "(y/n) " }), _jsx(TextInput, { value: inputValue, onChange: setInputValue, onSubmit: handleSubmit })] })), (currentQuestion.type === 'text' || currentQuestion.type === 'number' || currentQuestion.type === 'date') && (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: "> " }), _jsx(TextInput, { value: inputValue, onChange: setInputValue, onSubmit: handleSubmit })] }))] }));
}
function shouldSkipQuestion(question, data) {
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
