import * as React from "react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import type { InterceptRule } from "../../ducks/ui/intercept";
import { updateActiveRule } from "../../ducks/ui/intercept";
import MatchRuleEditor from "./MatchRuleEditor";
import KeyValueListEditor from "../editors/KeyValueListEditor";
import Button from "../common/Button";
import CodeEditor from "../contentviews/CodeEditor";
import { SyntaxHighlight } from "../../backends/consts";

export default function InterceptRuleEditor({ rule }: { rule: InterceptRule }) {
    const dispatch = useAppDispatch();
    const selectedFlow = useAppSelector(state => state.flows.selected[0]);
    const [showSource, setShowSource] = useState(true);
    const [formatError, setFormatError] = useState<string | null>(null);

    const stopKeyPropagation = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    const formatJson = () => {
        try {
            const obj = JSON.parse(rule.response_content);
            dispatch(updateActiveRule({ response_content: JSON.stringify(obj, null, 4) }));
            setFormatError(null);
        } catch (e: any) {
            setFormatError(e.message);
        }
    };

    const minifyJson = () => {
        try {
            const obj = JSON.parse(rule.response_content);
            dispatch(updateActiveRule({ response_content: JSON.stringify(obj) }));
            setFormatError(null);
        } catch (e: any) {
            setFormatError(e.message);
        }
    };

    const methods = ["ANY", "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

    const ref = rule.reference_info || (selectedFlow ? {
        path: selectedFlow.request.path,
        query: selectedFlow.request.query,
        headers: selectedFlow.request.headers,
        cookies: selectedFlow.request.cookies,
        body: undefined
    } : null);

    const queryToKv = (q: any): [string, string][] => {
        if (!q || typeof q !== 'string') return [];
        return q.split('&').filter(p => p.includes('=')).map(part => {
            const [k, v] = part.split('=');
            return [k || "", v || ""];
        });
    };

    const headerToKv = (headers: any[]): [string, string][] => {
        if (!Array.isArray(headers)) return [];
        return headers.map(h => [h?.key || "", h?.value || ""]);
    };

    const kvToHeader = (kv: [string, string][]) => {
        return kv.map(([k, v]) => ({ key: k, value: v, operator: "eq" }));
    };

    return (
        <div className="intercept-rule-editor">
            {/* Source Flow Reference Section */}
            {ref && (
                <div className="mb-4" style={{ border: '1px dashed #ccc', borderRadius: '4px', background: '#fcfcfc' }}>
                    <div 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px', cursor: 'pointer', borderBottom: showSource ? '1px solid #eee' : 'none' }}
                        onClick={() => setShowSource(!showSource)}
                    >
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>
                            <i className={`fa fa-caret-${showSource ? 'down' : 'right'} mr-1`} />
                            Reference: Original Request Info
                        </span>
                    </div>
                    {showSource && (
                        <div className="p-2" style={{ fontSize: '11px', color: '#555' }}>
                            <div><strong>Path:</strong> {ref.path?.split('?')[0]}</div>
                            
                            {/* Query Parameters */}
                            {ref.query && typeof ref.query === 'object' && Object.keys(ref.query).length > 0 && (
                                <div className="mt-2">
                                    <strong>Query Parameters:</strong>
                                    <div style={{ fontSize: '10px', padding: '4px 4px 4px 12px', marginTop: '2px' }}>
                                        {Object.entries(ref.query).map(([key, value]) => (
                                            <div key={key}>
                                                <span style={{ color: '#0a0', fontWeight: 'bold' }}>{key}</span>: <span style={{ color: '#555' }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Headers & Cookies */}
                            {Array.isArray(ref.headers) && ref.headers.length > 0 && (
                                <div className="mt-2">
                                    <strong>Headers:</strong>
                                    <div style={{ fontSize: '10px', padding: '4px 4px 4px 12px', marginTop: '2px' }}>
                                        {ref.headers.filter(h => Array.isArray(h) && h[0] && h[0].toLowerCase() !== 'cookie').map(([key, value], i) => (
                                            <div key={i}>
                                                <span style={{ color: '#0a0', fontWeight: 'bold' }}>{key}</span>: <span style={{ color: '#555' }}>{value}</span>
                                            </div>
                                        ))}
                                        
                                        {/* Nested Cookies under Headers */}
                                        {Array.isArray(ref.cookies) && ref.cookies.length > 0 && (
                                            <div className="mt-1">
                                                <span style={{ color: '#0a0', fontWeight: 'bold' }}>Cookie</span>: 
                                                <div style={{ paddingLeft: '12px', borderLeft: '1px solid #eee', marginLeft: '4px' }}>
                                                    {ref.cookies.map((cookie, i) => {
                                                        const key = Array.isArray(cookie) ? cookie[0] : "";
                                                        const value = Array.isArray(cookie) ? cookie[1] : "";
                                                        return (
                                                            <div key={i}>
                                                                <span style={{ color: '#9a0', fontWeight: 'bold' }}>{key}</span>: <span style={{ color: '#555' }}>{value}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Body */}
                            {ref.body && (
                                <div className="mt-2">
                                    <strong>Body:</strong>
                                    {(() => {
                                        let contentType = "";
                                        if (Array.isArray(ref.headers)) {
                                            const ctHeader = ref.headers.find(h => Array.isArray(h) && h[0]?.toLowerCase() === 'content-type');
                                            contentType = ctHeader ? ctHeader[1] : "";
                                        }
                                        
                                        if (contentType.includes('application/json')) {
                                            try {
                                                return (
                                                    <pre style={{ fontSize: '10px', padding: '4px', marginTop: '2px', background: '#f8f8f8', border: '1px solid #eee', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                                        {JSON.stringify(JSON.parse(ref.body), null, 4)}
                                                    </pre>
                                                );
                                            } catch (e) {
                                                /* fall back to raw */
                                            }
                                        } else if (contentType.includes('application/x-www-form-urlencoded')) {
                                            const kv = queryToKv(ref.body);
                                            if (kv.length > 0) {
                                                return (
                                                    <div style={{ fontSize: '10px', padding: '4px 4px 4px 12px', marginTop: '2px' }}>
                                                        {kv.map(([k, v], i) => (
                                                            <div key={i}>
                                                                <span style={{ color: '#0a0', fontWeight: 'bold' }}>{k}</span>: <span style={{ color: '#555' }}>{v}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                        }
                                        
                                        return (
                                            <pre style={{ fontSize: '10px', padding: '4px', marginTop: '2px', background: '#f8f8f8', border: '1px solid #eee', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                                {ref.body}
                                            </pre>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="mb-4">
                <h5 style={{ borderLeft: '3px solid #5cb85c', paddingLeft: '8px', color: '#333', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px' }}>Intercept Criteria</h5>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px' }}>Method</label>
                        <select
                            className="form-control"
                            value={rule.method}
                            onChange={(e) => dispatch(updateActiveRule({ method: e.target.value }))}
                        >
                            {methods.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 3 }}>
                        <label style={{ fontSize: '11px' }}>Path</label>
                        <input
                            className="form-control"
                            value={rule.path}
                            onKeyDown={stopKeyPropagation}
                            onChange={(e) => dispatch(updateActiveRule({ path: e.target.value }))}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                    <MatchRuleEditor 
                        title="Query Matching"
                        criteria={rule.query || []}
                        onChange={(c) => dispatch(updateActiveRule({ query: c }))}
                        placeholder="Query Key"
                    />
                </div>

                <div style={{ marginTop: '16px' }}>
                    <MatchRuleEditor 
                        title="Cookie Matching"
                        criteria={rule.cookies || []}
                        onChange={(c) => dispatch(updateActiveRule({ cookies: c }))}
                        placeholder="Cookie Name"
                    />
                </div>

                <div style={{ marginTop: '16px' }}>
                    <MatchRuleEditor 
                        title="Header Matching"
                        criteria={rule.headers || []}
                        onChange={(c) => dispatch(updateActiveRule({ headers: c }))}
                        placeholder="Header Name"
                    />
                </div>

                <div style={{ marginTop: '16px' }}>
                    <MatchRuleEditor 
                        title="Body Matching (JSON)"
                        criteria={rule.body || []}
                        onChange={(c) => dispatch(updateActiveRule({ body: c }))}
                        placeholder="e.g. user.id"
                    />
                </div>
            </div>

            <hr style={{ margin: '32px 0' }} />

            <div className="mt-4">
                <h5 style={{ borderLeft: '3px solid #337ab7', paddingLeft: '8px', color: '#333', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px' }}>Mock Response</h5>
                <div className="form-group mb-4">
                    <label style={{ fontSize: '11px' }}>Response Code</label>
                    <input
                        type="text"
                        className="form-control"
                        style={{ width: '80px' }}
                        value={rule.response_code}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                dispatch(updateActiveRule({ response_code: val }));
                            }
                        }}
                    />
                </div>
                
                <div className="mb-4">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label className="m-0" style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Response Headers</label>
                        <Button className="btn-xs" icon="fa-plus" onClick={() => dispatch(updateActiveRule({ response_headers: [...(rule.response_headers || []), { key: "", operator: "eq", value: "" }] }))}>
                            Add
                        </Button>
                    </div>
                    <div onKeyDownCapture={stopKeyPropagation} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px', background: '#fff' }}>
                        <KeyValueListEditor
                            data={headerToKv(rule.response_headers || [])}
                            onChange={(kv) => dispatch(updateActiveRule({ response_headers: kvToHeader(kv) }))}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="m-0" style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Response Content</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {formatError && (
                                <span title={formatError} style={{ color: '#d9534f', fontSize: '10px', fontWeight: 'bold' }}>
                                    <i className="fa fa-exclamation-circle mr-1" />
                                    Invalid JSON
                                </span>
                            )}
                            <Button 
                                className={`btn-xs ${formatError ? 'btn-danger' : ''}`} 
                                icon="fa-compress" 
                                onClick={minifyJson}
                            >Minify</Button>
                            <Button 
                                className={`btn-xs ${formatError ? 'btn-danger' : ''}`} 
                                icon="fa-align-left" 
                                onClick={formatJson}
                            >Format</Button>
                        </div>
                    </div>
                    <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                        <CodeEditor
                            initialContent={rule.response_content}
                            onChange={(val) => dispatch(updateActiveRule({ response_content: val }))}
                            language={rule.response_headers?.some(h => h.key?.toLowerCase() === 'content-type' && h.value?.includes('json')) ? SyntaxHighlight.JAVASCRIPT : null}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
