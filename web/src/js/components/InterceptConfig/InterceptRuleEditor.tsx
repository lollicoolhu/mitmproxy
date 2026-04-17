import * as React from "react";
import { useAppDispatch } from "../../ducks";
import { updateActiveRule, InterceptRule } from "../../ducks/ui/intercept";
import KeyValueListEditor from "../editors/KeyValueListEditor";

export default function InterceptRuleEditor({ rule }: { rule: InterceptRule }) {
    const dispatch = useAppDispatch();

    const stopKeyPropagation = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    const formatJson = () => {
        try {
            const obj = JSON.parse(rule.response_content);
            dispatch(updateActiveRule({ response_content: JSON.stringify(obj, null, 4) }));
        } catch (e) {
            alert("Invalid JSON content");
        }
    };

    return (
        <>
            <div className="mb-4">
                <h5 style={{ borderLeft: '3px solid #5cb85c', paddingLeft: '8px', color: '#333', fontWeight: 'bold', fontSize: '12px' }}>Intercept Criteria</h5>
                <div className="form-group mt-3">
                    <label>Method</label>
                    <input
                        className="form-control"
                        value={rule.method}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => dispatch(updateActiveRule({ method: e.target.value }))}
                    />
                </div>
                <div className="form-group">
                    <label>Path</label>
                    <input
                        className="form-control"
                        value={rule.path}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => dispatch(updateActiveRule({ path: e.target.value }))}
                    />
                </div>
                <div className="form-group">
                    <label>Query (key=value)</label>
                    <input
                        className="form-control"
                        value={rule.query}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => dispatch(updateActiveRule({ query: e.target.value }))}
                    />
                </div>
            </div>

            <hr />

            <div className="mt-4">
                <h5 style={{ borderLeft: '3px solid #337ab7', paddingLeft: '8px', color: '#333', fontWeight: 'bold', fontSize: '12px' }}>Mock Response</h5>
                <div className="form-group mt-3">
                    <label>Response Code</label>
                    <input
                        type="text"
                        className="form-control"
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
                <div className="form-group">
                    <label>Response Headers</label>
                    <div onKeyDownCapture={stopKeyPropagation}>
                        <KeyValueListEditor
                            data={rule.response_headers}
                            onChange={(newHeaders) => dispatch(updateActiveRule({ response_headers: newHeaders }))}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <div className="flex-row justify-between mb-1 align-center">
                        <label className="m-0">Response Content</label>
                        <button className="btn btn-default btn-xs" onClick={formatJson}>Format JSON</button>
                    </div>
                    <textarea
                        className="form-control"
                        rows={12}
                        value={rule.response_content}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => dispatch(updateActiveRule({ response_content: e.target.value }))}
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                    />
                </div>
            </div>
        </>
    );
}
