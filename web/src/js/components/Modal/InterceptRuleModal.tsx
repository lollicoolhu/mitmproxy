import * as React from "react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import * as modalAction from "../../ducks/ui/modal";
import { saveRule, InterceptRule, checkDuplicate } from "../../ducks/ui/intercept";
import KeyValueListEditor from "../editors/KeyValueListEditor";

export default function InterceptRuleModal() {
    const dispatch = useAppDispatch();
    const activeRule = useAppSelector((state) => state.ui.intercept.activeRule);
    
    const [method, setMethod] = useState(activeRule?.method || "GET");
    const [path, setPath] = useState(activeRule?.path || "/");
    const [query, setQuery] = useState(activeRule?.query || "");
    const [code, setCode] = useState(activeRule?.response_code.toString() || "200");
    const [headers, setHeaders] = useState(activeRule?.response_headers || []);
    const [content, setContent] = useState(activeRule?.response_content || "");

    const onSave = async () => {
        const rule: InterceptRule = {
            id: activeRule?.id || Math.random().toString(36).substring(7),
            method,
            path,
            query,
            response_code: parseInt(code) || 200,
            response_headers: headers,
            response_content: content,
            enabled: activeRule ? activeRule.enabled : true,
        };

        const duplicate = await checkDuplicate(rule);
        if (duplicate && duplicate.id !== activeRule?.id) {
            if (!confirm("A rule with the same Method, Path, and Query already exists. Overwrite it?")) {
                return;
            }
            // Use the duplicate ID to overwrite
            rule.id = duplicate.id;
        }

        dispatch(saveRule(rule));
        dispatch(modalAction.hideModal());
    };

    const formatJson = () => {
        try {
            const obj = JSON.parse(content);
            setContent(JSON.stringify(obj, null, 4));
        } catch (e) {
            alert("Invalid JSON content");
        }
    };

    const stopKeyPropagation = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="intercept-rule-modal" key={activeRule?.id}>
            <div className="modal-header">
                <button
                    type="button"
                    className="close"
                    data-dismiss="modal"
                    onClick={() => dispatch(modalAction.hideModal())}
                >
                    &times;
                </button>
                <div className="modal-title">Edit Intercept Rule</div>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-group">
                    <label>Method</label>
                    <input
                        className="form-control"
                        value={method}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => setMethod(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Path</label>
                    <input
                        className="form-control"
                        value={path}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => setPath(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Query (key=value, matches if all exist)</label>
                    <input
                        className="form-control"
                        value={query}
                        placeholder="e.g. id=123&type=test"
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Response Code</label>
                    <input
                        type="text"
                        className="form-control"
                        value={code}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => setCode(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Response Headers</label>
                    <div onKeyDownCapture={stopKeyPropagation}>
                        <KeyValueListEditor
                            data={headers}
                            onChange={(newHeaders) => setHeaders(newHeaders)}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <div className="flex-row justify-between mb-1">
                        <label>Response Content</label>
                        <button className="btn btn-default btn-xs" onClick={formatJson}>Format JSON</button>
                    </div>
                    <textarea
                        className="form-control"
                        rows={8}
                        value={content}
                        onKeyDown={stopKeyPropagation}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn btn-primary" onClick={onSave}>Save</button>
            </div>
        </div>
    );
}
