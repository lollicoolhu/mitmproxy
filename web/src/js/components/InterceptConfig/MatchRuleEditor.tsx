import * as React from "react";
import type { MatchCriterion } from "../../ducks/ui/intercept";
import Button from "../common/Button";

interface Props {
    title: string;
    criteria: MatchCriterion[];
    onChange: (criteria: MatchCriterion[]) => void;
    placeholder?: string;
}

export default function MatchRuleEditor({ title, criteria, onChange, placeholder }: Props) {
    const stopKeyPropagation = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    const addCriterion = () => {
        onChange([...criteria, { key: "", operator: "eq", value: "", logic: criteria.length > 0 ? "and" : undefined }]);
    };

    const updateCriterion = (index: number, patch: Partial<MatchCriterion>) => {
        const next = [...criteria];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    const removeCriterion = (index: number) => {
        onChange(criteria.filter((_, i) => i !== index));
    };

    return (
        <div className="match-rule-editor">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', margin: 0, padding: 0, display: 'flex', alignItems: 'center', height: '24px' }}>{title}</label>
                <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                    <Button className="btn-xs" icon="fa-plus" onClick={addCriterion}>
                        Add
                    </Button>
                </div>
            </div>
            <div onKeyDownCapture={stopKeyPropagation} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px', background: '#fff' }}>
                {criteria.length === 0 && (
                    <div style={{ color: '#ccc', fontSize: '11px', fontStyle: 'italic', padding: '8px', textAlign: 'center' }}>
                        No {title.toLowerCase()} criteria added.
                    </div>
                )}
                {criteria.map((c, i) => (
                    <div key={i} className="match-criterion-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: i < criteria.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        {/* Logic Operator (IF/AND/OR) */}
                        <div style={{ width: '55px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {i === 0 ? (
                                <div style={{ fontSize: '11px', color: '#999', fontWeight: 'bold' }}>IF</div>
                            ) : (
                                <select 
                                    className="form-control" 
                                    style={{ height: '26px', fontSize: '10px', padding: '0 4px' }}
                                    value={c.logic || "and"}
                                    onChange={e => updateCriterion(i, { logic: e.target.value })}
                                >
                                    <option value="and">AND</option>
                                    <option value="or">OR</option>
                                </select>
                            )}
                        </div>
                        
                        {/* Key Input */}
                        <span style={{ flex: 1, minWidth: '0' }}>
                            <input
                                type="text"
                                className="form-control"
                                style={{ height: '26px', fontSize: '11px' }}
                                placeholder={placeholder || "Key"}
                                value={c.key}
                                onChange={e => updateCriterion(i, { key: e.target.value })}
                            />
                        </span>
                        
                        {/* Operator Select */}
                        <span style={{ width: '70px', flexShrink: 0 }}>
                            <select
                                className="form-control"
                                style={{ height: '26px', fontSize: '10px', padding: '0 4px' }}
                                value={c.operator}
                                onChange={e => updateCriterion(i, { operator: e.target.value })}
                            >
                                <option value="eq">==</option>
                                <option value="neq">!=</option>
                                <option value="contains">~</option>
                                <option value="exists">exists</option>
                            </select>
                        </span>
                        
                        {/* Value Input (hidden for 'exists' operator) */}
                        {c.operator !== "exists" && (
                            <span style={{ flex: 1.5, minWidth: '0' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ height: '26px', fontSize: '11px' }}
                                    placeholder="Value"
                                    value={c.value}
                                    onChange={e => updateCriterion(i, { value: e.target.value })}
                                />
                            </span>
                        )}
                        
                        {/* Delete Button */}
                        <button 
                            className="btn btn-link btn-xs text-danger" 
                            style={{ padding: '0 4px', width: '24px', flexShrink: 0 }} 
                            onClick={() => removeCriterion(i)}
                        >
                            <i className="fa fa-times" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
